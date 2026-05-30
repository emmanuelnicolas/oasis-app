from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Header
from fastapi.security import HTTPBearer
from fastapi import Security
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import uuid
import bcrypt
import jwt
import httpx
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta, date
from google import genai



# from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret')
JWT_ALG = "HS256"
security = HTTPBearer()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Models ----------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    has_profile: bool = False
    created_at: datetime

class AuthResponse(BaseModel):
    token: str
    user: User

class SkinProfile(BaseModel):
    skin_type: str  # sec, gras, mixte, normal, sensible
    age_range: str  # 18-25, 26-35, 36-45, 46+
    concerns: List[str]  # acne, rides, taches, deshydratation, eclat, pores, rougeurs
    sensitivity: str  # faible, moyenne, forte
    allergies: Optional[str] = ""
    current_routine: Optional[str] = ""
    goals: Optional[str] = ""

class GoogleSessionRequest(BaseModel):
    session_id: str

class RoutineStep(BaseModel):
    order: int
    name: str
    product_type: str
    instructions: str
    benefits: str

class Routine(BaseModel):
    routine_id: str
    user_id: str
    type: str  # matin, soir, hebdo
    title: str
    description: str
    steps: List[RoutineStep]
    created_at: datetime

class JournalEntry(BaseModel):
    entry_id: str
    user_id: str
    image_base64: str
    note: str
    created_at: datetime

class JournalCreate(BaseModel):
    image_base64: str
    note: Optional[str] = ""

class TrackingUpdate(BaseModel):
    routine_type: str  # matin, soir
    step_order: int
    completed: bool

class SkinAnalysisRequest(BaseModel):
    image_base64: str


class ProductAnalysisRequest(BaseModel):
    name: Optional[str] = ""
    image_base64: Optional[str] = ""
    ingredients_text: Optional[str] = ""


# ---------- Helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def make_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "iat": int(now_utc().timestamp()),
        "exp": int((now_utc() + timedelta(days=30)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(credentials=Security(security)) -> Dict[str, Any]:
    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["user_id"]
        user_doc = await db.users.find_one(
            {"user_id": user_id}, {"_id": 0, "password_hash": 0}
        )
        if user_doc:
            return user_doc
    except jwt.PyJWTError:
        pass

    raise HTTPException(status_code=401, detail="Token invalide ou expiré")


def serialize_user(doc: Dict[str, Any]) -> User:
    return User(
        user_id=doc["user_id"],
        email=doc["email"],
        name=doc.get("name", ""),
        picture=doc.get("picture"),
        has_profile=bool(doc.get("skin_profile")),
        created_at=doc.get("created_at", now_utc()),
    )


def get_current_season() -> str:
    m = now_utc().month
    if m in (12, 1, 2):
        return "hiver"
    if m in (3, 4, 5):
        return "printemps"
    if m in (6, 7, 8):
        return "été"
    return "automne"

def user_friendly_error(message: str = "Une erreur est survenue. Réessayez dans quelques instants."):
    raise HTTPException(
        status_code=503,
        detail=message
    )

# ---------- Auth ----------
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "picture": None,
        "skin_profile": None,
        "created_at": now_utc(),
    }
    await db.users.insert_one(user)
    token = make_jwt(user_id)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return AuthResponse(token=token, user=serialize_user(user))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    user_doc = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = make_jwt(user_doc["user_id"])
    return AuthResponse(token=token, user=serialize_user(user_doc))


@api_router.post("/auth/google/session", response_model=AuthResponse)
async def google_session(payload: GoogleSessionRequest):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient(timeout=15.0) as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Session Google invalide")
    data = resp.json()
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing.get("name", "")),
                       "picture": data.get("picture")}},
        )
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture"),
            "skin_profile": None,
            "created_at": now_utc(),
        }
        await db.users.insert_one(dict(user_doc))
    # Save session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": data["session_token"],
        "expires_at": now_utc() + timedelta(days=7),
        "created_at": now_utc(),
    })
    return AuthResponse(token=data["session_token"], user=serialize_user(user_doc))


@api_router.get("/auth/me", response_model=User)
async def auth_me(user=Depends(get_current_user)):
    return serialize_user(user)


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


# ---------- Profile ----------
@api_router.post("/profile", response_model=User)
async def save_profile(profile: SkinProfile, user=Depends(get_current_user)):
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"skin_profile": profile.dict(), "profile_updated_at": now_utc()}},
    )
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return serialize_user(user_doc)


@api_router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    return user.get("skin_profile") or {}


# ---------- AI Routine Generation ----------
def parse_json_from_text(text: str) -> Dict[str, Any]:
    # Find first {...} block
    match = re.search(r'\{[\s\S]*\}', text)
    if not match:
        raise ValueError("No JSON found in response")
    return json.loads(match.group(0))


@api_router.post("/routines/generate")
async def generate_routines(user=Depends(get_current_user)):
    profile = user.get("skin_profile")

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Veuillez compléter votre profil de peau"
        )

    season = get_current_season()

    prompt = f"""
Tu es une experte skincare française. Tu dois créer une routine personnalisée, réaliste et sûre.

Profil utilisateur :
- Type de peau : {profile.get('skin_type')}
- Âge : {profile.get('age_range')}
- Préoccupations : {', '.join(profile.get('concerns', []))}
- Sensibilité : {profile.get('sensitivity')}
- Allergies : {profile.get('allergies') or 'aucune'}
- Routine actuelle : {profile.get('current_routine') or 'aucune'}
- Objectifs : {profile.get('goals') or 'améliorer la peau'}
- Saison : {season}

Règles importantes :
- Ne propose pas trop d'actifs forts.
- Si peau sensible, évite parfum, alcool dénaturé, exfoliation agressive.
- Si acné ou pores, privilégie niacinamide, BHA doux, hydratation légère.
- Si peau sèche, privilégie céramides, glycérine, acide hyaluronique.
- Routine matin : 4 étapes maximum.
- Routine soir : 4 étapes maximum.
- Routine hebdo : 2 étapes maximum.
- Chaque étape doit expliquer quoi faire, fréquence, bénéfice.
- Réponds uniquement en JSON valide, sans texte autour.

Format exact :

{{
  "matin": {{
    "title": "Routine du Matin",
    "description": "string",
    "steps": [
      {{
        "order": 1,
        "name": "string",
        "product_type": "string",
        "instructions": "string",
        "benefits": "string"
      }}
    ]
  }},
  "soir": {{
    "title": "Routine du Soir",
    "description": "string",
    "steps": [
      {{
        "order": 1,
        "name": "string",
        "product_type": "string",
        "instructions": "string",
        "benefits": "string"
      }}
    ]
  }},
  "hebdo": {{
    "title": "Routine Hebdomadaire",
    "description": "string",
    "steps": [
      {{
        "order": 1,
        "name": "string",
        "product_type": "string",
        "instructions": "string",
        "benefits": "string"
      }}
    ]
  }}
}}
"""

    response = None

    try:
        if not genai_client:
            raise Exception("Gemini non configuré")

        gemini_response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        response = gemini_response.text
        data = parse_json_from_text(response)
    except Exception:
        logger.exception("Routine generation error")

        response = """
{
  "matin": {
    "title": "Routine du Matin",
    "description": "Routine simple pour hydrater et protéger la peau.",
    "steps": [
      {
        "order": 1,
        "name": "Nettoyant doux",
        "product_type": "cleanser",
        "instructions": "Nettoyer le visage matin et soir.",
        "benefits": "Élimine les impuretés."
      }
    ]
  },
  "soir": {
    "title": "Routine du Soir",
    "description": "Routine réparatrice.",
    "steps": []
  },
  "hebdo": {
    "title": "Routine Hebdo",
    "description": "Routine complémentaire.",
    "steps": []
  }
}
"""

    try:
        data = parse_json_from_text(response)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erreur génération routine"
        )

    await db.routines.delete_many({
        "user_id": user["user_id"]
    })

    saved = {}

    for rtype in ("matin", "soir", "hebdo"):
        block = data.get(rtype, {})

        steps = []

        for s in block.get("steps", []):
            steps.append({
                "order": int(s.get("order", 0)),
                "name": s.get("name", ""),
                "product_type": s.get("product_type", ""),
                "instructions": s.get("instructions", ""),
                "benefits": s.get("benefits", ""),
            })

        routine = {
            "routine_id": f"routine_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "type": rtype,
            "title": block.get("title", f"Routine {rtype}"),
            "description": block.get("description", ""),
            "steps": steps,
            "created_at": now_utc(),
        }

        await db.routines.insert_one(routine)

        routine.pop("_id", None)

        saved[rtype] = routine

    return saved


@api_router.get("/routines")
async def get_routines(user=Depends(get_current_user)):
    cursor = db.routines.find({"user_id": user["user_id"]}, {"_id": 0})
    routines = await cursor.to_list(length=10)
    by_type = {r["type"]: r for r in routines}
    return by_type


# ---------- AI Skin Analysis (Vision) ----------
@api_router.post("/skin/analyze")
async def analyze_skin(payload: SkinAnalysisRequest, user=Depends(get_current_user)):
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Image requise")

    img_b64 = payload.image_base64
    if img_b64.startswith("data:"):
        img_b64 = img_b64.split(",", 1)[1]

    response = """
    {
      "skin_type": "indéterminé",
      "concerns": [],
      "summary": "Analyse IA désactivée en local temporairement."
    }
    """

    try:
        data = parse_json_from_text(response)
    except Exception:
        logger.error(f"Failed parsing skin analysis: {response[:300]}")
        raise HTTPException(status_code=500, detail="Erreur analyse, réessayez avec une autre photo")

    await db.skin_analyses.insert_one({
        "analysis_id": f"sa_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "skin_type": data.get("skin_type", ""),
        "concerns": data.get("concerns", []),
        "summary": data.get("summary", ""),
        "created_at": now_utc(),
    })

    return data


# ---------- Product Analysis ----------
def normalize_ingredient_name(name: str) -> str:

    name = str(name or "").upper()

    # retire contenu parenthèses
    name = re.sub(r"\(.*?\)", "", name)

    # retire séparateurs
    name = (
        name
        .replace(".", "")
        .replace(",", "")
        .replace("/", " ")
        .replace("\\", " ")
        .replace("-", " ")
    )

    # retire doubles espaces
    name = re.sub(r"\s+", " ", name)

    return name.strip()


async def load_ingredients_map() -> Dict[str, Dict[str, Any]]:
    cursor = db.ingredients.find({}, {"_id": 0})
    ingredients = await cursor.to_list(length=1000)

    ingredients_map = {}

    for ing in ingredients:
        inci = normalize_ingredient_name(ing.get("inci_name"))
        ingredients_map[inci] = ing

        for alias in ing.get("aliases", []):
            alias_name = normalize_ingredient_name(alias)
            ingredients_map[alias_name] = ing

    return ingredients_map


def score_product_with_ingredients(
    product: Dict[str, Any],
    profile: Dict[str, Any],
    ingredients_map: Dict[str, Dict[str, Any]]
) -> int:
    score = 50

    skin_type = profile.get("skin_type", "")
    concerns = profile.get("concerns", [])
    sensitivity = profile.get("sensitivity", "")

    product_ingredients = product.get("ingredients", [])
    price_category = product.get("price_category", "")

    # Bonus catégorie profil
    if skin_type and skin_type in product.get("skin_types", []):
        score += 15

    # Bonus concern produit
    for concern in concerns:
        if concern in product.get("concerns", []):
            score += 12

    has_fragrance = False
    has_alcohol_denat = False
    has_good_active = False

    for raw_ing in product_ingredients:
        ing_name = normalize_ingredient_name(raw_ing)
        ing_data = ingredients_map.get(ing_name)

        if not ing_data:
            continue

        category = ing_data.get("category", "")
        benefits = ing_data.get("official_benefits", [])
        avoid_for = ing_data.get("avoid_for", [])
        risk_level = ing_data.get("risk_level", "low")
        comedogenic = ing_data.get("comedogenic_rating")
        score_weight = int(ing_data.get("score_weight", 0))

        score += score_weight

        # Détection parfum / alcool
        if category == "fragrance":
            has_fragrance = True

        if ing_data.get("inci_name") == "ALCOHOL DENAT.":
            has_alcohol_denat = True

        # Bonus actif utile
        for concern in concerns:
            if concern in benefits:
                score += 8
                has_good_active = True

        # Malus peau sensible
        if sensitivity in ["moyenne", "forte"] and "sensible" in avoid_for:
            score -= 14

        # Malus peau sèche
        if skin_type == "seche" and "seche" in avoid_for:
            score -= 10

        # Malus acné
        if "acne" in concerns and "acne" in avoid_for:
            score -= 10

        if "acne" in concerns and isinstance(comedogenic, int) and comedogenic >= 3:
            score -= 14

        # Malus risque
        if risk_level == "high":
            score -= 10
        elif risk_level == "medium":
            score -= 4

    # Malus global parfum
    if has_fragrance:
        score -= 8
        if sensitivity in ["moyenne", "forte"]:
            score -= 8

    # Malus global alcool denat
    if has_alcohol_denat:
        score -= 15
        if sensitivity in ["moyenne", "forte"]:
            score -= 10

    # Prix : on évite que le luxe monte trop sans vraie raison
    if price_category == "high":
        score -= 8

        if not has_good_active:
            score -= 10

    elif price_category == "mid":
        score += 2

    elif price_category == "low":
        score += 4

    return max(0, min(score, 100))
def analyze_ingredients_for_user(
    ingredient_names: List[str],
    profile: Dict[str, Any],
    ingredients_map: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    good = []
    caution = []
    bad = []
    unknown = []

    concerns = profile.get("concerns", [])
    skin_type = profile.get("skin_type", "")
    sensitivity = profile.get("sensitivity", "")

    total_score = 50

    for index, raw_name in enumerate(ingredient_names):
        normalized = normalize_ingredient_name(raw_name)
        ing = ingredients_map.get(normalized)

        if not ing:
            unknown.append(raw_name)
            continue

        score = int(ing.get("score_weight", 0))

        if index <= 4:
            position_multiplier = 1.5
        elif index <= 9:
            position_multiplier = 1.2
        elif index <= 19:
            position_multiplier = 0.8
        else:
            position_multiplier = 0.5

        score = int(score * position_multiplier)
        total_score += score

        benefits = ing.get("official_benefits", [])
        avoid_for = ing.get("avoid_for", [])
        risk_level = ing.get("risk_level", "low")
        comedogenic = ing.get("comedogenic_rating")

        reasons = []

        for concern in concerns:
            if concern in benefits:
                total_score += 6
                reasons.append(f"utile pour {concern}")

        if sensitivity in ["moyenne", "forte"] and "sensible" in avoid_for:
            total_score -= 12
            reasons.append("à surveiller pour peau sensible")

        if skin_type == "seche" and "seche" in avoid_for:
            total_score -= 10
            reasons.append("peut assécher une peau sèche")

        if "acne" in concerns and "acne" in avoid_for:
            total_score -= 10
            reasons.append("à éviter si tendance acnéique")

        if "acne" in concerns and isinstance(comedogenic, int) and comedogenic >= 3:
            total_score -= 12
            reasons.append("potentiel comédogène élevé")

        if normalized in ["PARFUM", "FRAGRANCE"] and sensitivity in ["moyenne", "forte"]:
            total_score -= 15
            reasons.append("parfum peu adapté aux peaux sensibles")

        if normalized in ["ALCOHOL DENAT", "ALCOHOL DENAT"] and sensitivity in ["moyenne", "forte"]:
            total_score -= 18
            reasons.append("alcool dénaturé irritant pour peau sensible")

        if normalized in ["RETINOL", "RETINAL"] and sensitivity in ["moyenne", "forte"]:
            total_score -= 8
            reasons.append("actif puissant à introduire progressivement")

        item = {
            "name": ing.get("inci_name", raw_name),
            "category": ing.get("category"),
            "risk_level": risk_level,
            "benefits": benefits,
            "avoid_for": avoid_for,
            "comedogenic_rating": comedogenic,
            "score_weight": score,
            "reasons": reasons
        }

        is_active = len(benefits) > 0

        if score <= -10:
            bad.append(item)
        elif risk_level == "high":
            if is_active:
                caution.append(item)
            else:
                bad.append(item)
        elif risk_level == "medium" or score < 0:
            caution.append(item)
        else:
            good.append(item)

    names = [normalize_ingredient_name(x) for x in ingredient_names]

    if "NIACINAMIDE" in names and "CERAMIDE NP" in names:
        total_score += 8

    if ("RETINOL" in names or "RETINAL" in names) and ("PARFUM" in names or "FRAGRANCE" in names):
        total_score -= 10

    final_score = max(0, min(total_score, 100))

    if final_score < 40 and len(bad) == 0:
        final_score = 45

    return {
        "ingredient_score": final_score,
        "good_ingredients": good,
        "caution_ingredients": caution,
        "bad_ingredients": bad,
        "unknown_ingredients": unknown[:10]
    }
    
ONE_PERCENT_MARKERS = [
    "PHENOXYETHANOL",
    "SODIUM BENZOATE",
    "POTASSIUM SORBATE",
    "ETHYLHEXYLGLYCERIN",
    "CAPRYLYL GLYCOL",
    "CHLORPHENESIN",
    "BENZYL ALCOHOL"
]


def find_one_percent_line(ingredient_names: List[str]) -> Optional[int]:
    for index, raw_name in enumerate(ingredient_names):
        normalized = normalize_ingredient_name(raw_name)

        if normalized in ONE_PERCENT_MARKERS:
            return index

    return None


def analyze_formula_positioning(
    ingredient_names: List[str],
    ingredients_map: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    one_percent_index = find_one_percent_line(ingredient_names)
    marketing_flags = []
    integrity_score = 100

    if one_percent_index is None:
        return {
            "one_percent_line_index": None,
            "one_percent_marker": None,
            "ingredient_integrity_score": integrity_score,
            "marketing_flags": []
        }

    one_percent_marker = ingredient_names[one_percent_index].strip()

    for index, raw_name in enumerate(ingredient_names):
        normalized = normalize_ingredient_name(raw_name)
        ing = ingredients_map.get(normalized)

        if not ing:
            continue

        dose_sensitivity = ing.get("dose_sensitivity", "medium")
        effective_at_low_dose = ing.get("effective_at_low_dose", False)
        benefits = ing.get("official_benefits", [])

        if not benefits:
            continue

        if index > one_percent_index:
            if dose_sensitivity == "high" and not effective_at_low_dose:
                integrity_score -= 15
                marketing_flags.append({
                    "ingredient": ing.get("inci_name", raw_name),
                    "position": index + 1,
                    "severity": "high",
                    "type": "low_position_active",
                    "message": f"{ing.get('inci_name', raw_name)} apparaît après un marqueur proche de 1%, sa concentration est probablement faible pour un ingrédient qui dépend beaucoup du dosage."
                })

            elif dose_sensitivity == "medium" and not effective_at_low_dose:
                integrity_score -= 8
                marketing_flags.append({
                    "ingredient": ing.get("inci_name", raw_name),
                    "position": index + 1,
                    "severity": "medium",
                    "type": "possible_low_concentration",
                    "message": f"{ing.get('inci_name', raw_name)} apparaît assez bas dans la liste INCI. Il peut être présent à concentration limitée."
                })

            elif dose_sensitivity == "low" or effective_at_low_dose:
                marketing_flags.append({
                    "ingredient": ing.get("inci_name", raw_name),
                    "position": index + 1,
                    "severity": "low",
                    "type": "low_dose_but_potentially_effective",
                    "message": f"{ing.get('inci_name', raw_name)} apparaît bas dans la liste, mais cet actif peut rester pertinent à faible dose."
                })

    return {
        "one_percent_line_index": one_percent_index + 1,
        "one_percent_marker": one_percent_marker,
        "ingredient_integrity_score": max(0, min(integrity_score, 100)),
        "marketing_flags": marketing_flags[:8]
    }
def normalize_inci_text(text: str) -> str:
    text = str(text or "").upper()
    text = text.replace("\n", ",")
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def make_inci_hash(text: str) -> str:
    normalized = normalize_inci_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


async def check_daily_analysis_limit(user_id: str, limit: int = 5):
    today = now_utc().date().isoformat()

    count = await db.product_analyses.count_documents({
        "user_id": user_id,
        "created_at_day": today
    })

    if count >= limit:
        raise HTTPException(
            status_code=429,
            detail="Limite quotidienne atteinte. Réessayez demain."
        )

@api_router.post("/products/analyze")
async def analyze_product(payload: ProductAnalysisRequest, user=Depends(get_current_user)):
    if not payload.image_base64 and not payload.ingredients_text:
        raise HTTPException(
            status_code=400,
            detail="Fournissez une photo ou la liste d'ingrédients"
        )

    profile = user.get("skin_profile") or {}

    await check_daily_analysis_limit(user["user_id"], limit=5)

    ingredients_map = await load_ingredients_map()

    cache_key = None

    if payload.ingredients_text:
        cache_key = make_inci_hash(
            normalize_inci_text(payload.ingredients_text)
        )

        cached = await db.product_analysis_cache.find_one(
            {"cache_key": cache_key},
            {"_id": 0}
        )

        if cached:
            cached_result = dict(cached["result"])
            cached_result["from_cache"] = True
            cached_result["analysis_id"] = f"pa_{uuid.uuid4().hex[:12]}"
            cached_result["user_id"] = user["user_id"]
            cached_result["created_at"] = now_utc()
            cached_result["created_at_day"] = now_utc().date().isoformat()

            await db.product_analyses.insert_one(cached_result)
            cached_result.pop("_id", None)

            return cached_result

    profile_text = (
        f"Type de peau: {profile.get('skin_type', 'inconnu')}, "
        f"Sensibilité: {profile.get('sensitivity', 'inconnue')}, "
        f"Préoccupations: {', '.join(profile.get('concerns', [])) or 'aucune'}, "
        f"Allergies connues: {profile.get('allergies') or 'aucune'}"
    )

    prompt = f"""
Profil utilisateur :
{profile_text}

Nom du produit :
{payload.name or "Produit analysé"}

Texte ingrédients fourni :
{payload.ingredients_text or "Aucun texte fourni"}

Image fournie :
{"Oui" if payload.image_base64 else "Non"}

Mission :
- Si une image est fournie, lis la liste INCI visible sur l'image.
- Si un texte ingrédients est fourni, utilise aussi ce texte.
- Analyse ensuite le produit pour le profil utilisateur.
- Si l'image ou le texte est illisible, mets "unreadable": true.

Réponds STRICTEMENT avec ce JSON, sans texte autour :

{{
  "unreadable": false,
  "product_name": "string",
  "product_category": "moisturizer|serum|cleanser|spf|eye_care|mask|exfoliant|skincare",
  "score": 0,
  "extracted_ingredients_text": "string",
  "ingredients": [
    {{
      "name": "string",
      "role": "string",
      "flag": "green|orange|red",
      "note": "string"
    }}
  ],
  "risks": [],
  "compatibility": {{
    "verdict": "compatible|à surveiller|incompatible",
    "reasons": ["string"]
  }},
  "decision": {{
    "label": "À utiliser|Avec précaution|À éviter",
    "color": "green|orange|red",
    "justification": "string"
  }},
  "alternatives": []
}}

Contraintes :
- Pas de texte hors JSON
- product_category doit être une des valeurs indiquées
- Maximum 12 ingrédients
- Maximum 3 risques
"""

    response = None

    try:
        if not genai_client:
            raise Exception("Gemini non configuré")

        contents = [prompt]

        if payload.image_base64:
            img_b64 = payload.image_base64

            if img_b64.startswith("data:"):
                img_b64 = img_b64.split(",", 1)[1]

            contents.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_b64
                }
            })

        gemini_response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents
        )

        response = gemini_response.text

    except Exception as e:
        logger.exception("Gemini product analysis error")

        raw_ingredients = payload.ingredients_text.split(",") if payload.ingredients_text else []

        ingredient_analysis = analyze_ingredients_for_user(
            raw_ingredients,
            profile,
            ingredients_map
        )

        formula_positioning = analyze_formula_positioning(
            raw_ingredients,
            ingredients_map
        )

        fallback_doc = {
            "analysis_id": f"pa_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "product_name": payload.name or "Produit analysé",
            "product_category": "skincare",
            "score": ingredient_analysis["ingredient_score"],
            "ingredients": [],
            "risks": [],
            "compatibility": {
                "verdict": "à surveiller",
                "reasons": [
                    "Analyse IA temporairement limitée, analyse ingrédients locale utilisée."
                ]
            },
            "decision": {
                "label": "Avec précaution",
                "color": "orange",
                "justification": "Analyse basée sur votre base ingrédients locale."
            },
            "alternatives": [],
            "ingredient_analysis": ingredient_analysis,
            "formula_positioning": formula_positioning,
            "recommended_products": [],
            "from_fallback": True,
            "created_at": now_utc(),
            "created_at_day": now_utc().date().isoformat(),
        }

        await db.product_analyses.insert_one(fallback_doc)
        fallback_doc.pop("_id", None)

        return fallback_doc

    try:
        data = parse_json_from_text(response)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Analyse temporairement indisponible. Réessayez dans quelques instants."
        )

    extracted_text = (
        data.get("extracted_ingredients_text")
        or payload.ingredients_text
        or ""
    )

    if extracted_text:
        cache_key = make_inci_hash(
            normalize_inci_text(extracted_text)
        )

        cached = await db.product_analysis_cache.find_one(
            {"cache_key": cache_key},
            {"_id": 0}
        )

        if cached:
            cached_result = dict(cached["result"])
            cached_result["from_cache"] = True
            cached_result["analysis_id"] = f"pa_{uuid.uuid4().hex[:12]}"
            cached_result["user_id"] = user["user_id"]
            cached_result["created_at"] = now_utc()
            cached_result["created_at_day"] = now_utc().date().isoformat()

            await db.product_analyses.insert_one(cached_result)
            cached_result.pop("_id", None)

            return cached_result

    ingredient_source = [
        i.get("name", "")
        for i in data.get("ingredients", [])
    ]

    if not ingredient_source and extracted_text:
        ingredient_source = extracted_text.split(",")

    ingredient_analysis = analyze_ingredients_for_user(
        ingredient_source,
        profile,
        ingredients_map
    )

    data["ingredient_analysis"] = ingredient_analysis

    formula_positioning = analyze_formula_positioning(
        extracted_text.split(","),
        ingredients_map
    )

    data["formula_positioning"] = formula_positioning

    analyzed_category = str(data.get("product_category", "")).lower().strip()

    query = {"verified": True}

    if analyzed_category:
        query["category"] = analyzed_category

    cursor = db.products.find(query, {"_id": 0})
    products = await cursor.to_list(length=300)

    recommended_products = []

    for product in products:
        match_score = score_product_with_ingredients(
            product,
            profile,
            ingredients_map
        )

        product["match_score"] = match_score
        recommended_products.append(product)

    recommended_products.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    data["recommended_products"] = recommended_products[:5]

    analysis_doc = {
        "analysis_id": f"pa_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "product_name": data.get("product_name") or payload.name or "Produit analysé",
        "product_category": data.get("product_category") or "skincare",
        "score": data.get("score") or ingredient_analysis["ingredient_score"],
        "extracted_ingredients_text": extracted_text,
        "ingredients": data.get("ingredients", []),
        "risks": data.get("risks", []),
        "compatibility": data.get("compatibility"),
        "decision": data.get("decision"),
        "alternatives": data.get("alternatives", []),
        "ingredient_analysis": data.get("ingredient_analysis"),
        "formula_positioning": data.get("formula_positioning"),
        "recommended_products": data.get("recommended_products", []),
        "created_at": now_utc(),
        "created_at_day": now_utc().date().isoformat(),
    }

    if cache_key and extracted_text:
        cache_doc = {
            "cache_key": cache_key,
            "ingredients_text": extracted_text,
            "product_name": analysis_doc.get("product_name"),
            "result": analysis_doc,
            "created_at": now_utc(),
        }

        await db.product_analysis_cache.update_one(
            {"cache_key": cache_key},
            {"$set": cache_doc},
            upsert=True
        )

    await db.product_analyses.insert_one(analysis_doc)

    analysis_doc.pop("_id", None)

    return analysis_doc


@api_router.get("/products/recommendations")
async def recommend_products(user=Depends(get_current_user)):
    profile = user.get("skin_profile") or {}
    ingredients_map = await load_ingredients_map()

    cursor = db.products.find({"verified": True}, {"_id": 0})
    products = await cursor.to_list(length=300)

    scored_products = []

    for product in products:
        score = score_product_with_ingredients(product, profile, ingredients_map)
        product["match_score"] = score
        scored_products.append(product)

    scored_products.sort(key=lambda x: x["match_score"], reverse=True)

    return scored_products[:5]


@api_router.get("/products")
async def list_products(user=Depends(get_current_user)):
    cursor = db.product_analyses.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50)
    items = await cursor.to_list(length=50)
    return items


@api_router.delete("/products/{analysis_id}")
async def delete_product(analysis_id: str, user=Depends(get_current_user)):
    res = await db.product_analyses.delete_one(
        {"analysis_id": analysis_id, "user_id": user["user_id"]}
    )
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analyse introuvable")
    return {"ok": True}


# ---------- Daily Tracking ----------
@api_router.post("/tracking/toggle")
async def toggle_step(payload: TrackingUpdate, user=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    key = f"{payload.routine_type}_{payload.step_order}"
    doc = await db.tracking.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0}
    )
    if not doc:
        doc = {"user_id": user["user_id"], "date": today, "completed": {}}
    doc["completed"][key] = payload.completed
    await db.tracking.update_one(
        {"user_id": user["user_id"], "date": today},
        {"$set": doc},
        upsert=True,
    )
    return {"date": today, "completed": doc["completed"]}


@api_router.get("/tracking/today")
async def get_today_tracking(user=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    doc = await db.tracking.find_one(
        {"user_id": user["user_id"], "date": today}, {"_id": 0}
    )
    return doc or {"date": today, "completed": {}}


@api_router.get("/tracking/stats")
async def tracking_stats(user=Depends(get_current_user)):
    cursor = db.tracking.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", -1).limit(30)
    docs = await cursor.to_list(length=30)
    total_days = len(docs)
    streak = 0
    today = now_utc().date()
    for i, d in enumerate(docs):
        try:
            ddate = datetime.fromisoformat(d["date"]).date()
        except Exception:
            continue
        if (today - ddate).days == i and any(d.get("completed", {}).values()):
            streak += 1
        else:
            break
    return {"total_days": total_days, "streak": streak, "history": docs}


# ---------- Journal ----------
@api_router.post("/journal", response_model=JournalEntry)
async def add_journal(payload: JournalCreate, user=Depends(get_current_user)):
    entry = {
        "entry_id": f"j_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "image_base64": payload.image_base64,
        "note": payload.note or "",
        "created_at": now_utc(),
    }
    await db.journal.insert_one(dict(entry))
    entry.pop("_id", None)
    return JournalEntry(**entry)


@api_router.get("/journal")
async def list_journal(user=Depends(get_current_user)):
    cursor = db.journal.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).limit(100)
    entries = await cursor.to_list(length=100)
    return entries


@api_router.delete("/journal/{entry_id}")
async def delete_journal(entry_id: str, user=Depends(get_current_user)):
    res = await db.journal.delete_one({"entry_id": entry_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entrée introuvable")
    return {"ok": True}


# ---------- Seasonal Tips ----------
SEASONAL_TIPS = {
    "hiver": [
        "Le froid assèche la peau : intensifiez l'hydratation avec une crème riche.",
        "Utilisez un humidificateur la nuit pour préserver l'éclat de la peau.",
        "N'oubliez pas le SPF même en hiver, surtout en montagne.",
        "Privilégiez les nettoyants doux et crémeux plutôt que les gels agressifs.",
    ],
    "printemps": [
        "Réintroduisez progressivement les actifs comme le rétinol après l'hiver.",
        "Exfoliez doucement pour révéler l'éclat naturel de la peau.",
        "Allégez votre crème de jour avec une texture fluide.",
        "Pensez aux antioxydants comme la vitamine C pour booster l'éclat.",
    ],
    "été": [
        "SPF 50 chaque matin : votre meilleur allié anti-âge.",
        "Brumisez votre visage pour une hydratation rafraîchissante.",
        "Préférez des textures gel ou fluides aux crèmes lourdes.",
        "Hydratez-vous de l'intérieur : 1,5L d'eau minimum par jour.",
    ],
    "automne": [
        "Saison idéale pour les soins ciblés : sérums, peelings doux.",
        "Réintroduisez des huiles nourrissantes le soir.",
        "Hydratez les lèvres et le contour des yeux, plus fragiles.",
        "Le changement de température demande une crème plus protectrice.",
    ],
}


@api_router.get("/tips/seasonal")
async def seasonal_tips():
    season = get_current_season()
    return {
        "season": season,
        "tips": SEASONAL_TIPS.get(season, []),
        "tip_of_day": SEASONAL_TIPS.get(season, ["Prenez soin de vous."])[now_utc().day % len(SEASONAL_TIPS.get(season, ["x"]))],
    }


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "Skincare API", "status": "ok"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "db": "connected",
        "gemini_configured": bool(genai_client),
        "time": now_utc()
    }
# ---------- Startup: seed demo user ----------
@app.on_event("startup")
async def startup_event():
    demo_email = "demo@skincare.app"
    existing = await db.users.find_one({"email": demo_email})
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": demo_email,
            "name": "Sophie Demo",
            "password_hash": hash_password("Demo1234!"),
            "picture": None,
            "skin_profile": None,
            "created_at": now_utc(),
        })
        logger.info("Demo user seeded: demo@skincare.app / Demo1234!")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
