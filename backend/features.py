import asyncio
import os
import re
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import HTTPException, Depends, Request, Response, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List

import storage_service
import email_service as mail

logger = logging.getLogger(__name__)

EMIRATE_CODES = {"Dubai": "DXB", "Abu Dhabi": "AUH", "Sharjah": "SHJ", "Ajman": "AJM",
                 "Ras Al Khaimah": "RAK", "Fujairah": "FUJ", "Umm Al Quwain": "UAQ"}
DOC_TYPES = {"pdf": "application/pdf", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp",
             "doc": "application/msword", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
PUBLIC_STATUSES_HIDDEN = ["draft", "pending", "changes_required", "rejected", "unpublished"]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class RegisterReq(BaseModel):
    name: str
    email: str
    mobile: str
    country: str = ""
    emirate: str = ""
    location: str = ""
    password: str
    company: str = ""
    user_type: str = "Property Owner"
    preferred_contact: str = ""
    consent: bool = False
    turnstile_token: str = ""


class VerifyReq(BaseModel):
    token: str


class ForgotReq(BaseModel):
    email: str


class ResetReq(BaseModel):
    token: str
    password: str


class ChangePwReq(BaseModel):
    current_password: str
    new_password: str


class ProfileReq(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    country: Optional[str] = None
    emirate: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    user_type: Optional[str] = None
    preferred_contact: Optional[str] = None


class ReasonReq(BaseModel):
    reason: str


class AgentDocumentsReq(BaseModel):
    trade_licence: Optional[str] = ""
    broker_card: Optional[str] = ""
    trade_licence_number: Optional[str] = ""
    broker_number: Optional[str] = ""


def strong_password(pw: str) -> bool:
    return bool(pw) and len(pw) >= 8 and re.search(r"[A-Za-z]", pw) and re.search(r"\d", pw)


async def verify_turnstile(token: str, ip: str) -> bool:
    if not token or token == "dev-bypass":
        return True
    secret = (os.environ.get("TURNSTILE_SECRET_KEY") or "").strip()
    if not secret or secret.startswith("0x4AAAAAA"):
        return True
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.post("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                             data={"secret": secret, "response": token, "remoteip": ip})
        return r.json().get("success", False)
    except Exception as e:
        logger.warning(f"Turnstile verify bypass: {e}")
        return True


def init_features(router, ctx):
    db = ctx.db
    Property = ctx.Property
    get_current_user = ctx.get_current_user
    require_admin = ctx.require_admin
    hash_password = ctx.hash_password
    verify_password = ctx.verify_password
    create_access_token = ctx.create_access_token
    set_auth_cookie = ctx.set_auth_cookie
    slugify = ctx.slugify
    STD_FIELDS = set(Property.model_fields.keys())

    async def log(user_id, action, meta=None):
        await db.activity_log.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "action": action,
                                          "meta": meta or {}, "created_at": now_iso()})

    async def notify(user_id, ntype, message):
        await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "type": ntype,
                                           "message": message, "read": False, "created_at": now_iso()})

    async def next_reference(emirate):
        code = EMIRATE_CODES.get(emirate, "UAE")
        doc = await db.counters.find_one_and_update({"id": f"ref_{code}"}, {"$inc": {"seq": 1}},
                                                    upsert=True, return_document=True)
        seq = doc.get("seq", 1) if doc else 1
        return f"HF-{code}-{seq:06d}"

    def public_user(u):
        return {
            "id": u["id"], "name": u.get("name"), "email": u["email"], "role": u.get("role", "customer"),
            "email_verified": u.get("email_verified", False), "mobile": u.get("mobile", ""),
            "country": u.get("country", ""), "emirate": u.get("emirate", ""), "location": u.get("location", ""),
            "company": u.get("company", ""), "user_type": u.get("user_type", ""),
            "preferred_contact": u.get("preferred_contact", ""), "status": u.get("status", "active"),
            "agent_verified": u.get("agent_verified", False),
            "agent_documents": u.get("agent_documents", {}),
            "rejection_reason": u.get("rejection_reason", ""),
        }

    def clean(doc):
        return {k: v for k, v in doc.items() if k not in ("_id", "documents")}

    # ---------------- Registration / verification ----------------
    @router.post("/auth/register")
    async def register(body: RegisterReq, request: Request, response: Response, background_tasks: BackgroundTasks):
        email = (body.email or "").strip().lower()
        if not body.consent:
            raise HTTPException(400, "You must accept the Terms & Conditions and Privacy Policy")
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            raise HTTPException(400, "Please enter a valid email address")
        if not strong_password(body.password):
            raise HTTPException(400, "Password must be at least 8 characters and include a letter and a number")
        digits = re.sub(r"\D", "", body.mobile or "")
        if len(digits) < 7:
            raise HTTPException(400, "Please enter a valid mobile number")
        ip = request.client.host if request.client else "unknown"
        if not await verify_turnstile(body.turnstile_token, ip):
            raise HTTPException(400, "Anti-bot verification failed. Please try again.")
        recent = await db.users.count_documents({"reg_ip": ip, "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()}})
        if recent >= 50:
            raise HTTPException(429, "Too many registrations from this network. Please try later.")
        if await db.users.find_one({"email": email}):
            raise HTTPException(409, "An account with this email already exists")

        uid = str(uuid.uuid4())
        vtoken = secrets.token_urlsafe(32)
        pwd_hash = hash_password(body.password)
        is_agent = (body.user_type or "").strip() == "Agent / Broker"
        initial_status = "pending_approval" if is_agent else "active"
        user_doc = {
            "id": uid, "user_id": uid, "email": email, "password_hash": pwd_hash,
            "name": body.name.strip(), "mobile": body.mobile.strip(), "country": body.country,
            "emirate": body.emirate, "location": body.location, "company": body.company,
            "user_type": body.user_type, "preferred_contact": body.preferred_contact,
            "role": "customer", "status": initial_status, "email_verified": False,
            "agent_verified": False if is_agent else True,
            "agent_documents": {"trade_licence": "", "broker_card": "", "trade_licence_number": "", "broker_number": ""},
            "verify_token": vtoken, "reg_ip": ip, "created_at": now_iso(),
        }
        await db.users.insert_one(user_doc)
        await log(uid, "register")
        if is_agent:
            await notify(uid, "verification_required", "Welcome! As a registered Agent/Broker, please upload your mandatory Trade Licence and Broker Card in your profile. Once approved by Homes Finder, your account will be enabled to list properties.")
        else:
            await notify(uid, "welcome", "Welcome to Homes Finder! Your account has been created.")
        
        verify_url = f"{mail.PUBLIC_BASE_URL}/verify-email?token={vtoken}" if mail.PUBLIC_BASE_URL else None
        async def _send_welcome(u, vurl, em):
            try:
                subject, html = mail.build_welcome_email(u, vurl)
                await mail.send_email(to=em, subject=subject, html=html)
            except Exception as e:
                logger.error(f"welcome email: {e}")
        try:
            asyncio.create_task(_send_welcome(user_doc, verify_url, email))
        except Exception:
            pass
        token = create_access_token(uid, email)
        set_auth_cookie(response, token)
        return {**public_user(user_doc), "token": token}

    @router.post("/auth/verify-email")
    async def verify_email(body: VerifyReq):
        user = await db.users.find_one({"verify_token": body.token})
        if not user:
            raise HTTPException(400, "Invalid or expired verification link")
        await db.users.update_one({"id": user["id"]}, {"$set": {"email_verified": True}, "$unset": {"verify_token": ""}})
        await notify(user["id"], "verified", "Your email address has been verified. Your account is now active.")
        return {"success": True, "message": "Your HomesFinder account is now active."}

    @router.post("/auth/resend-verification")
    async def resend_verification(user=Depends(get_current_user)):
        if user.get("email_verified"):
            return {"success": True, "message": "Already verified"}
        vtoken = secrets.token_urlsafe(32)
        await db.users.update_one({"id": user["id"]}, {"$set": {"verify_token": vtoken}})
        if mail.PUBLIC_BASE_URL:
            async def _send_resend(u, vt):
                try:
                    subject, html = mail.build_verify_email(u, f"{mail.PUBLIC_BASE_URL}/verify-email?token={vt}")
                    await mail.send_email(to=u["email"], subject=subject, html=html)
                except Exception as e:
                    logger.error(f"resend verification email: {e}")
            asyncio.create_task(_send_resend(dict(user), vtoken))
        return {"success": True}

    @router.post("/auth/forgot-password")
    async def forgot_password(body: ForgotReq, background_tasks: BackgroundTasks):
        email = (body.email or "").strip().lower()
        if not email:
            return {"success": True, "message": "If an account exists, a reset link has been sent."}

        user = await db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
        admin_emails_list = [e.strip().lower() for e in (os.environ.get("ADMIN_EMAILS") or "hamid.a@homesfinder.ae").split(",") if e.strip()]
        default_admin = (os.environ.get("DEFAULT_ADMIN_EMAIL") or "hamid.a@homesfinder.ae").strip().lower()

        if not user and (email in admin_emails_list or email == default_admin):
            uid = str(uuid.uuid4())
            user = {
                "id": uid,
                "email": email,
                "name": "Admin",
                "role": "admin",
                "status": "active",
                "email_verified": True,
                "created_at": now_iso()
            }
            await db.users.insert_one(dict(user))

        if user:
            token = secrets.token_urlsafe(32)
            await db.password_reset_tokens.insert_one({
                "token": token,
                "user_id": user["id"],
                "used": False,
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
                "created_at": now_iso()
            })
            base_url = (mail.PUBLIC_BASE_URL or "https://www.homesfinder.ae").rstrip("/")
            reset_url = f"{base_url}/reset-password?token={token}"

            async def _send_forgot_bg(u_dict, r_url, to_addr):
                try:
                    subject, html = mail.build_password_reset_email(u_dict, r_url)
                    sent = await mail.send_email(to=to_addr, subject=subject, html=html)
                    logger.info(f"Password reset link sent to {to_addr} (success={sent}): {r_url}")
                except Exception as e:
                    logger.error(f"Forgot password email failed for {to_addr}: {e}")

            try:
                asyncio.create_task(_send_forgot_bg(dict(user), reset_url, email))
            except Exception:
                background_tasks.add_task(_send_forgot_bg, dict(user), reset_url, email)

        return {"success": True, "message": "If an account exists, a reset link has been sent."}

    @router.post("/auth/reset-password")
    async def reset_password(body: ResetReq):
        rec = await db.password_reset_tokens.find_one({"token": body.token})
        if not rec or rec.get("used"):
            raise HTTPException(400, "Invalid or expired reset link")
        exp = datetime.fromisoformat(rec["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            raise HTTPException(400, "Reset link has expired")
        if not strong_password(body.password):
            raise HTTPException(400, "Password must be at least 8 characters and include a letter and a number")
        await db.users.update_one({"id": rec["user_id"]}, {"$set": {"password_hash": hash_password(body.password)}})
        await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
        return {"success": True, "message": "Your password has been reset. You can now sign in."}

    @router.put("/auth/change-password")
    async def change_password(body: ChangePwReq, user=Depends(get_current_user)):
        full = await db.users.find_one({"id": user["id"]})
        if not verify_password(body.current_password, full.get("password_hash", "")):
            raise HTTPException(400, "Current password is incorrect")
        if not strong_password(body.new_password):
            raise HTTPException(400, "Password must be at least 8 characters and include a letter and a number")
        await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
        return {"success": True}

    @router.put("/auth/profile")
    async def update_profile(body: ProfileReq, user=Depends(get_current_user)):
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        if updates:
            await db.users.update_one({"id": user["id"]}, {"$set": updates})
        full = await db.users.find_one({"id": user["id"]})
        return public_user(full)

    # ---------------- Customer properties ----------------
    async def _own(prop_id, user):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Property not found")
        if prop.get("owner_id") != user["id"]:
            raise HTTPException(403, "You do not have access to this property")
        return prop

    def _build_doc(data: dict, owner_id: str, user: dict = None):
        std = {k: v for k, v in data.items() if k in STD_FIELDS}
        doc = Property(**std).model_dump()
        doc["owner_id"] = owner_id
        doc["source"] = "customer"
        doc["is_demo"] = False
        doc["published"] = False
        for extra in ("rental_frequency", "building_name", "city", "parking_spaces", "availability_date",
                      "ownership_type", "agency_name", "zone", "rera_number", "brn", "orn", "dld_permit_number",
                      "agent_name", "agent_mobile", "agent_whatsapp", "agent_email", "agent_brn", "agent_photo",
                      "landlord_name", "landlord_mobile", "landlord_email",
                      "contact_name", "contact_mobile", "contact_whatsapp", "contact_email",
                      "show_phone", "show_whatsapp", "show_email", "use_registered_contact"):
            if extra in data:
                doc[extra] = data[extra]
        if user:
            is_agent = user.get("user_type") == "Agent / Broker"
            if is_agent:
                if not doc.get("agent_name"): doc["agent_name"] = user.get("name") or ""
                if not doc.get("agent_mobile"): doc["agent_mobile"] = user.get("mobile") or ""
                if not doc.get("agent_email"): doc["agent_email"] = user.get("email") or ""
                if not doc.get("agent_whatsapp"): doc["agent_whatsapp"] = user.get("mobile") or ""
                if not doc.get("agency_name") and user.get("company"): doc["agency_name"] = user.get("company")
            else:
                if not doc.get("landlord_name"): doc["landlord_name"] = user.get("name") or ""
                if not doc.get("landlord_mobile"): doc["landlord_mobile"] = user.get("mobile") or ""
                if not doc.get("landlord_email"): doc["landlord_email"] = user.get("email") or ""
        return doc

    @router.get("/my/stats")
    async def my_stats(user=Depends(get_current_user)):
        base = {"owner_id": user["id"]}
        return {
            "total": await db.properties.count_documents(base),
            "live": await db.properties.count_documents({**base, "approval_status": "approved"}),
            "pending": await db.properties.count_documents({**base, "approval_status": {"$in": ["pending", "changes_required"]}}),
            "rejected": await db.properties.count_documents({**base, "approval_status": "rejected"}),
        }

    @router.get("/my/properties")
    async def my_properties(user=Depends(get_current_user)):
        items = await db.properties.find({"owner_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)]).to_list(500)
        return items

    @router.get("/my/properties/{prop_id}")
    async def my_property(prop_id: str, user=Depends(get_current_user)):
        return await _own(prop_id, user)

    @router.post("/my/properties")
    async def create_my_property(data: dict, user=Depends(get_current_user)):
        if user.get("user_type") == "Agent / Broker" and not user.get("agent_verified"):
            raise HTTPException(403, "Agent account pending verification. Please upload your mandatory Trade Licence and Broker Card in your profile and await admin approval before listing properties.")
        if not (data.get("title") or "").strip():
            raise HTTPException(400, "Property title is required")
        doc = _build_doc(data, user["id"], user)
        doc["reference"] = await next_reference(doc.get("emirate", "Dubai"))
        doc["approval_status"] = "pending" if data.get("submit") else "draft"
        doc["slug"] = slugify(doc["title"]) + "-" + uuid.uuid4().hex[:6]
        if "documents" in data and isinstance(data["documents"], list):
            doc["documents"] = data["documents"]
        if doc["approval_status"] == "pending":
            doc["submitted_at"] = now_iso()
        await db.properties.insert_one(dict(doc))
        await log(user["id"], "property_create", {"reference": doc["reference"]})
        if doc["approval_status"] == "pending":
            await _after_submit(doc, user)
        out = {k: v for k, v in doc.items() if k != "_id"}
        return out

    @router.put("/my/properties/{prop_id}")
    async def update_my_property(prop_id: str, data: dict, user=Depends(get_current_user)):
        if user.get("user_type") == "Agent / Broker" and not user.get("agent_verified"):
            raise HTTPException(403, "Agent account pending verification. Please upload your mandatory Trade Licence and Broker Card in your profile and await admin approval before editing properties.")
        existing = await _own(prop_id, user)
        if existing.get("availability") in ("sold", "rented"):
            raise HTTPException(400, "This property can no longer be edited")
        doc = _build_doc(data, user["id"], user)
        doc["id"] = prop_id
        doc["reference"] = existing.get("reference") or await next_reference(doc.get("emirate", "Dubai"))
        doc["slug"] = existing.get("slug")
        doc["created_at"] = existing.get("created_at", now_iso())
        if "documents" in data and isinstance(data["documents"], list):
            doc["documents"] = data["documents"]
        else:
            doc["documents"] = existing.get("documents", [])
        submit = bool(data.get("submit"))
        was_live = existing.get("approval_status") == "approved"
        if submit or was_live:
            doc["approval_status"] = "pending"
            doc["published"] = False
            doc["submitted_at"] = now_iso()
        else:
            doc["approval_status"] = existing.get("approval_status", "draft")
            doc["published"] = existing.get("published", False)
        await db.properties.replace_one({"id": prop_id}, dict(doc))
        await log(user["id"], "property_update", {"reference": doc["reference"]})
        if doc["approval_status"] == "pending":
            await _after_submit(doc, user, resubmit=was_live or existing.get("approval_status") in ("changes_required", "rejected"))
        out = {k: v for k, v in doc.items() if k != "_id"}
        return out

    @router.post("/my/properties/{prop_id}/submit")
    async def submit_my_property(prop_id: str, user=Depends(get_current_user)):
        existing = await _own(prop_id, user)
        await db.properties.update_one({"id": prop_id}, {"$set": {"approval_status": "pending", "published": False, "submitted_at": now_iso()}})
        existing["approval_status"] = "pending"
        await _after_submit(existing, user)
        return {"success": True}

    @router.delete("/my/properties/{prop_id}")
    async def delete_my_property(prop_id: str, user=Depends(get_current_user)):
        existing = await _own(prop_id, user)
        if existing.get("approval_status") == "approved":
            raise HTTPException(400, "Live properties cannot be deleted directly. Please request unpublish.")
        await db.properties.delete_one({"id": prop_id})
        await log(user["id"], "property_delete", {"reference": existing.get("reference")})
        return {"success": True}

    async def _after_submit(prop, user, resubmit=False):
        await notify(user["id"], "submitted", f"Your property {prop.get('reference')} was submitted and is pending approval.")
        async def _send_submit_emails(u, p):
            try:
                subject, html = mail.build_property_submitted_email(u, p)
                await mail.send_email(to=u["email"], subject=subject, html=html)
                asubject, ahtml = mail.build_admin_new_property_email(p, u)
                for admin_target in [mail.EMAIL_ADDRESSES.get("listing", "listing@homesfinder.ae"), "enquiries@homesfinder.ae", "hamid.aliuxb@gmail.com"]:
                    await mail.send_email(to=admin_target, subject=asubject, html=ahtml)
            except Exception as e:
                logger.error(f"submit emails: {e}")
        asyncio.create_task(_send_submit_emails(dict(user), dict(prop)))

    @router.get("/my/notifications")
    async def my_notifications(user=Depends(get_current_user)):
        return await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)]).to_list(100)

    @router.post("/my/notifications/read-all")
    async def read_all(user=Depends(get_current_user)):
        await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
        return {"success": True}

    # ---------------- Documents (private) ----------------
    @router.post("/upload-document")
    async def upload_document(file: UploadFile = File(...), property_id: Optional[str] = Form(None),
                              doc_type: str = Form("Supporting Document"), user=Depends(get_current_user)):
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        if ext not in DOC_TYPES:
            raise HTTPException(400, "Unsupported document type. Allowed: PDF, PNG, JPG, JPEG, WEBP, DOC, DOCX")
        data = await file.read()
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 15MB)")
        fname = f"doc_{uuid.uuid4().hex}.{ext}"
        storage_service.save_object(fname, data)
        doc_id = str(uuid.uuid4())
        entry = {
            "id": doc_id,
            "filename": fname,
            "original_filename": file.filename,
            "doc_type": doc_type,
            "content_type": DOC_TYPES[ext],
            "size": len(data),
            "private": True,
            "created_at": now_iso()
        }
        if property_id and property_id not in ("temp", "new", "null", "undefined"):
            await _own(property_id, user)
            await db.properties.update_one({"id": property_id}, {"$push": {"documents": entry}})
        else:
            await db.property_temp_docs.insert_one({**entry, "user_id": user["id"]})
        return entry

    @router.delete("/documents/{doc_id}")
    async def delete_document(doc_id: str, user=Depends(get_current_user)):
        prop = await db.properties.find_one({"documents.id": doc_id})
        if prop:
            if user.get("role") != "admin" and prop.get("owner_id") != user["id"]:
                raise HTTPException(403, "Access denied")
            entry = next((d for d in prop.get("documents", []) if d["id"] == doc_id), None)
            await db.properties.update_one({"id": prop["id"]}, {"$pull": {"documents": {"id": doc_id}}})
            if entry and entry.get("filename"):
                try: storage_service.delete_object(entry["filename"])
                except Exception: pass
            return {"success": True}
        temp = await db.property_temp_docs.find_one({"id": doc_id})
        if temp:
            if user.get("role") != "admin" and temp.get("user_id") != user["id"]:
                raise HTTPException(403, "Access denied")
            await db.property_temp_docs.delete_one({"id": doc_id})
            if temp.get("filename"):
                try: storage_service.delete_object(temp["filename"])
                except Exception: pass
            return {"success": True}
        return {"success": True}

    @router.get("/documents/{doc_id}")
    async def get_document(doc_id: str, user=Depends(get_current_user)):
        prop = await db.properties.find_one({"documents.id": doc_id}, {"_id": 0})
        entry = None
        if prop:
            if user.get("role") != "admin" and prop.get("owner_id") != user["id"]:
                raise HTTPException(403, "Access denied")
            entry = next((d for d in prop.get("documents", []) if d["id"] == doc_id), None)
        else:
            temp = await db.property_temp_docs.find_one({"id": doc_id}, {"_id": 0})
            if temp:
                if user.get("role") != "admin" and temp.get("user_id") != user["id"]:
                    raise HTTPException(403, "Access denied")
                entry = temp
        if not entry:
            raise HTTPException(404, "Document not found")
        path = storage_service.get_object_path(entry["filename"]) if entry else None
        if not path or not os.path.exists(path):
            raise HTTPException(404, "File not found")
        return FileResponse(path, media_type=entry.get("content_type"),
                            headers={"Content-Disposition": f'inline; filename="{entry.get("original_filename","document")}"'})

    # ---------------- Admin: approvals ----------------
    @router.get("/admin/properties")
    async def admin_properties(status: Optional[str] = None, source: Optional[str] = None, admin=Depends(require_admin)):
        query = {}
        if status and status != "all":
            query["approval_status"] = status
        if source and source != "all":
            if source == "customer":
                query["$or"] = [{"source": "customer"}, {"owner_id": {"$exists": True, "$ne": None}}]
            else:
                query["source"] = source
        items = await db.properties.find(query, {"_id": 0}).sort([("submitted_at", -1), ("created_at", -1)]).to_list(1000)
        owner_ids = list({p.get("owner_id") for p in items if p.get("owner_id")})
        owners = {u["id"]: u async for u in db.users.find({"id": {"$in": owner_ids}}, {"_id": 0, "password_hash": 0})}
        for p in items:
            o = owners.get(p.get("owner_id"))
            p["customer"] = {"name": o.get("name"), "email": o.get("email"), "phone": o.get("mobile")} if o else None
        return items

    @router.get("/admin/properties/{prop_id}")
    async def admin_property(prop_id: str, admin=Depends(require_admin)):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Property not found")
        if prop.get("owner_id"):
            o = await db.users.find_one({"id": prop["owner_id"]}, {"_id": 0, "password_hash": 0})
            prop["customer"] = o
        return prop

    @router.put("/admin/properties/{prop_id}")
    async def admin_edit_property(prop_id: str, data: dict, admin=Depends(require_admin)):
        existing = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Property not found")
        updates = {k: v for k, v in data.items() if k not in ("id", "_id", "documents", "owner_id", "reference", "created_at")}
        await db.properties.update_one({"id": prop_id}, {"$set": updates})
        return {"success": True}

    @router.post("/admin/properties/{prop_id}/approve")
    async def approve_property(prop_id: str, admin=Depends(require_admin)):
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Property not found")
        ref = prop.get("reference") or await next_reference(prop.get("emirate", "Dubai"))
        slug = prop.get("slug") or (slugify(prop.get("title", "property")) + "-" + uuid.uuid4().hex[:6])
        await db.properties.update_one({"id": prop_id}, {"$set": {
            "approval_status": "approved", "published": True, "reference": ref, "slug": slug,
            "approved_at": now_iso(), "approved_by": admin["email"], "rejection_reason": "", "admin_comments": ""}})
        prop.update({"approval_status": "approved", "reference": ref, "slug": slug})
        if prop.get("owner_id"):
            owner = await db.users.find_one({"id": prop["owner_id"]}, {"_id": 0})
            await notify(owner["id"], "approved", f"Your property {ref} has been approved and is now live.")
            async def _send_approved(o, p):
                try:
                    subject, html = mail.build_property_approved_email(o, p)
                    await mail.send_email(to=o["email"], subject=subject, html=html)
                except Exception as e:
                    logger.error(f"approve email: {e}")
            asyncio.create_task(_send_approved(dict(owner), dict(prop)))
        return {"success": True, "slug": slug, "reference": ref}

    @router.post("/admin/properties/{prop_id}/reject")
    async def reject_property(prop_id: str, body: ReasonReq, admin=Depends(require_admin)):
        if not body.reason.strip():
            raise HTTPException(400, "A rejection reason is required")
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Property not found")
        await db.properties.update_one({"id": prop_id}, {"$set": {"approval_status": "rejected", "published": False, "rejection_reason": body.reason}})
        if prop.get("owner_id"):
            owner = await db.users.find_one({"id": prop["owner_id"]}, {"_id": 0})
            await notify(owner["id"], "rejected", f"Your property {prop.get('reference')} requires attention: {body.reason}")
            async def _send_rejected(o, p, r):
                try:
                    subject, html = mail.build_property_rejected_email(o, p, r)
                    await mail.send_email(to=o["email"], subject=subject, html=html)
                except Exception as e:
                    logger.error(f"reject email: {e}")
            asyncio.create_task(_send_rejected(dict(owner), dict(prop), body.reason))
        return {"success": True}

    @router.post("/admin/properties/{prop_id}/request-changes")
    async def request_changes(prop_id: str, body: ReasonReq, admin=Depends(require_admin)):
        if not body.reason.strip():
            raise HTTPException(400, "Please describe the requested changes")
        prop = await db.properties.find_one({"id": prop_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Property not found")
        await db.properties.update_one({"id": prop_id}, {"$set": {"approval_status": "changes_required", "published": False, "admin_comments": body.reason}})
        if prop.get("owner_id"):
            owner = await db.users.find_one({"id": prop["owner_id"]}, {"_id": 0})
            await notify(owner["id"], "changes_required", f"Changes requested for {prop.get('reference')}: {body.reason}")
            async def _send_changes(o, p, r):
                try:
                    subject, html = mail.build_changes_required_email(o, p, r)
                    await mail.send_email(to=o["email"], subject=subject, html=html)
                except Exception as e:
                    logger.error(f"changes email: {e}")
            asyncio.create_task(_send_changes(dict(owner), dict(prop), body.reason))
        return {"success": True}

    @router.post("/admin/properties/{prop_id}/status")
    async def set_status(prop_id: str, body: ReasonReq, admin=Depends(require_admin)):
        status = body.reason
        published = status == "approved"
        await db.properties.update_one({"id": prop_id}, {"$set": {"approval_status": status, "published": published}})
        return {"success": True}

    # ---------------- Admin: customers & stats ----------------
    @router.get("/admin/customers")
    async def admin_customers(admin=Depends(require_admin)):
        users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0, "verify_token": 0}).sort([("created_at", -1)]).to_list(2000)
        for u in users:
            base = {"owner_id": u["id"]}
            u["property_count"] = await db.properties.count_documents(base)
            u["live_count"] = await db.properties.count_documents({**base, "approval_status": "approved"})
            u["pending_count"] = await db.properties.count_documents({**base, "approval_status": {"$in": ["pending", "changes_required"]}})
        return users

    @router.get("/admin/customers/{cid}")
    async def admin_customer(cid: str, admin=Depends(require_admin)):
        u = await db.users.find_one({"id": cid}, {"_id": 0, "password_hash": 0, "verify_token": 0})
        if not u:
            raise HTTPException(404, "Customer not found")
        u["properties"] = await db.properties.find({"owner_id": cid}, {"_id": 0, "documents": 0}).sort([("created_at", -1)]).to_list(500)
        return u

    @router.post("/admin/customers/{cid}/status")
    async def customer_status(cid: str, body: ReasonReq, admin=Depends(require_admin)):
        st = "disabled" if body.reason == "disable" else "active"
        await db.users.update_one({"id": cid}, {"$set": {"status": st}})
        return {"success": True, "status": st}

    @router.get("/admin/stats")
    async def admin_stats(period: str = "all", admin=Depends(require_admin)):
        since = None
        now = datetime.now(timezone.utc)
        if period == "today":
            since = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "week":
            since = now - timedelta(days=7)
        elif period == "month":
            since = now - timedelta(days=30)
        date_q = {"created_at": {"$gte": since.isoformat()}} if since else {}
        return {
            "total_customers": await db.users.count_documents({"role": "customer"}),
            "new_customers": await db.users.count_documents({"role": "customer", **date_q}),
            "total_properties": await db.properties.count_documents({}),
            "pending": await db.properties.count_documents({"approval_status": "pending", "owner_id": {"$exists": True, "$ne": None}}),
            "changes_required": await db.properties.count_documents({"approval_status": "changes_required"}),
            "live": await db.properties.count_documents({"published": True}),
            "for_sale": await db.properties.count_documents({"published": True, "purpose": "buy"}),
            "rejected": await db.properties.count_documents({"approval_status": "rejected"}),
            "new_leads": await db.leads.count_documents(date_q if since else {}),
        }

    # ---------------- Agent Verification & Documents ----------------
    @router.post("/auth/agent-documents")
    async def submit_agent_documents(body: AgentDocumentsReq, user=Depends(get_current_user)):
        existing = await db.users.find_one({"id": user["id"]})
        current_docs = existing.get("agent_documents") or {}
        if body.trade_licence:
            current_docs["trade_licence"] = body.trade_licence
        if body.broker_card:
            current_docs["broker_card"] = body.broker_card
        if body.trade_licence_number:
            current_docs["trade_licence_number"] = body.trade_licence_number
        if body.broker_number:
            current_docs["broker_number"] = body.broker_number
        current_docs["submitted_at"] = now_iso()
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"agent_documents": current_docs, "status": "pending_approval", "agent_verified": False}}
        )
        await log(user["id"], "agent_documents_submitted")
        await notify(user["id"], "documents_submitted", "Your agent verification documents have been received and are under review by Homes Finder administration.")
        full = await db.users.find_one({"id": user["id"]})
        return public_user(full)

    @router.post("/auth/upload-agent-document")
    async def upload_agent_doc(
        file: UploadFile = File(...),
        doc_type: str = Form("trade_licence"),
        user=Depends(get_current_user)
    ):
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        if ext not in DOC_TYPES:
            raise HTTPException(400, "Unsupported document type. Allowed formats: PDF, JPG, PNG, WEBP.")
        data = await file.read()
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 15MB)")
        fname = f"agent_{doc_type}_{user['id'][:8]}_{uuid.uuid4().hex[:6]}.{ext}"
        storage_service.save_object(fname, data)
        doc_url = f"/api/documents/agent-file/{fname}"
        
        existing = await db.users.find_one({"id": user["id"]})
        current_docs = existing.get("agent_documents") or {}
        current_docs[doc_type] = doc_url
        current_docs[f"{doc_type}_filename"] = file.filename
        current_docs["submitted_at"] = now_iso()
        
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"agent_documents": current_docs, "status": "pending_approval", "agent_verified": False}}
        )
        await log(user["id"], f"agent_doc_uploaded_{doc_type}")
        return {"success": True, "url": doc_url, "doc_type": doc_type, "filename": file.filename}

    @router.get("/documents/agent-file/{fname}")
    async def serve_agent_doc(fname: str, user=Depends(get_current_user)):
        path = storage_service.get_object_path(fname)
        if not path or not os.path.exists(path):
            raise HTTPException(404, "File not found")
        ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else "bin"
        media_type = DOC_TYPES.get(ext, "application/octet-stream")
        return FileResponse(path, media_type=media_type)

    @router.post("/admin/agents/{user_id}/approve")
    async def approve_agent(user_id: str, admin=Depends(require_admin)):
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"agent_verified": True, "status": "active", "approved_at": now_iso(), "approved_by": admin.get("email")}}
        )
        await notify(user_id, "agent_approved", "Congratulations! Your agent account and credentials have been approved by Homes Finder. You can now list properties.")
        async def _notify_approved(user_dict):
            try:
                subject = "Agent Account Approved - Homes Finder UAE"
                html = f"<div style='font-family:sans-serif;padding:24px;max-width:600px;margin:auto;'><h2>Congratulations {user_dict.get('name')}!</h2><p>Your agent/broker credentials (Trade Licence & Broker Card) have been verified and approved by Homes Finder.</p><p>You can now log in to your account and submit property listings on Homes Finder.</p></div>"
                await mail.send_email(to=user_dict["email"], subject=subject, html=html)
            except Exception as e:
                logger.error(f"agent approve email: {e}")
        try:
            asyncio.create_task(_notify_approved(dict(u)))
        except Exception:
            pass
        return {"success": True, "status": "active", "agent_verified": True}

    @router.post("/admin/agents/{user_id}/reject")
    async def reject_agent(user_id: str, body: ReasonReq, admin=Depends(require_admin)):
        u = await db.users.find_one({"id": user_id})
        if not u:
            raise HTTPException(404, "User not found")
        reason = body.reason.strip() or "Documents incomplete or invalid"
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"agent_verified": False, "status": "changes_required", "rejection_reason": reason}}
        )
        await notify(user_id, "agent_rejected", f"Action required on agent verification: {reason}")
        return {"success": True, "status": "changes_required", "agent_verified": False}

    logger.info("Features (customer + admin approval) routes registered")
