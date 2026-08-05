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
import secrets
import resend
from datetime import timedelta
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta, date
from google import genai
from oasis_core.learning_engine import compute_user_learnings
from oasis_core.formula_engine import analyze_formula
from oasis_core.marketing_engine import analyze_marketing_claims
from oasis_core.synergy_engine import analyze_synergies
from oasis_core.access_control import (
    build_access_summary,
    can_analyze_product,
    can_analyze_selfie,
    default_subscription,
)


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

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
APP_RESET_URL = os.environ.get(
    "APP_RESET_URL",
    "oasis://reset-password"
)

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    print("RESEND CONFIGURED:", bool(RESEND_API_KEY))
    
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

    subscription: Dict[str, Any] = Field(
        default_factory=default_subscription
    )

    access: Dict[str, Any] = Field(
        default_factory=dict
    )

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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str   

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

class SkinTrackingRequest(BaseModel):
    hydration: int
    glow: int
    texture: int
    irritation: int
    breakouts: int
    redness: int
    note: Optional[str] = ""
    image_base64: Optional[str] = ""
    
    linked_products: List[str] = Field(default_factory=list)

class SkinAnalysisRequest(BaseModel):
    image_base64: str


class ProductAnalysisRequest(BaseModel):
    name: Optional[str] = ""
    image_base64: Optional[str] = ""
    ingredients_text: Optional[str] = ""
    marketing_claims: List[str] = Field(default_factory=list)
    
class ProductOutcomeFeedbackRequest(BaseModel):
    analysis_id: str
    product_name: str

    overall_result: str

    hydration_delta: int = 0
    glow_delta: int = 0
    irritation_delta: int = 0
    breakouts_delta: int = 0

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


def serialize_user(
    doc: Dict[str, Any]
) -> User:
    access_summary = build_access_summary(
        doc
    )

    return User(
        user_id=doc["user_id"],
        email=doc["email"],
        name=doc.get("name", ""),
        picture=doc.get("picture"),
        has_profile=bool(
            doc.get("skin_profile")
        ),
        created_at=doc.get(
            "created_at",
            now_utc(),
        ),
        subscription=access_summary[
            "subscription"
        ],
        access=access_summary,
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
        "subscription": default_subscription(),
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
            "subscription": default_subscription(),
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


@api_router.get(
    "/auth/me",
    response_model=User,
)
async def auth_me(
    user=Depends(get_current_user)
):
    if not user.get("subscription"):
        subscription = (
            default_subscription()
        )

        await db.users.update_one(
            {
                "user_id": user["user_id"],
            },
            {
                "$set": {
                    "subscription": (
                        subscription
                    )
                }
            },
        )

        user["subscription"] = (
            subscription
        )

    return serialize_user(user)

@api_router.get("/access/usage")
async def get_access_usage(
    user=Depends(get_current_user),
):
    now = now_utc()
    today = now.date().isoformat()

    month_start = datetime(
        year=now.year,
        month=now.month,
        day=1,
        tzinfo=timezone.utc,
    )

    if now.month == 12:
        next_month_start = datetime(
            year=now.year + 1,
            month=1,
            day=1,
            tzinfo=timezone.utc,
        )
    else:
        next_month_start = datetime(
            year=now.year,
            month=now.month + 1,
            day=1,
            tzinfo=timezone.utc,
        )

    product_analyses_used = (
        await db.product_analysis_usage
        .count_documents({
            "user_id": user["user_id"],
            "created_at_day": today,
        })
    )

    selfie_analyses_used = (
        await db.skin_analyses
        .count_documents({
            "user_id": user["user_id"],
            "created_at": {
                "$gte": month_start,
                "$lt": next_month_start,
            },
        })
    )

    access = build_access_summary(user)

    limits = access.get("limits", {})

    product_limit = limits.get(
        "product_analyses_per_day"
    )

    selfie_limit = limits.get(
        "selfie_analyses_per_month"
    )

    def compute_remaining(
        limit: Optional[int],
        used: int,
    ) -> Optional[int]:
        if limit is None:
            return None

        return max(
            0,
            limit - used,
        )

    return {
        "plan": access.get(
            "plan",
            "free",
        ),
        "is_premium": access.get(
            "is_premium",
            False,
        ),
        "subscription": access.get(
            "subscription"
        ),
        "usage": {
            "product_analyses": {
                "period": "day",
                "used": product_analyses_used,
                "limit": product_limit,
                "remaining": compute_remaining(
                    product_limit,
                    product_analyses_used,
                ),
            },
            "selfie_analyses": {
                "period": "month",
                "used": selfie_analyses_used,
                "limit": selfie_limit,
                "remaining": compute_remaining(
                    selfie_limit,
                    selfie_analyses_used,
                ),
            },
        },
        "features": access.get(
            "features",
            {},
        ),
    }

@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}
    
@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await db.users.find_one({
        "email": payload.email.lower()
    })

    generic_message = {
        "message": "Si un compte existe, un email sera envoyé."
    }

    if not user:
        return generic_message

    reset_token = secrets.token_urlsafe(32)
    reset_link = f"{APP_RESET_URL}?token={reset_token}"
    print("RESET LINK:", reset_link)

    await db.password_reset_tokens.insert_one({
        "token": reset_token,
        "user_id": user["user_id"],
        "email": payload.email.lower(),
        "expires_at": now_utc() + timedelta(minutes=30),
        "used": False,
        "created_at": now_utc()
    })

    try:
        resend.Emails.send({
            "from": "OASIS <onboarding@resend.dev>",
            "to": [payload.email.lower()],
            "subject": "Réinitialisation de votre mot de passe OASIS",
            "html": f"""
  <h2>Réinitialisation du mot de passe</h2>

  <p>Vous avez demandé à réinitialiser votre mot de passe OASIS.</p>

  <p>
    <a href="{reset_link}">Réinitialiser mon mot de passe</a>
  </p>

  <p>Si le bouton ne fonctionne pas, copiez ce lien :</p>

  <p>{reset_link}</p>

  <p>Ce lien expire dans 30 minutes.</p>

  <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
""",
"text": f"""
Réinitialisation du mot de passe OASIS

Copiez ce lien dans votre navigateur/appareil :

{reset_link}

Ce lien expire dans 30 minutes.
"""
        })
    except Exception:
        logger.exception("Password reset email error")
        raise HTTPException(
            status_code=503,
            detail="Impossible d'envoyer l'email pour le moment."
        )

    return generic_message
    
@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):

    token_doc = await db.password_reset_tokens.find_one({
        "token": payload.token,
        "used": False
    })

    if not token_doc:
        raise HTTPException(
            status_code=400,
            detail="Lien invalide"
        )

    expires_at = token_doc["expires_at"]

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now_utc():
        raise HTTPException(
            status_code=400,
            detail="Lien expiré"
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Minimum 8 caractères"
        )

    await db.users.update_one(
        {
            "user_id": token_doc["user_id"]
        },
        {
            "$set": {
                "password_hash": hash_password(
                    payload.new_password
                )
            }
        }
    )

    await db.password_reset_tokens.update_one(
        {
            "token": payload.token
        },
        {
            "$set": {
                "used": True,
                "used_at": now_utc()
            }
        }
    )

    return {
        "success": True
    }


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
async def analyze_skin(
    payload: SkinAnalysisRequest,
    user=Depends(get_current_user)
):
    if not payload.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Image requise"
        )
    selfie_access = (
        await check_monthly_selfie_limit(
            user
        )
    )

    if not genai_client:
        raise HTTPException(
            status_code=503,
            detail="Analyse IA temporairement indisponible"
        )

    img_b64 = payload.image_base64

    if img_b64.startswith("data:"):
        img_b64 = img_b64.split(",", 1)[1]

    profile = user.get("skin_profile") or {}

    profile_text = (
        f"Type de peau déclaré : "
        f"{profile.get('skin_type', 'non renseigné')}\n"
        f"Sensibilité : "
        f"{profile.get('sensitivity', 'non renseignée')}\n"
        f"Préoccupations : "
        f"{', '.join(profile.get('concerns', [])) or 'aucune'}"
    )

    prompt = f"""
Tu es une experte skincare spécialisée dans l'observation visuelle de la peau.

Profil déclaré par l'utilisateur :
{profile_text}

Analyse uniquement ce qui est raisonnablement visible sur la photo.

Tu dois :
1. Estimer le type de peau visible.
2. Identifier les préoccupations visibles possibles.
3. Décrire l'état général de la peau.
4. Donner des recommandations simples et prudentes.
5. Ne jamais poser de diagnostic médical.
6. Ne jamais affirmer avec certitude une maladie ou une affection.
7. Si la photo est floue, sombre ou inexploitable, l'indiquer clairement.
8. Tenir compte du profil déclaré sans le considérer comme une vérité absolue.

Réponds uniquement en JSON valide.

Format exact :

{{
  "unreadable": false,
  "skin_type": "sèche|grasse|mixte|normale|sensible|indéterminée",
  "concerns": [
    "déshydratation",
    "rougeurs",
    "boutons",
    "texture",
    "pores",
    "taches",
    "manque d'éclat"
  ],
  "summary": "Résumé clair et prudent en 2 ou 3 phrases.",
  "observations": [
    {{
      "label": "string",
      "severity": "faible|modérée|marquée",
      "description": "string"
    }}
  ],
  "recommendations": [
    "Conseil simple et prudent"
  ],
  "confidence": 0,
  "disclaimer": "Analyse indicative basée sur une photo, ne remplace pas un avis dermatologique."
}}
"""

    try:
        gemini_response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img_b64
                    }
                }
            ]
        )

        response_text = gemini_response.text or ""

        data = parse_json_from_text(
            response_text
        )

    except Exception:
        logger.exception(
            "Gemini skin analysis error"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Analyse temporairement indisponible. "
                "Réessayez avec une photo nette et bien éclairée."
            )
        )

    result = {
        "unreadable": bool(
            data.get("unreadable", False)
        ),
        "skin_type": (
            data.get("skin_type")
            or "indéterminée"
        ),
        "concerns": data.get(
            "concerns",
            []
        ),
        "summary": (
            data.get("summary")
            or "Analyse non concluante."
        ),
        "observations": data.get(
            "observations",
            []
        ),
        "recommendations": data.get(
            "recommendations",
            []
        ),
        "confidence": max(
            0,
            min(
                int(data.get("confidence", 0)),
                100
            )
        ),
        "disclaimer": (
            data.get("disclaimer")
            or (
                "Analyse indicative basée sur une photo, "
                "ne remplace pas un avis dermatologique."
            )
        )
    }

    analysis_doc = {
        "analysis_id": (
            f"sa_{uuid.uuid4().hex[:12]}"
        ),
        "user_id": user["user_id"],
        **result,
        "created_at": now_utc(),
    }

    await db.skin_analyses.insert_one(
        analysis_doc
    )

    analysis_doc.pop("_id", None)

    analysis_doc["access"] = {
        "plan": selfie_access.get(
            "plan",
            "free",
        ),
        "limit": selfie_access.get(
            "limit"
        ),
        "used_before_analysis": (
            selfie_access.get(
                "used",
                0,
            )
        ),
        "remaining_after_analysis": (
            max(
                0,
                (
                    selfie_access.get(
                        "remaining",
                        1,
                    )
                    or 1
                ) - 1,
            )
            if selfie_access.get(
                "remaining"
            ) is not None
            else None
        ),
    }

    return analysis_doc


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
                    "message": f"{ing.get('inci_name', raw_name)} apparaît après un marqueur proche de 1%, sa concentration est probablement faible."
                })

            elif dose_sensitivity == "medium" and not effective_at_low_dose:
                integrity_score -= 8
                marketing_flags.append({
                    "ingredient": ing.get("inci_name", raw_name),
                    "position": index + 1,
                    "severity": "medium",
                    "type": "possible_low_concentration",
                    "message": f"{ing.get('inci_name', raw_name)} apparaît assez bas dans la liste INCI."
                })

            elif dose_sensitivity == "low" or effective_at_low_dose:
                marketing_flags.append({
                    "ingredient": ing.get("inci_name", raw_name),
                    "position": index + 1,
                    "severity": "low",
                    "type": "low_dose_but_potentially_effective",
                    "message": f"{ing.get('inci_name', raw_name)} apparaît bas, mais peut rester pertinent à faible dose."
                })

    return {
        "one_percent_line_index": one_percent_index + 1,
        "one_percent_marker": one_percent_marker,
        "ingredient_integrity_score": max(0, min(integrity_score, 100)),
        "marketing_flags": marketing_flags[:8]
    }


def analyze_ingredient_conflicts(ingredient_names: List[str]) -> Dict[str, Any]:
    names = [normalize_ingredient_name(x) for x in ingredient_names]

    conflicts = []
    score_penalty = 0

    has_retinoid = any(x in names for x in ["RETINOL", "RETINAL"])
    has_aha = any(x in names for x in ["GLYCOLIC ACID", "LACTIC ACID"])
    has_bha = "SALICYLIC ACID" in names
    has_vitamin_c = "ASCORBIC ACID" in names
    has_fragrance = any(x in names for x in ["PARFUM", "FRAGRANCE"])
    has_alcohol = any(x in names for x in ["ALCOHOL DENAT", "ALCOHOL DENAT."])

    if has_retinoid and (has_aha or has_bha):
        score_penalty += 15
        conflicts.append({
            "type": "irritation",
            "severity": "fort",
            "message": "Rétinol + acides exfoliants : risque d'irritation."
        })

    if has_vitamin_c and (has_aha or has_bha):
        score_penalty += 8
        conflicts.append({
            "type": "sensibilisation",
            "severity": "moyen",
            "message": "Vitamine C + exfoliants : peut sensibiliser certaines peaux."
        })

    if has_fragrance and has_alcohol:
        score_penalty += 10
        conflicts.append({
            "type": "peau sensible",
            "severity": "moyen",
            "message": "Parfum + alcool dénaturé : moins adapté aux peaux sensibles."
        })

    return {
        "conflicts": conflicts,
        "conflict_penalty": score_penalty
    }
def get_formula_ingredient_names(
    analysis_data: Dict[str, Any],
    ingredients_text: str = ""
) -> List[str]:
    ingredient_names = []

    for ingredient in analysis_data.get(
        "ingredients",
        []
    ):
        if isinstance(ingredient, dict):
            name = ingredient.get("name")

            if name:
                ingredient_names.append(name)

        elif isinstance(ingredient, str):
            ingredient_names.append(ingredient)

    if ingredient_names:
        return ingredient_names

    extracted_text = (
        analysis_data.get(
            "extracted_ingredients_text"
        )
        or ingredients_text
        or ""
    )

    return [
        ingredient.strip()
        for ingredient in extracted_text.split(",")
        if ingredient.strip()
    ]
    
def get_marketing_claims(
    payload_claims: List[str],
    analysis_data: Optional[Dict[str, Any]] = None
) -> List[str]:
    claims = []

    for claim in payload_claims or []:
        clean_claim = str(claim or "").strip()

        if clean_claim:
            claims.append(clean_claim)

    if claims:
        return claims[:10]

    analysis_data = analysis_data or {}

    for claim in analysis_data.get(
        "marketing_claims",
        []
    ):
        clean_claim = str(claim or "").strip()

        if clean_claim:
            claims.append(clean_claim)

    return claims[:10]
    
def normalize_inci_text(text: str) -> str:
    text = str(text or "").upper()
    text = text.replace("\n", ",")
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def make_inci_hash(text: str) -> str:
    normalized = normalize_inci_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


async def check_daily_analysis_limit(
    user: Dict[str, Any],
) -> Dict[str, Any]:
    today = now_utc().date().isoformat()

    analyses_used_today = (
        await db.product_analysis_usage
        .count_documents({
            "user_id": user["user_id"],
            "created_at_day": today,
        })
    )

    decision = can_analyze_product(
        user=user,
        analyses_used_today=(
            analyses_used_today
        ),
    )

    if not decision.allowed:
        if decision.upgrade_required:
            detail = (
                "Vous avez atteint la limite "
                f"de {decision.limit} analyses "
                "produits par jour avec le plan "
                "gratuit. Passez à OASIS Premium "
                "pour obtenir davantage d’analyses."
            )
        else:
            detail = (
                "Limite quotidienne d’analyses "
                "atteinte. Réessayez demain."
            )

        raise HTTPException(
            status_code=429,
            detail=detail,
        )

    return decision.to_dict()
    
async def check_monthly_selfie_limit(
    user: Dict[str, Any],
) -> Dict[str, Any]:
    now = now_utc()

    month_start = datetime(
        year=now.year,
        month=now.month,
        day=1,
        tzinfo=timezone.utc,
    )

    if now.month == 12:
        next_month_start = datetime(
            year=now.year + 1,
            month=1,
            day=1,
            tzinfo=timezone.utc,
        )
    else:
        next_month_start = datetime(
            year=now.year,
            month=now.month + 1,
            day=1,
            tzinfo=timezone.utc,
        )

    analyses_used_this_month = (
        await db.skin_analyses.count_documents({
            "user_id": user["user_id"],
            "created_at": {
                "$gte": month_start,
                "$lt": next_month_start,
            },
        })
    )

    decision = can_analyze_selfie(
        user=user,
        analyses_used_this_month=(
            analyses_used_this_month
        ),
    )

    if not decision.allowed:
        if decision.upgrade_required:
            detail = (
                "Vous avez atteint la limite "
                f"de {decision.limit} analyses selfie "
                "par mois avec le plan gratuit. "
                "Passez à OASIS Premium pour obtenir "
                "davantage d’analyses."
            )
        else:
            detail = (
                "Limite mensuelle d’analyses selfie "
                "atteinte."
            )

        raise HTTPException(
            status_code=429,
            detail=detail,
        )

    return decision.to_dict()

async def get_user_ingredient_preferences(user_id: str) -> Dict[str, int]:
    feedbacks = await db.product_feedback.find(
        {
            "user_id": user_id
        },
        {
            "_id": 0,
            "analysis_id": 1,
            "overall_result": 1
        }
    ).to_list(length=100)

    preferences = {}

    for feedback in feedbacks:
        analysis = await db.product_analyses.find_one(
            {
                "user_id": user_id,
                "analysis_id": feedback.get("analysis_id")
            },
            {
                "_id": 0,
                "ingredients": 1
            }
        )

        if not analysis:
            continue

        result = feedback.get("overall_result")

        for ingredient in analysis.get("ingredients", []):
            name = normalize_ingredient_name(
                ingredient.get("name")
            )

            if not name:
                continue

            if name not in preferences:
                preferences[name] = 0

            if result == "improved":
                preferences[name] += 2
            elif result == "stable":
                preferences[name] += 1
            elif result == "worse":
                preferences[name] -= 2

    return preferences
@api_router.post("/products/analyze")
async def analyze_product(payload: ProductAnalysisRequest, user=Depends(get_current_user)):
    if not payload.image_base64 and not payload.ingredients_text:
        raise HTTPException(
            status_code=400,
            detail="Fournissez une photo ou la liste d'ingrédients"
        )

    profile = user.get("skin_profile") or {}
    
    ingredient_preferences = await get_user_ingredient_preferences(
        user["user_id"]
    )
    
    analysis_access = (
        await check_daily_analysis_limit(
            user
        )
    )


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
            await db.product_analysis_usage.insert_one({
                "usage_id": f"usage_{uuid.uuid4().hex[:12]}",
                "user_id": user["user_id"],
                "created_at_day": now_utc().date().isoformat(),
                "created_at": now_utc()
            })
            cached_ingredient_names = (
                get_formula_ingredient_names(
                    cached_result,
                    payload.ingredients_text
                )
            )

            cached_result[
                "formula_analysis"
            ] = analyze_formula(
                ingredient_names=(
                    cached_ingredient_names
                ),
                profile=profile,
                ingredients_map=ingredients_map
            )
            cached_marketing_claims = (
                get_marketing_claims(
                    payload.marketing_claims,
                    cached_result
                )
            )

            cached_result[
                "marketing_claims"
            ] = cached_marketing_claims

            cached_result[
                "marketing_analysis"
            ] = analyze_marketing_claims(
                ingredient_names=(
                    cached_ingredient_names
                ),
                ingredients_map=ingredients_map,
                claims=cached_marketing_claims
            )

            cached_result[
                "synergy_analysis"
            ] = analyze_synergies(
                ingredient_names=(
                    cached_ingredient_names
                ),
                profile=profile,
                ingredients_map=ingredients_map
            )
            cached_result["access"] = {
                "plan": analysis_access.get(
                    "plan",
                    "free",
                ),
                "limit": analysis_access.get(
                    "limit"
                ),
                "used_before_analysis": (
                    analysis_access.get("used", 0)
                ),
                "remaining_after_analysis": (
                    max(
                        0,
                        (
                            analysis_access.get(
                                "remaining",
                                1,
                            )
                            or 1
                        ) - 1,
                    )
                    if analysis_access.get(
                        "remaining"
                    ) is not None
                    else None
                ),
            }
            return cached_result

    profile_text = (
        f"Type de peau: {profile.get('skin_type', 'inconnu')}, "
        f"Sensibilité: {profile.get('sensitivity', 'inconnue')}, "
        f"Préoccupations: {', '.join(profile.get('concerns', [])) or 'aucune'}, "
        f"Allergies connues: {profile.get('allergies') or 'aucune'}"
    )

    prompt = f"""
Tu es une experte skincare française spécialisée en analyse INCI.

Profil utilisateur :
{profile_text}

Nom du produit :
{payload.name or "Produit analysé"}

Promesses marketing fournies :
{", ".join(payload.marketing_claims) or "Aucune promesse fournie"}

Texte ingrédients fourni :
{payload.ingredients_text or "Aucun texte fourni"}

Image fournie :
{"Oui" if payload.image_base64 else "Non"}

Mission :
1. Extraire ou nettoyer la liste INCI.
2. Identifier les ingrédients utiles pour le profil.
3. Identifier les ingrédients à surveiller.
4. Évaluer la compatibilité avec la peau de l'utilisateur.
5. Donner une décision claire et honnête.
6. Ne sois pas alarmiste.
7. Ne donne jamais de diagnostic médical.
8. Identifier les principales promesses marketing visibles ou fournies.

Règles :
- Si peau sensible : surveille parfum, huiles essentielles, alcool dénaturé, exfoliants forts.
- Si acné/pores : surveille ingrédients comédogènes, huiles lourdes, occlusifs excessifs.
- Si peau sèche : valorise glycérine, céramides, acide hyaluronique, panthénol, squalane.
- Si taches/éclat : valorise niacinamide, vitamine C, acide azélaïque, SPF.
- Si rides : valorise rétinol, peptides, antioxydants, hydratants.
- Le score doit vraiment varier selon le profil.
- Maximum 15 ingrédients analysés.
- Réponds uniquement en JSON valide.
- Le champ score_explanation doit expliquer le score de manière claire et rassurante.
- Le champ barrier_risk doit être personnalisé selon le profil utilisateur, surtout la sensibilité, sécheresse, acné, rougeurs ou exfoliants.
- Barrier risk = risque que la formule fragilise ou irrite la barrière cutanée selon le profil.
- Le champ profile_match doit expliquer pourquoi le produit correspond ou non au profil peau.

Format exact :

{{
  "unreadable": false,
  "product_name": "string",
  "product_category": "moisturizer|serum|cleanser|spf|eye_care|mask|exfoliant|skincare",
  "score": 0,
  "extracted_ingredients_text": "string",
  "marketing_claims": [
    "Promesse marketing détectée ou fournie"
    ],
  "score_explanation": {{
    "summary": "Explique en 1 phrase pourquoi ce score est donné selon le profil utilisateur.",
    "positives": [
      "Point positif concret lié aux ingrédients et au profil utilisateur"
    ],
    "warnings": [
      "Point de vigilance concret lié aux ingrédients et au profil utilisateur"
    ]
  }},

  "barrier_risk": {{
    "level": "faible|moyen|élevé",
    "reasons": [
      "Explique pourquoi ce produit peut ou non fragiliser la barrière cutanée selon le profil utilisateur"
    ],
    "advice": "Conseil d'utilisation simple selon le niveau de risque"
  }},

  "profile_match": {{
    "skin_type_match": "Explique si le produit correspond au type de peau de l'utilisateur",
    "concerns_match": [
      "Explique les préoccupations du profil que le produit peut aider"
    ],
    "avoid_reasons": [
      "Explique les raisons éventuelles d'éviter ou limiter ce produit"
    ]
  }},

  "ingredients": [
    {{
      "name": "string",
      "role": "string",
      "flag": "green|orange|red",
      "note": "string"
    }}
  ],

  "risks": [
    {{
      "type": "string",
      "severity": "faible|moyen|fort",
      "description": "string"
    }}
  ],

  "compatibility": {{
    "verdict": "compatible|à surveiller|incompatible",
    "reasons": ["string"]
  }},

  "decision": {{
    "label": "À utiliser|Avec précaution|À éviter",
    "color": "green|orange|red",
    "justification": "string"
  }},

  "alternatives": [
    {{
      "criterion": "string",
      "why": "string"
    }}
  ],

  "disclaimer": "Analyse indicative, ne remplace pas un avis dermatologique."
}}
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
        formula_analysis = analyze_formula(
            ingredient_names=raw_ingredients,
            profile=profile,
            ingredients_map=ingredients_map
        )
        marketing_claims = get_marketing_claims(
            payload.marketing_claims
        )

        marketing_analysis = (
            analyze_marketing_claims(
                ingredient_names=raw_ingredients,
                ingredients_map=ingredients_map,
                claims=marketing_claims
            )
            
        )
        synergy_analysis = analyze_synergies(
            ingredient_names=raw_ingredients,
            profile=profile,
            ingredients_map=ingredients_map
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
            "formula_analysis": formula_analysis,
            "marketing_claims":
                marketing_claims,

            "marketing_analysis":
                marketing_analysis,
            "synergy_analysis":
                synergy_analysis,
            "recommended_products": [],
            "from_fallback": True,
            "created_at": now_utc(),
            "created_at_day": now_utc().date().isoformat(),
        }

        await db.product_analyses.insert_one(fallback_doc)
        fallback_doc.pop("_id", None)
        await db.product_analysis_usage.insert_one({
            "usage_id": f"usage_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "created_at_day": now_utc().date().isoformat(),
            "created_at": now_utc()
        })
        fallback_doc["access"] = {
            "plan": analysis_access.get(
                "plan",
                "free",
           ),
            "limit": analysis_access.get(
                "limit"
           ),
            "used_before_analysis": (
                analysis_access.get("used", 0)
           ),
            "remaining_after_analysis": (
                max(
                    0,
                    (
                        analysis_access.get(
                            "remaining",
                            1,
                        )
                        or 1
                    ) - 1,
                )
                if analysis_access.get(
                    "remaining"
                ) is not None
                else None
            ),
        }
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
            cached_result["analysis_id"] = (
                f"pa_{uuid.uuid4().hex[:12]}"
            )
            cached_result["user_id"] = user["user_id"]
            cached_result["created_at"] = now_utc()
            cached_result["created_at_day"] = (
                now_utc().date().isoformat()
            )

            cached_ingredient_names = (
                get_formula_ingredient_names(
                    cached_result,
                    extracted_text
                )
            )

            cached_result[
                "formula_analysis"
            ] = analyze_formula(
                ingredient_names=(
                    cached_ingredient_names
                ),
                profile=profile,
                ingredients_map=ingredients_map
            )

            cached_marketing_claims = (
                get_marketing_claims(
                    payload.marketing_claims,
                    cached_result
                )
            )

            cached_result[
                "marketing_claims"
            ] = cached_marketing_claims

            cached_result[
                "marketing_analysis"
            ] = analyze_marketing_claims(
                ingredient_names=(
                    cached_ingredient_names
                ),
                ingredients_map=ingredients_map,
                claims=cached_marketing_claims
            )

            cached_result[
                "synergy_analysis"
            ] = analyze_synergies(
                ingredient_names=(
                    cached_ingredient_names
                ),
                profile=profile,
                ingredients_map=ingredients_map
            )

            await db.product_analyses.insert_one(
                cached_result
            )

            cached_result.pop("_id", None)

            await db.product_analysis_usage.insert_one({
                "usage_id": (
                    f"usage_{uuid.uuid4().hex[:12]}"
                ),
                "user_id": user["user_id"],
                "created_at_day": (
                    now_utc().date().isoformat()
                ),
                "created_at": now_utc()
            })
            cached_result["access"] = {
                "plan": analysis_access.get(
                    "plan",
                    "free",
                ),
                "limit": analysis_access.get(
                    "limit"
                ),
                "used_before_analysis": (
                    analysis_access.get("used", 0)
                ),
                "remaining_after_analysis": (
                    max(
                        0,
                        (
                            analysis_access.get(
                                "remaining",
                                1,
                            )
                            or 1
                        ) - 1,
                    )
                    if analysis_access.get(
                        "remaining"
                    ) is not None
                    else None
                ),
            }
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
    formula_analysis = analyze_formula(
        ingredient_names=ingredient_source,
        profile=profile,
        ingredients_map=ingredients_map
    )
    marketing_claims = get_marketing_claims(
        payload.marketing_claims,
        data
    )

    marketing_analysis = (
        analyze_marketing_claims(
            ingredient_names=ingredient_source,
            ingredients_map=ingredients_map,
            claims=marketing_claims
        )
    )
    synergy_analysis = analyze_synergies(
        ingredient_names=ingredient_source,
        profile=profile,
        ingredients_map=ingredients_map
    )

    matched_ingredients = []
    avoid_ingredients = []

    for ingredient in ingredient_source:
        ingredient_name = normalize_ingredient_name(
            ingredient
        )

        preference_score = ingredient_preferences.get(
            ingredient_name,
            0
        )

        if preference_score >= 2:
            matched_ingredients.append(
                ingredient_name
            )

        elif preference_score <= -2:
            avoid_ingredients.append(
                ingredient_name
            )

    confidence = min(
        100,
        50 +
        (len(matched_ingredients) * 15) -
        (len(avoid_ingredients) * 10)
    )

    personalized_recommendation = {
        "matched_ingredients": matched_ingredients[:5],
        "avoid_ingredients": avoid_ingredients[:5],
        "confidence": confidence
    }

    data["ingredient_analysis"] = ingredient_analysis
    if ingredient_analysis.get("ingredient_score") is not None:
        data["score"] = ingredient_analysis["ingredient_score"]

    formula_positioning = analyze_formula_positioning(
        extracted_text.split(","),
        ingredients_map
    )
    data["formula_analysis"] = formula_analysis
    data["marketing_claims"] = (
        marketing_claims
    )

    data["marketing_analysis"] = (
        marketing_analysis
    )
    data["synergy_analysis"] = (
        synergy_analysis
    )
    data["formula_positioning"] = formula_positioning
    conflict_analysis = analyze_ingredient_conflicts(ingredient_source)

    data["conflict_analysis"] = conflict_analysis

    if conflict_analysis.get("conflict_penalty"):
        data["score"] = max(
            0,
            data.get("score", 50) - conflict_analysis["conflict_penalty"]
        )

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

        bonus = 0

        for ingredient in product.get("ingredients", []):
            ingredient_name = normalize_ingredient_name(
                ingredient
            )

            bonus += ingredient_preferences.get(
                ingredient_name,
                0
            )

        product["match_score"] = match_score + bonus
        recommended_products.append(product)

    recommended_products.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    data["recommended_products"] = recommended_products[:5]
    data["personalized_recommendation"] = (
        personalized_recommendation
    )

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
        "score_explanation": data.get("score_explanation"),
        "barrier_risk": data.get("barrier_risk"),
        "profile_match": data.get("profile_match"),
        "ingredient_analysis": data.get("ingredient_analysis"),
        "formula_analysis":
            data.get("formula_analysis"),
        "marketing_claims":
            data.get(
                "marketing_claims",
                []
            ),

        "marketing_analysis":
            data.get(
                "marketing_analysis"
            ),
        "synergy_analysis":
            data.get(
                "synergy_analysis"
            ),
        "formula_positioning": data.get("formula_positioning"),
        "conflict_analysis": data.get("conflict_analysis"),
        "recommended_products": data.get("recommended_products", []),
        "personalized_recommendation":
            data.get("personalized_recommendation"),
        "created_at": now_utc(),
        "created_at_day": now_utc().date().isoformat(),
        
        
    }

    if cache_key and extracted_text:
        cache_result = dict(
            analysis_doc
        )

        cache_result.pop(
            "formula_analysis",
            None
        )
        cache_result.pop(
            "marketing_analysis",
            None
        )

        cache_result.pop(
            "marketing_claims",
            None
        )
        cache_result.pop(
            "synergy_analysis",
            None
        )
        cache_doc = {
            "cache_key": cache_key,
            "ingredients_text":
                extracted_text,
            "product_name":
                analysis_doc.get(
                    "product_name"
                ),
            "result": cache_result,
            "created_at": now_utc(),
        }

        await db.product_analysis_cache.update_one(
            {"cache_key": cache_key},
            {"$set": cache_doc},
            upsert=True
        )

    await db.product_analyses.insert_one(analysis_doc)

    await db.product_analysis_usage.insert_one({
        "usage_id": f"usage_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "created_at_day": now_utc().date().isoformat(),
        "created_at": now_utc()
    })

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

class ProductFeedbackRequest(BaseModel):
    analysis_id: str
    useful: Optional[bool] = None
    irritation: Optional[bool] = None
    already_used: Optional[bool] = None

class ProductFavoriteRequest(BaseModel):
    analysis_id: str
    favorite: bool

@api_router.post("/products/feedback")
async def product_feedback(
    payload: ProductFeedbackRequest,
    user=Depends(get_current_user)
):
    update_data = {}

    if payload.useful is not None:
        update_data["feedback.useful"] = payload.useful

    if payload.irritation is not None:
        update_data["feedback.irritation"] = payload.irritation

    if payload.already_used is not None:
        update_data["feedback.already_used"] = payload.already_used

    await db.product_analyses.update_one(
        {
            "analysis_id": payload.analysis_id,
            "user_id": user["user_id"]
        },
        {
            "$set": update_data
        }
    )

    return {
    "success": True
    }


@api_router.post("/products/favorite")
async def product_favorite(
    payload: ProductFavoriteRequest,
    user=Depends(get_current_user)
):
    result = await db.product_analyses.update_one(
        {
            "analysis_id": payload.analysis_id,
            "user_id": user["user_id"]
        },
        {
            "$set": {
                "favorite": payload.favorite
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Analyse introuvable")

    return {
        "success": True,
        "favorite": payload.favorite
    }
@api_router.post("/product-feedback")
async def create_product_feedback(
    payload: ProductOutcomeFeedbackRequest,
    user=Depends(get_current_user)
):
    feedback = {
        "feedback_id": f"pf_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "analysis_id": payload.analysis_id,
        "product_name": payload.product_name,
        "overall_result": payload.overall_result,
        "hydration_delta": payload.hydration_delta,
        "glow_delta": payload.glow_delta,
        "irritation_delta": payload.irritation_delta,
        "breakouts_delta": payload.breakouts_delta,
        "created_at": now_utc(),
    }

    await db.product_feedback.insert_one(feedback)

    return {
        "success": True,
        "feedback_id": feedback["feedback_id"]
    }


@api_router.get("/product-feedback/pending")
async def pending_feedback(
    user=Depends(get_current_user)
):

    seven_days_ago = now_utc() - timedelta(days=7)

    cursor = db.skin_tracking.find(
        {
            "user_id": user["user_id"],
            "created_at": {
                "$lte": seven_days_ago
            },
            "linked_products.0": {
                "$exists": True
            }
        },
        {
            "_id": 0,
            "tracking_id": 1,
            "linked_products": 1,
            "created_at": 1
        }
    )

    trackings = await cursor.to_list(length=100)

    pending = []

    for tracking in trackings:

        for product in tracking.get(
            "linked_products",
            []
        ):
            if isinstance(product, str):
                product_doc = await db.product_analyses.find_one(
                    {
                        "user_id": user["user_id"],
                        "analysis_id": product
                    },
                    {
                        "_id": 0,
                        "analysis_id": 1,
                        "product_name": 1
                    }
                )

                if not product_doc:
                    continue

                analysis_id = product_doc["analysis_id"]
                product_name = (
                    product_doc.get("product_name")
                    or "Produit analysé"
                )

            elif isinstance(product, dict):
                analysis_id = product.get("analysis_id")
                product_name = (
                    product.get("product_name")
                    or "Produit analysé"
                )

                if not analysis_id:
                    continue

            else:
                continue

            existing = await db.product_feedback.find_one({
                "user_id": user["user_id"],
                "analysis_id": analysis_id
            })

            if existing:
                continue

            days_used = (
                now_utc() -
                tracking["created_at"]
            ).days

            pending.append({
                "tracking_id": tracking["tracking_id"],
                "analysis_id": analysis_id,
                "product_name": product_name,
                "days_used": days_used
            })

    return pending 
@api_router.get("/oasis-learnings")
async def oasis_learnings(
    user=Depends(get_current_user)
):
    return await compute_user_learnings(
        db=db,
        user_id=user["user_id"]
    )
    
    
@api_router.post("/skin/tracking")
async def add_skin_tracking(
    payload: SkinTrackingRequest,
    user=Depends(get_current_user)
):
    linked_products = []

    if payload.linked_products:
        cursor = db.product_analyses.find(
            {
                "user_id": user["user_id"],
                "analysis_id": {
                    "$in": payload.linked_products
                }
            },
            {
                "_id": 0,
                "analysis_id": 1,
                "product_name": 1,
                "product_category": 1,
                "score": 1
            }
        )

        products = await cursor.to_list(
            length=len(payload.linked_products)
        )

        products_by_id = {
            product["analysis_id"]: product
            for product in products
            if product.get("analysis_id")
        }

        for analysis_id in payload.linked_products:
            product = products_by_id.get(analysis_id)

            if not product:
                continue

            linked_products.append({
                "analysis_id": product["analysis_id"],
                "product_name": (
                    product.get("product_name")
                    or "Produit analysé"
                ),
                "product_category": (
                    product.get("product_category")
                    or "skincare"
                ),
                "score": product.get("score")
            })

    tracking = {
        "tracking_id": f"st_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],

        "hydration": payload.hydration,
        "glow": payload.glow,
        "texture": payload.texture,
        "irritation": payload.irritation,
        "breakouts": payload.breakouts,
        "redness": payload.redness,

        "note": payload.note or "",
        "image_base64": payload.image_base64 or "",

        "created_at": now_utc(),
        "linked_products": linked_products,
    }

    await db.skin_tracking.insert_one(tracking)

    tracking.pop("_id", None)

    return tracking


@api_router.get("/skin/tracking")
async def get_skin_tracking(user=Depends(get_current_user)):
    cursor = db.skin_tracking.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(30)

    items = await cursor.to_list(length=30)

    return items
    
@api_router.get("/products/recent")
async def recent_products(user=Depends(get_current_user)):

    cursor = db.product_analyses.find(
        {"user_id": user["user_id"]},
        {
            "_id": 0,
            "analysis_id": 1,
            "product_name": 1
        }
    ).sort("created_at", -1).limit(10)

    return await cursor.to_list(length=10)

@api_router.delete("/skin/tracking/{tracking_id}")
async def delete_skin_tracking(
    tracking_id: str,
    user=Depends(get_current_user)
):
    result = await db.skin_tracking.delete_one({
        "tracking_id": tracking_id,
        "user_id": user["user_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Suivi introuvable")

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

    existing = await db.users.find_one({
        "email": demo_email
    })

    if not existing:
        await db.users.insert_one({
            "user_id": (
                f"user_{uuid.uuid4().hex[:12]}"
            ),
            "email": demo_email,
            "name": "Sophie Demo",
            "password_hash": hash_password(
                "Demo1234!"
            ),
            "picture": None,
            "skin_profile": None,
            "subscription": (
                default_subscription()
            ),
            "created_at": now_utc(),
        })

        logger.info(
            "Demo user seeded: "
            "demo@skincare.app / Demo1234!"
        )


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
