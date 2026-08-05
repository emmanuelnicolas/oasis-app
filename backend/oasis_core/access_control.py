from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


FREE_PLAN = "free"
PREMIUM_PLAN = "premium"
FOUNDER_PLAN = "founder"

ACTIVE_STATUS = "active"
TRIALING_STATUS = "trialing"
EXPIRED_STATUS = "expired"
CANCELED_STATUS = "canceled"


PLAN_LIMITS: Dict[str, Dict[str, Any]] = {
    FREE_PLAN: {
        "product_analyses_per_day": 5,
        "selfie_analyses_per_month": 2,
        "coach_messages_per_day": 3,
        "journal_history_days": 30,
        "photo_comparisons_per_month": 2,

        "advanced_formula": False,
        "marketing_analysis": False,
        "synergy_analysis": False,
        "full_personalized_learning": False,
        "long_term_charts": False,
        "full_history": False,
        "advanced_photo_comparison": False,
        "smart_notifications": False,
        "report_export": False,
    },

    PREMIUM_PLAN: {
        "product_analyses_per_day": 50,
        "selfie_analyses_per_month": 20,
        "coach_messages_per_day": 30,
        "journal_history_days": None,
        "photo_comparisons_per_month": 30,

        "advanced_formula": True,
        "marketing_analysis": True,
        "synergy_analysis": True,
        "full_personalized_learning": True,
        "long_term_charts": True,
        "full_history": True,
        "advanced_photo_comparison": True,
        "smart_notifications": True,
        "report_export": True,
    },

    FOUNDER_PLAN: {
        "product_analyses_per_day": 50,
        "selfie_analyses_per_month": 20,
        "coach_messages_per_day": 30,
        "journal_history_days": None,
        "photo_comparisons_per_month": 30,

        "advanced_formula": True,
        "marketing_analysis": True,
        "synergy_analysis": True,
        "full_personalized_learning": True,
        "long_term_charts": True,
        "full_history": True,
        "advanced_photo_comparison": True,
        "smart_notifications": True,
        "report_export": True,
    },
}


@dataclass
class AccessDecision:
    allowed: bool
    feature: str
    plan: str
    reason: Optional[str] = None
    limit: Optional[int] = None
    used: Optional[int] = None
    remaining: Optional[int] = None
    upgrade_required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_datetime(
    value: Any,
) -> Optional[datetime]:
    if value is None:
        return None

    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(
                str(value).replace(
                    "Z",
                    "+00:00",
                )
            )
        except (TypeError, ValueError):
            return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(
            tzinfo=timezone.utc
        )

    return parsed.astimezone(timezone.utc)


def default_subscription() -> Dict[str, Any]:
    return {
        "plan": FREE_PLAN,
        "status": ACTIVE_STATUS,
        "started_at": None,
        "expires_at": None,
        "trial_ends_at": None,
        "provider": None,
        "provider_customer_id": None,
        "provider_subscription_id": None,
    }


def normalize_subscription(
    user: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    user = user or {}

    raw_subscription = (
        user.get("subscription")
        or {}
    )

    subscription = {
        **default_subscription(),
        **raw_subscription,
    }

    plan = str(
        subscription.get("plan")
        or FREE_PLAN
    ).lower()

    if plan not in PLAN_LIMITS:
        plan = FREE_PLAN

    status = str(
        subscription.get("status")
        or ACTIVE_STATUS
    ).lower()

    expires_at = _parse_datetime(
        subscription.get("expires_at")
    )

    trial_ends_at = _parse_datetime(
        subscription.get("trial_ends_at")
    )

    now = _utc_now()

    if (
        status == TRIALING_STATUS
        and trial_ends_at
        and trial_ends_at <= now
    ):
        plan = FREE_PLAN
        status = EXPIRED_STATUS

    elif (
        plan != FREE_PLAN
        and expires_at
        and expires_at <= now
    ):
        plan = FREE_PLAN
        status = EXPIRED_STATUS

    elif status in {
        EXPIRED_STATUS,
        CANCELED_STATUS,
    }:
        plan = FREE_PLAN

    subscription["plan"] = plan
    subscription["status"] = status

    return subscription


def get_user_plan(
    user: Optional[Dict[str, Any]],
) -> str:
    subscription = normalize_subscription(
        user
    )

    return subscription["plan"]


def get_plan_limits(
    user: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    plan = get_user_plan(user)

    return {
        **PLAN_LIMITS[plan],
    }


def has_feature(
    user: Optional[Dict[str, Any]],
    feature: str,
) -> bool:
    limits = get_plan_limits(user)

    return limits.get(feature) is True


def check_feature_access(
    user: Optional[Dict[str, Any]],
    feature: str,
) -> AccessDecision:
    plan = get_user_plan(user)
    limits = PLAN_LIMITS[plan]

    if feature not in limits:
        return AccessDecision(
            allowed=False,
            feature=feature,
            plan=plan,
            reason="unknown_feature",
            upgrade_required=False,
        )

    allowed = limits[feature] is True

    return AccessDecision(
        allowed=allowed,
        feature=feature,
        plan=plan,
        reason=(
            None
            if allowed
            else "premium_required"
        ),
        upgrade_required=not allowed,
    )


def check_usage_limit(
    user: Optional[Dict[str, Any]],
    limit_name: str,
    used: int,
) -> AccessDecision:
    plan = get_user_plan(user)
    limits = PLAN_LIMITS[plan]

    if limit_name not in limits:
        return AccessDecision(
            allowed=False,
            feature=limit_name,
            plan=plan,
            reason="unknown_limit",
            used=max(0, int(used or 0)),
        )

    raw_limit = limits[limit_name]

    safe_used = max(
        0,
        int(used or 0),
    )

    if raw_limit is None:
        return AccessDecision(
            allowed=True,
            feature=limit_name,
            plan=plan,
            used=safe_used,
            remaining=None,
        )

    limit = max(
        0,
        int(raw_limit),
    )

    remaining = max(
        0,
        limit - safe_used,
    )

    allowed = safe_used < limit

    return AccessDecision(
        allowed=allowed,
        feature=limit_name,
        plan=plan,
        reason=(
            None
            if allowed
            else "usage_limit_reached"
        ),
        limit=limit,
        used=safe_used,
        remaining=remaining,
        upgrade_required=(
            not allowed
            and plan == FREE_PLAN
        ),
    )


def build_access_summary(
    user: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    subscription = normalize_subscription(
        user
    )

    plan = subscription["plan"]
    limits = PLAN_LIMITS[plan]

    return {
        "subscription": subscription,
        "plan": plan,
        "is_premium": plan in {
            PREMIUM_PLAN,
            FOUNDER_PLAN,
        },
        "limits": {
            key: value
            for key, value in limits.items()
            if not isinstance(value, bool)
        },
        "features": {
            key: value
            for key, value in limits.items()
            if isinstance(value, bool)
        },
    }


def can_use_advanced_formula(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "advanced_formula",
    )


def can_use_marketing_analysis(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "marketing_analysis",
    )


def can_use_synergy_analysis(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "synergy_analysis",
    )


def can_view_full_learning(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "full_personalized_learning",
    )


def can_view_full_history(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "full_history",
    )


def can_export_report(
    user: Optional[Dict[str, Any]],
) -> AccessDecision:
    return check_feature_access(
        user,
        "report_export",
    )


def can_analyze_product(
    user: Optional[Dict[str, Any]],
    analyses_used_today: int,
) -> AccessDecision:
    return check_usage_limit(
        user,
        "product_analyses_per_day",
        analyses_used_today,
    )


def can_analyze_selfie(
    user: Optional[Dict[str, Any]],
    analyses_used_this_month: int,
) -> AccessDecision:
    return check_usage_limit(
        user,
        "selfie_analyses_per_month",
        analyses_used_this_month,
    )


def can_message_coach(
    user: Optional[Dict[str, Any]],
    messages_used_today: int,
) -> AccessDecision:
    return check_usage_limit(
        user,
        "coach_messages_per_day",
        messages_used_today,
    )


def can_compare_photos(
    user: Optional[Dict[str, Any]],
    comparisons_used_this_month: int,
) -> AccessDecision:
    return check_usage_limit(
        user,
        "photo_comparisons_per_month",
        comparisons_used_this_month,
    )