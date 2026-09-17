import os
import mimetypes
from pathlib import Path
import logging
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip()
UPLOAD_DIR = Path("/tmp/uploads") if os.environ.get("VERCEL") else Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
storage_key = None

# Optional Cloudinary Cloud Storage
CLOUDINARY_URL = os.environ.get("CLOUDINARY_URL")
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")

has_cloudinary = False
try:
    import cloudinary
    import cloudinary.uploader
    if CLOUDINARY_URL and "**********" not in CLOUDINARY_URL:
        cloudinary.config()
        has_cloudinary = True
        logger.info("Cloudinary configured via CLOUDINARY_URL")
    elif CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        has_cloudinary = True
        logger.info("Cloudinary configured via credentials")
except Exception as e:
    logger.warning(f"Cloudinary config error: {e}")


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    emergent_key = os.environ.get("EMERGENT_LLM_KEY")
    if not emergent_key or not STORAGE_BASE:
        return None
    try:
        storage_url = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
        resp = requests.post(f"{storage_url}/init", json={"emergent_key": emergent_key}, timeout=5)
        resp.raise_for_status()
        storage_key = resp.json().get("storage_key")
        return storage_key
    except Exception as e:
        logger.warning(f"Remote storage init skipped: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    # 1. Try Cloudinary if configured
    if has_cloudinary:
        try:
            import io
            import cloudinary.uploader
            res = cloudinary.uploader.upload(
                io.BytesIO(data),
                folder=f"{APP_NAME}/properties",
                resource_type="image"
            )
            return {
                "path": res.get("public_id"),
                "url": res.get("secure_url"),
                "size": res.get("bytes", len(data))
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed, falling back to local: {e}")


    # 2. Try legacy remote storage if configured
    key = init_storage()
    if key and STORAGE_BASE:
        try:
            storage_url = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
            resp = requests.put(
                f"{storage_url}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                data=data, timeout=30,
            )
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.warning(f"Remote storage upload failed, saving to local disk: {e}")

    # 3. Local disk storage (100% reliable fallback)
    local_path = UPLOAD_DIR / path
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_bytes(data)
    return {"path": path, "size": len(data), "url": f"/api/files/{path}"}



def get_object(path: str) -> tuple[bytes, str]:
    # Check local disk first
    local_path = UPLOAD_DIR / path
    if local_path.exists():
        content_type, _ = mimetypes.guess_type(str(local_path))
        return local_path.read_bytes(), content_type or "application/octet-stream"

    # Try remote storage if local not found
    key = init_storage()
    if key and STORAGE_BASE:
        try:
            storage_url = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
            resp = requests.get(
                f"{storage_url}/objects/{path}",
                headers={"X-Storage-Key": key}, timeout=30,
            )
            if resp.status_code == 200:
                return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
        except Exception:
            pass

    raise FileNotFoundError(f"Object {path} not found")

