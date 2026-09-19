import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import uuid
import logging
import re
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, UploadFile, File, Response
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

import storage_service
import features
from types import SimpleNamespace
from email_service import send_email, build_lead_email, route_recipient, build_enquiry_ack_email
from seed_data import DEMO_PROPERTIES, DEFAULT_SETTINGS

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', ADMIN_EMAIL)
JWT_ALGORITHM = "HS256"
TOKEN_TTL_DAYS = 7
COOKIE_SAMESITE = os.environ.get('COOKIE_SAMESITE', 'none')
COOKIE_SECURE = os.environ.get('COOKIE_SECURE', 'true').lower() == 'true'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

MIME_TYPES = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return s or uuid.uuid4().hex[:8]


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET") or "homesfinder-super-secure-jwt-secret-2026"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        if hashed and (hashed.startswith("$2b$") or hashed.startswith("$2a$")):
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        return bool(plain and hashed and plain == hashed)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True, secure=COOKIE_SECURE,
                        samesite=COOKIE_SAMESITE, path="/", max_age=TOKEN_TTL_DAYS * 24 * 3600)


# ---------------- Models ----------------
class LoginRequest(BaseModel):
    email: str
    password: str


class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str = ""
    title: str
    purpose: str = "buy"
    category: str = "residential"
    property_type: str = "Apartment"
    status: str = "ready"
    availability: str = "available"
    emirate: str = "Dubai"
    community: str = ""
    location: str = ""
    price: float = 0
    price_period: str = ""
    bedrooms: int = 0
    bathrooms: int = 0
    area: float = 0
    plot_area: Optional[float] = None
    furnished: str = "unfurnished"
    developer: str = ""
    completion_date: str = ""
    service_charges: str = ""
    handover: str = ""
    payment_plan: str = ""
    rental_yield: str = ""
    roi: str = ""
    description: str = ""
    features: List[str] = []
    amenities: List[str] = []
    location_advantages: List[str] = []
    nearby_schools: List[str] = []
    nearby_hospitals: List[str] = []
    nearby_transport: List[str] = []
    investment_highlights: List[str] = []
    images: List[str] = []
    video_url: str = ""
    virtual_tour_url: str = ""
    permit_number: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    map_url: str = ""
    featured: bool = False
    is_demo: bool = True
    published: bool = True
    approval_status: str = "approved"
    source: str = "admin"
    owner_id: str = ""
    reference: str = ""
    rental_frequency: str = ""
    building_name: str = ""
    city: str = ""
    parking_spaces: Optional[int] = None
    availability_date: str = ""
    contact_name: str = ""
    contact_mobile: str = ""
    contact_whatsapp: str = ""
    contact_email: str = ""
    show_phone: bool = False
    show_whatsapp: bool = True
    show_email: bool = False
    use_registered_contact: bool = True
    created_at: str = Field(default_factory=now_iso)


class LeadCreate(BaseModel):
    name: str
    mobile: str
    email: Optional[str] = ""
    requirement: str = "General Enquiry"
    property_id: Optional[str] = ""
    property_title: Optional[str] = ""
    location: Optional[str] = ""
    property_type: Optional[str] = ""
    bedrooms: Optional[str] = ""
    property_size: Optional[str] = ""
    expected_price: Optional[str] = ""
    message: Optional[str] = ""


class LeadStatusUpdate(BaseModel):
    status: str


# ---------------- Auth helpers ----------------
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    token = request.cookies.get("access_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"$or": [{"id": payload["sub"]}, {"user_id": payload["sub"]}]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.get("id"):
        user["id"] = user.get("user_id")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------- Auth endpoints ----------------
@api_router.post("/auth/login")
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until:
            lu = datetime.fromisoformat(locked_until) if isinstance(locked_until, str) else locked_until
            if lu.tzinfo is None:
                lu = lu.replace(tzinfo=timezone.utc)
            if lu > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], user["email"])
    set_auth_cookie(response, token)
    return {"id": user["id"], "email": user["email"], "name": user.get("name"),
            "role": user.get("role", "user"), "token": token}


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


# ---------------- Properties ----------------
@api_router.get("/properties")
async def list_properties(
    purpose: Optional[str] = None, category: Optional[str] = None,
    property_type: Optional[str] = None, emirate: Optional[str] = None,
    community: Optional[str] = None, status: Optional[str] = None,
    min_price: Optional[float] = None, max_price: Optional[float] = None,
    bedrooms: Optional[int] = None, furnished: Optional[str] = None,
    featured: Optional[bool] = None, q: Optional[str] = None,
    sort: str = "featured", limit: int = 100, admin: bool = False,
):
    query = {}
    if not admin:
        query["published"] = True
    if purpose and purpose != "all":
        query["purpose"] = purpose
    if category and category != "all":
        query["category"] = category
    if property_type and property_type != "all":
        query["property_type"] = property_type
    if emirate and emirate != "all":
        query["emirate"] = emirate
    if community and community != "all":
        query["community"] = community
    if status and status != "all":
        query["status"] = status
    if furnished and furnished != "all":
        query["furnished"] = furnished
    if bedrooms:
        query["bedrooms"] = {"$gte": bedrooms}
    if featured is not None:
        query["featured"] = featured
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    if q:
        safe = re.escape(q)[:80]
        query["$or"] = [
            {"title": {"$regex": safe, "$options": "i"}},
            {"location": {"$regex": safe, "$options": "i"}},
            {"community": {"$regex": safe, "$options": "i"}},
            {"description": {"$regex": safe, "$options": "i"}},
        ]

    sort_map = {"price_asc": [("price", 1)], "price_desc": [("price", -1)],
                "newest": [("created_at", -1)], "featured": [("featured", -1), ("created_at", -1)]}
    cursor = db.properties.find(query, {"_id": 0}).sort(sort_map.get(sort, sort_map["featured"])).limit(min(limit, 500))
    return await cursor.to_list(min(limit, 500))


@api_router.get("/properties/{slug}")
async def get_property(slug: str):
    prop = await db.properties.find_one({"slug": slug}, {"_id": 0, "documents": 0})
    if not prop:
        prop = await db.properties.find_one({"id": slug}, {"_id": 0, "documents": 0})
    if not prop or not prop.get("published"):
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@api_router.post("/properties")
async def create_property(prop: Property, admin=Depends(require_admin)):
    doc = prop.model_dump()
    base = slugify(doc["title"])
    slug = base
    i = 2
    while await db.properties.find_one({"slug": slug}):
        slug = f"{base}-{i}"
        i += 1
    doc["slug"] = slug
    await db.properties.insert_one(dict(doc))
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.put("/properties/{prop_id}")
async def update_property(prop_id: str, prop: Property, admin=Depends(require_admin)):
    existing = await db.properties.find_one({"id": prop_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    doc = prop.model_dump()
    doc["id"] = prop_id
    doc["slug"] = existing.get("slug") or slugify(doc["title"])
    doc["created_at"] = existing.get("created_at", now_iso())
    await db.properties.replace_one({"id": prop_id}, dict(doc))
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.delete("/properties/{prop_id}")
async def delete_property(prop_id: str, admin=Depends(require_admin)):
    res = await db.properties.delete_one({"id": prop_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"success": True}


# ---------------- Leads ----------------
@api_router.post("/leads")
async def create_lead(lead: LeadCreate):
    doc = lead.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "New"
    doc["created_at"] = now_iso()
    await db.leads.insert_one(dict(doc))
    try:
        recipient = route_recipient(doc.get("requirement", ""), "")
        subject, html = build_lead_email(doc)
        await send_email(to=recipient, subject=subject, html=html, reply_to=doc.get("email") or None)
        if doc.get("email"):
            asub, ahtml = build_enquiry_ack_email(doc)
            await send_email(to=doc["email"], subject=asub, html=ahtml)
    except Exception as e:
        logger.error(f"Lead email failed: {e}")
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/leads")
async def list_leads(status: Optional[str] = None, admin=Depends(require_admin)):
    query = {}
    if status and status != "all":
        query["status"] = status
    return await db.leads.find(query, {"_id": 0}).sort([("created_at", -1)]).to_list(1000)


@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, body: LeadStatusUpdate, admin=Depends(require_admin)):
    res = await db.leads.update_one({"id": lead_id}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True}


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin=Depends(require_admin)):
    res = await db.leads.delete_one({"id": lead_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"success": True}


# ---------------- Settings ----------------
@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    if not doc:
        doc = {"id": "site", **DEFAULT_SETTINGS}
        await db.settings.insert_one(dict(doc))
    return doc


@api_router.put("/settings")
async def update_settings(body: dict, admin=Depends(require_admin)):
    body["id"] = "site"
    body.pop("_id", None)
    await db.settings.replace_one({"id": "site"}, body, upsert=True)
    return {k: v for k, v in body.items() if k != "_id"}


# ---------------- File Upload / Serve (local disk) ----------------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    fname = f"{uuid.uuid4().hex}.{ext}"
    storage_service.save_object(fname, data)
    await db.files.insert_one({"id": str(uuid.uuid4()), "filename": fname, "original_filename": file.filename,
                               "content_type": MIME_TYPES[ext], "size": len(data), "created_at": now_iso()})
    return {"url": f"/api/files/{fname}", "path": fname}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    full_path = storage_service.get_object_path(path)
    if not full_path:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path, headers={"Cache-Control": "public, max-age=31536000"})


@api_router.get("/")
async def root():
    return {"message": "Homes Finder API"}


features.init_features(api_router, SimpleNamespace(
    db=db, Property=Property, get_current_user=get_current_user, require_admin=require_admin,
    hash_password=hash_password, verify_password=verify_password,
    create_access_token=create_access_token, set_auth_cookie=set_auth_cookie, slugify=slugify,
))

app.include_router(api_router)

_cors = os.environ.get('CORS_ORIGINS', '*')
_origins = ["*"] if _cors.strip() == "*" else [o.strip() for o in _cors.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": ADMIN_EMAIL,
                                   "password_hash": hash_password(ADMIN_PASSWORD), "name": "Admin",
                                   "role": "admin", "created_at": now_iso()})
        logger.info("Seeded admin user")
    else:
        updates = {"role": "admin"}
        if not existing.get("id"):
            updates["id"] = str(uuid.uuid4())
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            updates["password_hash"] = hash_password(ADMIN_PASSWORD)
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": updates})
        logger.info("Ensured admin user is up to date")


@app.on_event("startup")
async def startup():
    storage_service.init_storage()
    try:
        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
    except Exception as e:
        logger.error(f"Index creation: {e}")
    await seed_admin()
    await db.properties.update_many({"approval_status": {"$exists": False}},
                                    {"$set": {"approval_status": "approved"}})
    if await db.settings.find_one({"id": "site"}) is None:
        await db.settings.insert_one({"id": "site", **DEFAULT_SETTINGS})
        logger.info("Seeded default settings")
    if await db.properties.count_documents({}) == 0:
        for p in DEMO_PROPERTIES:
            doc = Property(**p).model_dump()
            doc["slug"] = slugify(doc["title"])
            await db.properties.insert_one(dict(doc))
        logger.info(f"Seeded {len(DEMO_PROPERTIES)} demo properties")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
