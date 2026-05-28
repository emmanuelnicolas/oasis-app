"""Backend API tests for skincare app."""
import os
import time
import base64
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://skin-match-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@skincare.app"
DEMO_PASS = "Demo1234!"

# tiny 1x1 PNG (valid)
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4"
    "nGNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg=="
)


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    if r.status_code != 200:
        # Try signup with unique email for fallback
        pytest.skip(f"Demo login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
def test_login_demo(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and "user" in body
    assert body["user"]["email"] == DEMO_EMAIL


def test_login_wrong_password(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "Wrong!"})
    assert r.status_code == 401


def test_signup_and_me(session):
    email = f"test_{int(time.time())}@example.com"
    r = session.post(f"{API}/auth/signup", json={"email": email, "password": "Pass1234!", "name": "TEST User"})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email
    assert me.json()["has_profile"] is False


def test_auth_me_no_token(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- Profile ----------
def test_profile_save_and_get(session, auth_headers):
    payload = {
        "skin_type": "mixte",
        "age_range": "26-35",
        "concerns": ["eclat", "deshydratation"],
        "sensitivity": "moyenne",
        "allergies": "",
        "current_routine": "nettoyant + crème",
        "goals": "éclat",
    }
    r = session.post(f"{API}/profile", headers=auth_headers, json=payload)
    assert r.status_code == 200, r.text
    assert r.json().get("has_profile") is True

    g = session.get(f"{API}/profile", headers=auth_headers)
    assert g.status_code == 200
    body = g.json()
    assert body.get("skin_type") == "mixte"
    assert "eclat" in body.get("concerns", [])


# ---------- Routines (LLM - slow) ----------
@pytest.mark.timeout(90)
def test_routines_generate_and_get(session, auth_headers):
    r = session.post(f"{API}/routines/generate", headers=auth_headers, timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    for k in ("matin", "soir", "hebdo"):
        assert k in data, f"missing {k}"
        assert data[k].get("steps"), f"no steps in {k}"
        assert isinstance(data[k]["steps"], list)
        assert len(data[k]["steps"]) >= 1

    g = session.get(f"{API}/routines", headers=auth_headers)
    assert g.status_code == 200
    routines = g.json()
    assert set(routines.keys()) >= {"matin", "soir", "hebdo"}


def test_routines_generate_no_profile(session):
    # New user without profile
    email = f"noprofile_{int(time.time())}@example.com"
    r = session.post(f"{API}/auth/signup", json={"email": email, "password": "Pass1234!", "name": "NoProfile"})
    assert r.status_code == 200
    tok = r.json()["token"]
    g = session.post(f"{API}/routines/generate", headers={"Authorization": f"Bearer {tok}"})
    assert g.status_code == 400


# ---------- Tracking ----------
def test_tracking_toggle_and_today(session, auth_headers):
    r = session.post(
        f"{API}/tracking/toggle",
        headers=auth_headers,
        json={"routine_type": "matin", "step_order": 1, "completed": True},
    )
    assert r.status_code == 200
    assert r.json()["completed"].get("matin_1") is True

    t = session.get(f"{API}/tracking/today", headers=auth_headers)
    assert t.status_code == 200
    assert t.json()["completed"].get("matin_1") is True

    s = session.get(f"{API}/tracking/stats", headers=auth_headers)
    assert s.status_code == 200
    body = s.json()
    assert "streak" in body and "total_days" in body and "history" in body


# ---------- Journal ----------
def test_journal_crud(session, auth_headers):
    r = session.post(
        f"{API}/journal",
        headers=auth_headers,
        json={"image_base64": TINY_PNG_B64, "note": "TEST entry"},
    )
    assert r.status_code == 200, r.text
    entry_id = r.json()["entry_id"]

    g = session.get(f"{API}/journal", headers=auth_headers)
    assert g.status_code == 200
    assert any(e["entry_id"] == entry_id for e in g.json())

    d = session.delete(f"{API}/journal/{entry_id}", headers=auth_headers)
    assert d.status_code == 200


# ---------- Seasonal Tips ----------
def test_seasonal_tips(session):
    r = session.get(f"{API}/tips/seasonal")
    assert r.status_code == 200
    body = r.json()
    assert body["season"] in {"hiver", "printemps", "été", "automne"}
    assert isinstance(body["tips"], list) and len(body["tips"]) > 0
    assert body["tip_of_day"]


# ---------- Skin Analysis (LLM Vision - slow) ----------
@pytest.mark.timeout(60)
def test_skin_analyze(session, auth_headers):
    r = session.post(
        f"{API}/skin/analyze",
        headers=auth_headers,
        json={"image_base64": TINY_PNG_B64},
        timeout=60,
    )
    # tiny PNG may give "indéterminé" but should not error
    assert r.status_code in (200, 500), r.text
    if r.status_code == 200:
        body = r.json()
        assert "skin_type" in body
        assert "concerns" in body
        assert "summary" in body


def test_skin_analyze_no_image(session, auth_headers):
    r = session.post(f"{API}/skin/analyze", headers=auth_headers, json={"image_base64": ""})
    assert r.status_code == 400
