"""Tests for the new product ingredient analysis feature.

Covers:
- POST /api/products/analyze (text only, missing inputs validation)
- GET /api/products (list, sort, no _id leak)
- DELETE /api/products/{analysis_id}
- Verifies alternatives are CRITERIA, not brand names
- Verifies input_type is 'text' when only INCI provided and analysis is persisted
"""
import os
import re
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", os.environ.get("EXPO_BACKEND_URL", "")).rstrip("/")
DEMO_EMAIL = "demo@skincare.app"
DEMO_PASSWORD = "Demo1234!"

SAMPLE_INCI = "Aqua, Glycerin, Niacinamide, Parfum, Alcohol Denat, Sodium Hyaluronate, Phenoxyethanol"
BRAND_BLACKLIST = [
    "la roche posay", "la roche-posay", "sephora", "nivea", "cerave", "the ordinary",
    "vichy", "avene", "avène", "bioderma", "neutrogena", "olay", "estee lauder",
    "estée lauder", "garnier", "l'oreal", "l'oréal", "clinique", "kiehl",
]


@pytest.fixture(scope="module")
def auth_token():
    assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not set"
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# ---------- Validation ----------
class TestProductValidation:
    def test_analyze_missing_inputs_returns_400(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/products/analyze",
            headers=headers,
            json={"name": "", "image_base64": "", "ingredients_text": ""},
            timeout=20,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_analyze_unauthenticated(self):
        r = requests.post(
            f"{BASE_URL}/api/products/analyze",
            json={"ingredients_text": SAMPLE_INCI},
            timeout=20,
        )
        assert r.status_code == 401


# ---------- Core analysis (LLM, 15-45s) ----------
class TestProductAnalysisFlow:
    created_id = None

    def test_analyze_text_only_returns_full_structure(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/products/analyze",
            headers=headers,
            json={
                "name": "TEST_Crème Hydratante",
                "image_base64": "",
                "ingredients_text": SAMPLE_INCI,
            },
            timeout=90,
        )
        assert r.status_code == 200, f"Analysis failed: {r.status_code} {r.text[:300]}"
        data = r.json()

        # If LLM signaled unreadable for text only, that's a backend logic bug
        assert not data.get("unreadable"), "Text input should not be unreadable"

        # Required top-level fields
        for key in ("analysis_id", "product_name", "score", "ingredients", "risks",
                    "compatibility", "decision", "alternatives", "disclaimer", "input_type"):
            assert key in data, f"Missing key: {key}"

        # Score 0-100
        assert isinstance(data["score"], int)
        assert 0 <= data["score"] <= 100

        # input_type should be 'text' (only text provided)
        assert data["input_type"] == "text", f"Expected input_type='text', got {data['input_type']}"

        # Decision label in allowed set
        assert data["decision"]["label"] in {"À utiliser", "Avec précaution", "À éviter"}
        assert data["decision"]["color"] in {"green", "orange", "red"}

        # Disclaimer
        assert "dermatologique" in data["disclaimer"].lower()

        # Ingredients structure
        assert isinstance(data["ingredients"], list) and len(data["ingredients"]) > 0
        for ing in data["ingredients"]:
            assert "name" in ing and "flag" in ing and "role" in ing
            assert ing["flag"] in {"green", "orange", "red"}

        # Risks structure
        assert isinstance(data["risks"], list)
        for risk in data["risks"]:
            assert "severity" in risk and "type" in risk

        # Compatibility
        assert "verdict" in data["compatibility"]
        assert isinstance(data["compatibility"].get("reasons", []), list)

        # Alternatives must be CRITERIA, not brand names
        alts = data["alternatives"]
        assert isinstance(alts, list)
        full_alt_text = " ".join(
            (a.get("criterion", "") + " " + a.get("why", "")).lower() for a in alts
        )
        for brand in BRAND_BLACKLIST:
            assert brand not in full_alt_text, f"Alternatives must not mention brand '{brand}': {full_alt_text}"

        # Should not leak Mongo _id
        assert "_id" not in data

        TestProductAnalysisFlow.created_id = data["analysis_id"]

    def test_list_products_returns_persisted_analysis(self, headers):
        assert TestProductAnalysisFlow.created_id, "Previous create test must run first"
        r = requests.get(f"{BASE_URL}/api/products", headers=headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        # No _id in any item
        for it in items:
            assert "_id" not in it
        # Newest first: our created should be first or among top
        ids = [it["analysis_id"] for it in items]
        assert TestProductAnalysisFlow.created_id in ids

        # Verify input_type persisted as 'text'
        ours = next(it for it in items if it["analysis_id"] == TestProductAnalysisFlow.created_id)
        assert ours["input_type"] == "text"

        # Sort check (newest first)
        if len(items) >= 2:
            assert items[0]["created_at"] >= items[1]["created_at"]

    def test_delete_product(self, headers):
        assert TestProductAnalysisFlow.created_id
        r = requests.delete(
            f"{BASE_URL}/api/products/{TestProductAnalysisFlow.created_id}",
            headers=headers,
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Verify gone
        r2 = requests.get(f"{BASE_URL}/api/products", headers=headers, timeout=15)
        ids = [it["analysis_id"] for it in r2.json()]
        assert TestProductAnalysisFlow.created_id not in ids

        # Delete again → 404
        r3 = requests.delete(
            f"{BASE_URL}/api/products/{TestProductAnalysisFlow.created_id}",
            headers=headers,
            timeout=15,
        )
        assert r3.status_code == 404
