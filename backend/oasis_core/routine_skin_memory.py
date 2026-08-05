from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


POSITIVE_METRICS = [
    "hydration",
    "glow",
    "texture",
]

NEGATIVE_METRICS = [
    "irritation",
    "breakouts",
    "redness",
]


def _safe_date(value: Any) -> Optional[date]:
    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    try:
        return datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        ).date()
    except (TypeError, ValueError):
        return None


def _safe_number(
    value: Any,
    default: float = 0,
) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _average(
    values: List[float],
) -> Optional[float]:
    if not values:
        return None

    return round(
        sum(values) / len(values),
        1,
    )


def _build_expected_keys(
    routines: List[Dict[str, Any]],
) -> List[str]:
    expected_keys: List[str] = []

    for routine in routines:
        routine_type = routine.get("type")

        if routine_type not in {
            "matin",
            "soir",
        }:
            continue

        for step in routine.get("steps", []):
            order = step.get("order")

            if order is None:
                continue

            expected_keys.append(
                f"{routine_type}_{order}"
            )

    return expected_keys


def _compute_daily_adherence(
    tracking_documents: List[Dict[str, Any]],
    expected_keys: List[str],
) -> Dict[date, float]:
    adherence_by_date: Dict[date, float] = {}

    if not expected_keys:
        return adherence_by_date

    for document in tracking_documents:
        tracking_date = _safe_date(
            document.get("date")
        )

        if not tracking_date:
            continue

        completed = (
            document.get("completed")
            or {}
        )

        completed_count = sum(
            1
            for key in expected_keys
            if completed.get(key) is True
        )

        adherence_by_date[tracking_date] = round(
            completed_count
            / len(expected_keys)
            * 100,
            1,
        )

    return adherence_by_date


def _average_previous_adherence(
    entry_date: date,
    adherence_by_date: Dict[date, float],
    days: int = 3,
) -> Optional[float]:
    values: List[float] = []

    for offset in range(days):
        target_date = (
            entry_date
            - timedelta(days=offset)
        )

        if target_date in adherence_by_date:
            values.append(
                adherence_by_date[target_date]
            )

    return _average(values)


def _build_skin_profile(
    records: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    if not records:
        return None

    profile: Dict[str, Any] = {
        "sample_size": len(records),
    }

    for metric in (
        POSITIVE_METRICS
        + NEGATIVE_METRICS
    ):
        values = [
            _safe_number(record.get(metric))
            for record in records
            if record.get(metric) is not None
        ]

        profile[metric] = _average(values)

    return profile


def _metric_difference(
    high_profile: Dict[str, Any],
    low_profile: Dict[str, Any],
    metric: str,
    reverse: bool = False,
) -> Optional[float]:
    high_value = high_profile.get(metric)
    low_value = low_profile.get(metric)

    if (
        high_value is None
        or low_value is None
    ):
        return None

    difference = (
        low_value - high_value
        if reverse
        else high_value - low_value
    )

    return round(difference, 1)


async def compute_routine_skin_memory(
    db,
    user_id: str,
) -> Dict[str, Any]:
    """
    Cherche une association statistique entre :

    - la régularité des routines matin/soir ;
    - les métriques saisies dans le Journal.

    Il ne s'agit pas d'une preuve de causalité.
    """

    routines = await db.routines.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "type": 1,
            "steps": 1,
        },
    ).to_list(length=10)

    expected_keys = _build_expected_keys(
        routines
    )

    if not expected_keys:
        return {
            "status": "no_routine",
            "confidence": 0,
            "matched_entries": 0,
            "high_adherence_profile": None,
            "low_adherence_profile": None,
            "observed_effects": [],
            "summary": (
                "Aucune routine exploitable."
            ),
        }

    tracking_documents = await db.tracking.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "date": 1,
            "completed": 1,
        },
    ).sort(
        "date",
        -1,
    ).limit(120).to_list(length=120)

    adherence_by_date = (
        _compute_daily_adherence(
            tracking_documents,
            expected_keys,
        )
    )

    skin_entries = await db.skin_tracking.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "created_at": 1,
            "hydration": 1,
            "glow": 1,
            "texture": 1,
            "irritation": 1,
            "breakouts": 1,
            "redness": 1,
        },
    ).sort(
        "created_at",
        -1,
    ).limit(100).to_list(length=100)

    matched_records: List[
        Dict[str, Any]
    ] = []

    for entry in skin_entries:
        entry_date = _safe_date(
            entry.get("created_at")
        )

        if not entry_date:
            continue

        recent_adherence = (
            _average_previous_adherence(
                entry_date,
                adherence_by_date,
                days=3,
            )
        )

        if recent_adherence is None:
            continue

        matched_records.append({
            **entry,
            "routine_adherence": (
                recent_adherence
            ),
        })

    high_adherence_records = [
        record
        for record in matched_records
        if record["routine_adherence"] >= 70
    ]

    low_adherence_records = [
        record
        for record in matched_records
        if record["routine_adherence"] <= 40
    ]

    high_profile = _build_skin_profile(
        high_adherence_records
    )

    low_profile = _build_skin_profile(
        low_adherence_records
    )

    observed_effects: List[
        Dict[str, Any]
    ] = []

    if high_profile and low_profile:
        for metric in POSITIVE_METRICS:
            difference = _metric_difference(
                high_profile,
                low_profile,
                metric,
            )

            if (
                difference is not None
                and difference >= 0.8
            ):
                observed_effects.append({
                    "metric": metric,
                    "direction": "improving",
                    "difference": difference,
                    "message": (
                        f"{metric.capitalize()} "
                        f"est en moyenne supérieure "
                        f"de {difference} point(s) "
                        "pendant les périodes les "
                        "plus régulières."
                    ),
                })

        for metric in NEGATIVE_METRICS:
            difference = _metric_difference(
                high_profile,
                low_profile,
                metric,
                reverse=True,
            )

            if (
                difference is not None
                and difference >= 0.8
            ):
                observed_effects.append({
                    "metric": metric,
                    "direction": "decreasing",
                    "difference": difference,
                    "message": (
                        f"{metric.capitalize()} "
                        f"est en moyenne inférieur(e) "
                        f"de {difference} point(s) "
                        "pendant les périodes les "
                        "plus régulières."
                    ),
                })

    matched_count = len(matched_records)

    comparison_sample = min(
        len(high_adherence_records),
        len(low_adherence_records),
    )

    confidence = min(
        100,
        matched_count * 6
        + comparison_sample * 8,
    )

    if (
        len(high_adherence_records) < 2
        or len(low_adherence_records) < 2
    ):
        status = "insufficient_comparison"

    elif matched_count < 10:
        status = "learning"

    else:
        status = "established"

    if observed_effects:
        summary = (
            "Une association commence à apparaître "
            "entre votre régularité et certains "
            "indicateurs de peau."
        )

    elif status == "insufficient_comparison":
        summary = (
            "OASIS a besoin de suivis réalisés "
            "pendant des périodes régulières et "
            "moins régulières pour comparer."
        )

    else:
        summary = (
            "Aucune différence nette n’est encore "
            "visible entre régularité et état de peau."
        )

    return {
        "status": status,
        "confidence": confidence,
        "matched_entries": matched_count,
        "high_adherence_entries": len(
            high_adherence_records
        ),
        "low_adherence_entries": len(
            low_adherence_records
        ),
        "high_adherence_profile": (
            high_profile
        ),
        "low_adherence_profile": (
            low_profile
        ),
        "observed_effects": (
            observed_effects[:6]
        ),
        "summary": summary,
        "disclaimer": (
            "Association statistique indicative : "
            "elle ne prouve pas que la routine est "
            "la cause directe des changements observés."
        ),
    }