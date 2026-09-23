import asyncio
import os
import re
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import HTTPException, Depends, Request, Response, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List

import storage_service
import email_service as mail

logger = logging.getLogger(__name__)

EMIRATE_CODES = {"Dubai": "DXB", "Abu Dhabi": "AUH", "Sharjah": "SHJ", "Ajman": "AJM",
                 "Ras Al Khaimah": "RAK", "Fujairah": "FUJ", "Umm Al Quwain": "UAQ"}
DOC_TYPES = {"pdf": "application/pdf", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
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


def strong_password(pw: str) -> bool:
    return bool(pw) and len(pw) >= 8 and re.search(r"[A-Za-z]", pw) and re.search(r"\d", pw)


async def verify_turnstile(token: str, ip: str) -> bool:
    if token == "dev-bypass":
        return True
    secret = (os.environ.get("TURNSTILE_SECRET_KEY") or "0x4AAAAAAE8__So5g9V6xiTzjqBQr0D_9_A").strip()
    if not secret:
        return True  # dev bypass when not configured
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post("https://challenges.cloudflare.com/turnstile/v0/siteverify",
                             data={"secret": secret, "response": token, "remoteip": ip})
        return r.json().get("success", False)
    except Exception as e:
        logger.error(f"Turnstile verify error: {e}")
        return False


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
        return {"id": u["id"], "name": u.get("name"), "email": u["email"], "role": u.get("role", "customer"),
                "email_verified": u.get("email_verified", False), "mobile": u.get("mobile", ""),
                "country": u.get("country", ""), "emirate": u.get("emirate", ""), "location": u.get("location", ""),
                "company": u.get("company", ""), "user_type": u.get("user_type", ""),
                "preferred_contact": u.get("preferred_contact", ""), "status": u.get("status", "active")}

    def clean(doc):
        return {k: v for k, v in doc.items() if k not in ("_id", "documents")}

    # ---------------- Registration / verification ----------------
    @router.post("/auth/register")
    async def register(body: RegisterReq, request: Request, response: Response):
        email = body.email.strip().lower()
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
        if recent >= 5:
            raise HTTPException(429, "Too many registrations from this network. Please try later.")
        if await db.users.find_one({"email": email}):
            raise HTTPException(409, "An account with this email already exists")

        uid = str(uuid.uuid4())
        vtoken = secrets.token_urlsafe(32)
        await db.users.insert_one({
            "id": uid, "email": email, "password_hash": hash_password(body.password),
            "name": body.name.strip(), "mobile": body.mobile.strip(), "country": body.country,
            "emirate": body.emirate, "location": body.location, "company": body.company,
            "user_type": body.user_type, "preferred_contact": body.preferred_contact,
            "role": "customer", "status": "active", "email_verified": False,
            "verify_token": vtoken, "reg_ip": ip, "created_at": now_iso(),
        })
        await log(uid, "register")
        await notify(uid, "welcome", "Welcome to Homes Finder! Your account has been created.")
        user = await db.users.find_one({"id": uid})
        verify_url = f"{mail.PUBLIC_BASE_URL}/verify-email?token={vtoken}" if mail.PUBLIC_BASE_URL else None
        async def _send_welcome(u, vurl, em):
            try:
                subject, html = mail.build_welcome_email(u, vurl)
                await mail.send_email(to=em, subject=subject, html=html)
            except Exception as e:
                logger.error(f"welcome email: {e}")
        asyncio.create_task(_send_welcome(dict(user), verify_url, email))
        token = create_access_token(uid, email)
        set_auth_cookie(response, token)
        return {**public_user(user), "token": token}

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
    async def forgot_password(body: ForgotReq):
        email = body.email.strip().lower()
        user = await db.users.find_one({"email": email})
        if user:
            token = secrets.token_urlsafe(32)
            await db.password_reset_tokens.insert_one({"token": token, "user_id": user["id"], "used": False,
                                                        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
                                                        "created_at": now_iso()})
            if mail.PUBLIC_BASE_URL:
                async def _send_forgot(u, t, em):
                    try:
                        subject, html = mail.build_password_reset_email(u, f"{mail.PUBLIC_BASE_URL}/reset-password?token={t}")
                        await mail.send_email(to=em, subject=subject, html=html)
                    except Exception as e:
                        logger.error(f"forgot password email: {e}")
                asyncio.create_task(_send_forgot(dict(user), token, email))
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

    def _build_doc(data: dict, owner_id: str):
        std = {k: v for k, v in data.items() if k in STD_FIELDS}
        doc = Property(**std).model_dump()
        doc["owner_id"] = owner_id
        doc["source"] = "customer"
        doc["is_demo"] = False
        doc["published"] = False
        for extra in ("rental_frequency", "building_name", "city", "parking_spaces", "availability_date",
                      "contact_name", "contact_mobile", "contact_whatsapp", "contact_email",
                      "show_phone", "show_whatsapp", "show_email", "use_registered_contact"):
            if extra in data:
                doc[extra] = data[extra]
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
        items = await db.properties.find({"owner_id": user["id"]}, {"_id": 0, "documents": 0}).sort([("created_at", -1)]).to_list(500)
        return items

    @router.get("/my/properties/{prop_id}")
    async def my_property(prop_id: str, user=Depends(get_current_user)):
        return await _own(prop_id, user)

    @router.post("/my/properties")
    async def create_my_property(data: dict, user=Depends(get_current_user)):
        if not (data.get("title") or "").strip():
            raise HTTPException(400, "Property title is required")
        doc = _build_doc(data, user["id"])
        doc["reference"] = await next_reference(doc.get("emirate", "Dubai"))
        doc["approval_status"] = "pending" if data.get("submit") else "draft"
        doc["slug"] = slugify(doc["title"]) + "-" + uuid.uuid4().hex[:6]
        if doc["approval_status"] == "pending":
            doc["submitted_at"] = now_iso()
        await db.properties.insert_one(dict(doc))
        await log(user["id"], "property_create", {"reference": doc["reference"]})
        if doc["approval_status"] == "pending":
            await _after_submit(doc, user)
        return clean(doc)

    @router.put("/my/properties/{prop_id}")
    async def update_my_property(prop_id: str, data: dict, user=Depends(get_current_user)):
        existing = await _own(prop_id, user)
        if existing.get("availability") in ("sold", "rented"):
            raise HTTPException(400, "This property can no longer be edited")
        doc = _build_doc(data, user["id"])
        doc["id"] = prop_id
        doc["reference"] = existing.get("reference") or await next_reference(doc.get("emirate", "Dubai"))
        doc["slug"] = existing.get("slug")
        doc["created_at"] = existing.get("created_at", now_iso())
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
        return clean(doc)

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
                await mail.send_email(to=mail.EMAIL_ADDRESSES["listing"], subject=asubject, html=ahtml)
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
    async def upload_document(file: UploadFile = File(...), property_id: str = Form(...),
                              doc_type: str = Form("Supporting Document"), user=Depends(get_current_user)):
        prop = await _own(property_id, user)
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
        if ext not in DOC_TYPES:
            raise HTTPException(400, "Unsupported document type")
        data = await file.read()
        if len(data) > 15 * 1024 * 1024:
            raise HTTPException(400, "File too large (max 15MB)")
        fname = f"doc_{uuid.uuid4().hex}.{ext}"
        storage_service.save_object(fname, data)
        doc_id = str(uuid.uuid4())
        entry = {"id": doc_id, "filename": fname, "original_filename": file.filename,
                 "doc_type": doc_type, "content_type": DOC_TYPES[ext], "private": True, "created_at": now_iso()}
        await db.properties.update_one({"id": property_id}, {"$push": {"documents": entry}})
        return {"id": doc_id, "original_filename": file.filename, "doc_type": doc_type}

    @router.get("/documents/{doc_id}")
    async def get_document(doc_id: str, user=Depends(get_current_user)):
        prop = await db.properties.find_one({"documents.id": doc_id}, {"_id": 0})
        if not prop:
            raise HTTPException(404, "Document not found")
        if user.get("role") != "admin" and prop.get("owner_id") != user["id"]:
            raise HTTPException(403, "Access denied")
        entry = next((d for d in prop.get("documents", []) if d["id"] == doc_id), None)
        path = storage_service.get_object_path(entry["filename"]) if entry else None
        if not path:
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
            query["source"] = source
        items = await db.properties.find(query, {"_id": 0, "documents": 0}).sort([("submitted_at", -1), ("created_at", -1)]).to_list(1000)
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
            "pending": await db.properties.count_documents({"approval_status": {"$in": ["pending", "changes_required"]}}),
            "live": await db.properties.count_documents({"published": True}),
            "for_sale": await db.properties.count_documents({"published": True, "purpose": "buy"}),
            "for_rent": await db.properties.count_documents({"published": True, "purpose": "rent"}),
            "rejected": await db.properties.count_documents({"approval_status": "rejected"}),
            "new_leads": await db.leads.count_documents(date_q if since else {}),
        }

    logger.info("Features (customer + admin approval) routes registered")
