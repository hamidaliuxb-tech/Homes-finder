"""Backend API tests for Homes Finder."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


@pytest.fixture(scope="session")
def admin_token():
    if ADMIN_TOKEN:
        return ADMIN_TOKEN
    try:
        r = requests.post(f"{API}/auth/login", json={"email": "admin@homesfinder.ae", "password": "Admin@HomesFinder2026"}, timeout=5)
        if r.status_code == 200:
            return r.json().get("session_token", "")
    except Exception:
        pass
    return ""


@pytest.fixture
def admin_headers(admin_token):
    if not admin_token:
        pytest.skip("no admin token")
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Public endpoints ----------
class TestPublic:
    def test_list_properties(self):
        r = requests.get(f"{API}/properties")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # verify no _id
        assert "_id" not in data[0]

    def test_filter_purpose_buy(self):
        r = requests.get(f"{API}/properties", params={"purpose": "buy"})
        assert r.status_code == 200
        for p in r.json():
            assert p["purpose"] == "buy"

    def test_filter_rent(self):
        r = requests.get(f"{API}/properties", params={"purpose": "rent"})
        assert r.status_code == 200
        for p in r.json():
            assert p["purpose"] == "rent"

    def test_filter_commercial(self):
        r = requests.get(f"{API}/properties", params={"category": "commercial"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "commercial"

    def test_filter_offplan(self):
        r = requests.get(f"{API}/properties", params={"status": "offplan"})
        assert r.status_code == 200
        for p in r.json():
            assert p["status"] == "offplan"

    def test_filter_emirate_dubai(self):
        r = requests.get(f"{API}/properties", params={"emirate": "Dubai"})
        assert r.status_code == 200
        for p in r.json():
            assert p["emirate"] == "Dubai"

    def test_filter_featured(self):
        r = requests.get(f"{API}/properties", params={"featured": "true"})
        assert r.status_code == 200
        for p in r.json():
            assert p["featured"] is True

    def test_sort_price_asc(self):
        r = requests.get(f"{API}/properties", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_sort_price_desc(self):
        r = requests.get(f"{API}/properties", params={"sort": "price_desc"})
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_get_property_by_slug(self):
        r = requests.get(f"{API}/properties/homes-finder-dubai")
        # slug may not exist; try one from list
        if r.status_code == 404:
            props = requests.get(f"{API}/properties").json()
            assert len(props) > 0
            slug = props[0]["slug"]
            r = requests.get(f"{API}/properties/{slug}")
        assert r.status_code == 200
        assert "title" in r.json()

    def test_get_property_invalid(self):
        r = requests.get(f"{API}/properties/nonexistent-slug-xyz-123")
        assert r.status_code == 404

    def test_get_settings(self):
        r = requests.get(f"{API}/settings")
        assert r.status_code == 200
        d = r.json()
        for k in ("stats", "contact", "about", "map", "faqs"):
            assert k in d, f"missing {k}"

    def test_create_lead(self):
        payload = {"name": "TEST_Lead", "mobile": "+971500000000",
                   "email": "test@example.com", "requirement": "Buy",
                   "message": "test message"}
        r = requests.post(f"{API}/leads", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_Lead"
        assert d["status"] == "New"
        assert "id" in d


# ---------- Auth ----------
class TestAuth:
    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_admin(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"

    def test_admin_routes_require_auth(self):
        assert requests.get(f"{API}/leads").status_code == 401
        assert requests.post(f"{API}/properties", json={"title": "x"}).status_code == 401
        assert requests.put(f"{API}/settings", json={}).status_code == 401


# ---------- Admin Properties CRUD ----------
class TestAdminProperties:
    def test_create_update_delete(self, admin_headers):
        payload = {"title": "TEST_Admin_Prop_Homes", "purpose": "buy", "category": "residential",
                   "property_type": "Apartment", "status": "ready", "emirate": "Dubai",
                   "community": "Downtown", "price": 1500000, "bedrooms": 2, "bathrooms": 2,
                   "area": 1200, "description": "test"}
        r = requests.post(f"{API}/properties", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        prop = r.json()
        assert prop["slug"].startswith("test-admin-prop-homes")
        pid = prop["id"]

        # duplicate title -> unique slug
        r2 = requests.post(f"{API}/properties", json=payload, headers=admin_headers)
        assert r2.status_code == 200
        assert r2.json()["slug"] != prop["slug"]
        pid2 = r2.json()["id"]

        # verify GET
        g = requests.get(f"{API}/properties/{prop['slug']}")
        assert g.status_code == 200

        # update
        payload_u = {**payload, "title": "TEST_Admin_Prop_Updated", "price": 2000000}
        u = requests.put(f"{API}/properties/{pid}", json=payload_u, headers=admin_headers)
        assert u.status_code == 200
        assert u.json()["price"] == 2000000

        # delete both
        for _id in (pid, pid2):
            d = requests.delete(f"{API}/properties/{_id}", headers=admin_headers)
            assert d.status_code == 200


# ---------- Admin Leads ----------
class TestAdminLeads:
    def test_list_update_delete(self, admin_headers):
        # create a lead first
        r = requests.post(f"{API}/leads", json={"name": "TEST_LeadCRUD", "mobile": "+971500001111"})
        lid = r.json()["id"]

        lst = requests.get(f"{API}/leads", headers=admin_headers)
        assert lst.status_code == 200
        assert any(l["id"] == lid for l in lst.json())

        u = requests.put(f"{API}/leads/{lid}", json={"status": "Contacted"}, headers=admin_headers)
        assert u.status_code == 200

        # verify
        lst2 = requests.get(f"{API}/leads", headers=admin_headers).json()
        assert next(l for l in lst2 if l["id"] == lid)["status"] == "Contacted"

        d = requests.delete(f"{API}/leads/{lid}", headers=admin_headers)
        assert d.status_code == 200


# ---------- Settings ----------
class TestAdminSettings:
    def test_update_settings(self, admin_headers):
        cur = requests.get(f"{API}/settings").json()
        original_wa = cur.get("contact", {}).get("whatsapp", "+971501184777")
        cur.setdefault("contact", {})["whatsapp"] = "+971500009999"
        r = requests.put(f"{API}/settings", json=cur, headers=admin_headers)
        assert r.status_code == 200

        g = requests.get(f"{API}/settings").json()
        assert g["contact"]["whatsapp"] == "+971500009999"

        # restore
        g["contact"]["whatsapp"] = original_wa
        requests.put(f"{API}/settings", json=g, headers=admin_headers)


# ---------- Upload ----------
class TestUpload:
    def test_upload_requires_admin(self):
        r = requests.post(f"{API}/upload", files={"file": ("t.png", b"x", "image/png")})
        assert r.status_code == 401

    def test_upload_and_serve(self, admin_headers):
        # 1x1 png
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
        )
        r = requests.post(f"{API}/upload", headers=admin_headers,
                          files={"file": ("t.png", png, "image/png")})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/files/")
        # serve
        s = requests.get(f"{BASE_URL}{d['url']}")
        assert s.status_code == 200
        assert s.headers["content-type"].startswith("image/")
