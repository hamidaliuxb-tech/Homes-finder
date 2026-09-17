import os
import uuid
import logging
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Cookie, UploadFile, File, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

import storage_service
from email_service import send_email, build_lead_email
from seed_data import DEMO_PROPERTIES, DEFAULT_SETTINGS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'homesfinder_db')]

DEFAULT_ADMIN_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@homesfinder.ae').strip().lower()
DEFAULT_ADMIN_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'Admin@HomesFinder2026')
ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', 'hamid.aliuxb@gmail.com,hamid.a@homesfinder.ae,admin@homesfinder.ae').split(',') if e.strip()]
if DEFAULT_ADMIN_EMAIL not in ADMIN_EMAILS:
    ADMIN_EMAILS.append(DEFAULT_ADMIN_EMAIL)
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'hamid.a@homesfinder.ae')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return s or uuid.uuid4().hex[:8]


# ---------------- Models ----------------
class SessionRequest(BaseModel):
    session_id: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str = ""
    title: str
    purpose: str = "buy"            # buy | rent
    category: str = "residential"   # residential | commercial
    property_type: str = "Apartment"
    status: str = "ready"           # ready | offplan
    availability: str = "available" # available | sold | rented
    emirate: str = "Dubai"
    community: str = ""
    location: str = ""
    price: float = 0
    price_period: str = ""          # "", per year, per month
    bedrooms: int = 0
    bathrooms: int = 0
    area: float = 0                 # built-up sqft
    plot_area: Optional[float] = None
    furnished: str = "unfurnished"  # furnished | unfurnished | semi
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


# ---------------- Auth ----------------
async def get_current_user(request: Request, authorization: Optional[str] = Header(None),
                           session_token: Optional[str] = Cookie(None)):
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@api_router.post("/auth/login")
async def direct_login(body: LoginRequest, response: Response):
    email = body.email.strip().lower()
    password = body.password.strip()

    is_valid = False
    user_record = await db.users.find_one({"email": email})

    if email == DEFAULT_ADMIN_EMAIL and (password == DEFAULT_ADMIN_PASSWORD or (user_record and user_record.get("password") == password)):
        is_valid = True
    elif user_record and user_record.get("password") and user_record.get("password") == password:
        is_valid = True
    elif email in ADMIN_EMAILS and (password == DEFAULT_ADMIN_PASSWORD or (user_record and user_record.get("password") == password)):
        is_valid = True

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    role = "admin" if (email in ADMIN_EMAILS or email == DEFAULT_ADMIN_EMAIL or (user_record and user_record.get("role") == "admin")) else "user"

    if user_record:
        user_id = user_record["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"role": role, "last_login": now_iso()}})
        name = user_record.get("name", "Admin")
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        name = "Admin"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name,
            "picture": "", "role": role, "password": password, "created_at": now_iso(),
        })

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": now_iso(),
    })

    # Set cookie for same-origin & cross-origin browsers
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=False, samesite="lax", path="/", max_age=7 * 24 * 3600
    )
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "session_token": session_token
    }


@api_router.post("/auth/google")
async def google_login(body: GoogleLoginRequest, response: Response):
    try:
        r = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={body.credential}",
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.error(f"Google token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Google token missing email")

    role = "admin" if (email in ADMIN_EMAILS or email == DEFAULT_ADMIN_EMAIL) else "user"

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    name = data.get("name") or "User"
    picture = data.get("picture") or ""

    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "role": role, "last_login": now_iso()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name,
            "picture": picture, "role": role, "created_at": now_iso(),
        })

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": now_iso(),
    })

    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=False, samesite="lax", path="/", max_age=7 * 24 * 3600
    )
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
        "session_token": session_token
    }


@api_router.post("/auth/session")
async def create_session(body: SessionRequest, response: Response):
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id}, timeout=30,
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.error(f"Session data fetch failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid session id")

    email = data["email"].lower()
    role = "admin" if email in ADMIN_EMAILS else "user"

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id},
                                  {"$set": {"name": data.get("name"), "picture": data.get("picture"), "role": role}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name"),
            "picture": data.get("picture"), "role": role, "created_at": now_iso(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(), "created_at": now_iso(),
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True,
                        secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    return {"user_id": user_id, "email": email, "name": data.get("name"),
            "picture": data.get("picture"), "role": role, "session_token": session_token}


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user.get("name"),
            "picture": user.get("picture"), "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
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
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"community": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]

    sort_map = {
        "price_asc": [("price", 1)], "price_desc": [("price", -1)],
        "newest": [("created_at", -1)], "featured": [("featured", -1), ("created_at", -1)],
    }
    cursor = db.properties.find(query, {"_id": 0}).sort(sort_map.get(sort, sort_map["featured"])).limit(limit)
    return await cursor.to_list(limit)


@api_router.get("/properties/{slug}")
async def get_property(slug: str):
    slug_clean = slug.strip().lower()
    prop = await db.properties.find_one({"$or": [{"slug": slug}, {"slug": slug_clean}, {"id": slug}]}, {"_id": 0})
    if not prop:
        prop = await db.properties.find_one({"slug": {"$regex": f"^{re.escape(slug_clean)}$", "$options": "i"}}, {"_id": 0})
    if not prop:
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
    await db.properties.insert_one(doc)
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
    await db.properties.replace_one({"id": prop_id}, doc)
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
        subject, html = build_lead_email(doc)
        await send_email(to=OWNER_EMAIL, subject=subject, html=html, reply_to=doc.get("email") or None)
    except Exception as e:
        logger.error(f"Lead email failed: {e}")
    return {k: v for k, v in doc.items() if k != "_id"}


@api_router.get("/leads")
async def list_leads(status: Optional[str] = None, admin=Depends(require_admin)):
    query = {}
    if status and status != "all":
        query["status"] = status
    leads = await db.leads.find(query, {"_id": 0}).sort([("created_at", -1)]).to_list(1000)
    return leads


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
    await db.settings.replace_one({"id": "site"}, body, upsert=True)
    return {k: v for k, v in body.items() if k != "_id"}


# ---------------- File Upload / Serve ----------------
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), admin=Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    path = f"{storage_service.APP_NAME}/properties/{uuid.uuid4()}.{ext}"
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    content_type = MIME_TYPES[ext]
    result = storage_service.put_object(path, data, content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": content_type,
        "size": result.get("size"), "is_deleted": False, "created_at": now_iso(),
    })
    file_url = result.get("url") or f"/api/files/{result['path']}"
    return {"url": file_url, "path": result["path"]}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    try:
        data, content_type = storage_service.get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    ct = record.get("content_type") if record else content_type
    return Response(content=data, media_type=ct, headers={"Cache-Control": "public, max-age=31536000"})


@api_router.get("/")
async def root():
    return {"message": "Homes Finder API"}


app.include_router(api_router)

cors_origins_raw = os.environ.get('CORS_ORIGINS', '*').strip()
if cors_origins_raw == '*' or not cors_origins_raw:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=r".*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    cors_list = [o.strip() for o in cors_origins_raw.split(',') if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=cors_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup():
    try:
        storage_service.init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    if await db.settings.find_one({"id": "site"}) is None:
        await db.settings.insert_one({"id": "site", **DEFAULT_SETTINGS})
        logger.info("Seeded default settings")

    # Ensure default admin user exists
    existing_admin = await db.users.find_one({"email": DEFAULT_ADMIN_EMAIL})
    if not existing_admin:
        await db.users.insert_one({
            "user_id": f"admin_{uuid.uuid4().hex[:8]}",
            "email": DEFAULT_ADMIN_EMAIL,
            "name": "Homes Finder Admin",
            "role": "admin",
            "password": DEFAULT_ADMIN_PASSWORD,
            "created_at": now_iso(),
        })
        logger.info(f"Seeded default admin user: {DEFAULT_ADMIN_EMAIL}")

    # Seed demo properties if database has none or add any missing ones
    for p in DEMO_PROPERTIES:
        slug = slugify(p["title"])
        existing = await db.properties.find_one({"$or": [{"title": p["title"]}, {"slug": slug}]})
        if not existing:
            prop = Property(**p)
            doc = prop.model_dump()
            doc["slug"] = slug
            await db.properties.insert_one(doc)
    logger.info("Properties verified and seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
