from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


def _safe_date(value: Any) -> Optional[date]:
    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    try:
        return datetime.fromisoformat(
            str(value)
        ).date()
    except (TypeError, ValueError):
        return None


def _average(
    values: List[float],
) -> float:
    if not values:
        return 0

    return round(
        sum(values) / len(values),
        1,
    )


def _routine_label(
    routine_type: str,
) -> str:
    labels = {
        "matin": "Routine du matin",
        "soir": "Routine du soir",
        "hebdo": "Routine hebdomadaire",
    }

    return labels.get(
        routine_type,
        routine_type.capitalize(),
    )


async def compute_routine_memory(
    db,
    user_id: str,
) -> Dict[str, Any]:
    """
    Analyse la régularité d'utilisation des routines.

    Cette première version utilise :
    - les routines actuellement enregistrées ;
    - les validations quotidiennes de db.tracking ;
    - les étapes matin et soir.

    La routine hebdomadaire est conservée dans le
    résumé mais n'entre pas dans le score quotidien,
    car sa fréquence attendue n'est pas enregistrée.
    """

    routines = await db.routines.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "routine_id": 1,
            "type": 1,
            "title": 1,
            "steps": 1,
            "created_at": 1,
        },
    ).to_list(length=10)

    tracking_docs = await db.tracking.find(
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
    ).limit(90).to_list(length=90)

    routines_by_type = {
        routine.get("type"): routine
        for routine in routines
        if routine.get("type")
    }

    expected_keys_by_type: Dict[
        str,
        List[str]
    ] = {}

    step_metadata: Dict[
        str,
        Dict[str, Any]
    ] = {}

    for routine_type in [
        "matin",
        "soir",
    ]:
        routine = routines_by_type.get(
            routine_type,
            {},
        )

        keys: List[str] = []

        for step in routine.get(
            "steps",
            [],
        ):
            order = step.get("order")

            if order is None:
                continue

            key = f"{routine_type}_{order}"
            keys.append(key)

            step_metadata[key] = {
                "routine_type": routine_type,
                "order": order,
                "name": (
                    step.get("name")
                    or f"Étape {order}"
                ),
                "product_type": (
                    step.get("product_type")
                    or ""
                ),
            }

        expected_keys_by_type[
            routine_type
        ] = keys

    expected_daily_keys = (
        expected_keys_by_type.get(
            "matin",
            [],
        )
        + expected_keys_by_type.get(
            "soir",
            [],
        )
    )

    if not routines:
        return {
            "status": "no_routine",
            "confidence": 0,
            "tracked_days": 0,
            "active_days": 0,
            "current_streak": 0,
            "overall_adherence": 0,
            "routine_adherence": {},
            "step_performance": [],
            "best_patterns": [],
            "recommendations": [
                "Créez une routine pour commencer l’apprentissage."
            ],
        }

    valid_tracking_docs = []

    for document in tracking_docs:
        tracking_date = _safe_date(
            document.get("date")
        )

        if not tracking_date:
            continue

        valid_tracking_docs.append({
            **document,
            "_parsed_date": tracking_date,
        })

    valid_tracking_docs.sort(
        key=lambda item: item["_parsed_date"],
        reverse=True,
    )

    step_completed_counts = {
        key: 0
        for key in expected_daily_keys
    }

    step_opportunity_counts = {
        key: 0
        for key in expected_daily_keys
    }

    type_daily_percentages: Dict[
        str,
        List[float]
    ] = {
        "matin": [],
        "soir": [],
    }

    daily_percentages: List[float] = []
    daily_records: List[Dict[str, Any]] = []

    active_days = 0
    perfect_days = 0

    for document in valid_tracking_docs:
        completed = (
            document.get("completed")
            or {}
        )

        completed_count = 0

        for key in expected_daily_keys:
            step_opportunity_counts[key] += 1

            if completed.get(key) is True:
                step_completed_counts[key] += 1
                completed_count += 1

        expected_count = len(
            expected_daily_keys
        )

        daily_percentage = (
            round(
                completed_count
                / expected_count
                * 100,
                1,
            )
            if expected_count
            else 0
        )

        daily_percentages.append(
            daily_percentage
        )

        if completed_count > 0:
            active_days += 1

        if (
            expected_count > 0
            and completed_count
            == expected_count
        ):
            perfect_days += 1

        for routine_type in [
            "matin",
            "soir",
        ]:
            type_keys = (
                expected_keys_by_type.get(
                    routine_type,
                    [],
                )
            )

            if not type_keys:
                continue

            type_completed = sum(
                1
                for key in type_keys
                if completed.get(key) is True
            )

            type_percentage = round(
                type_completed
                / len(type_keys)
                * 100,
                1,
            )

            type_daily_percentages[
                routine_type
            ].append(type_percentage)

        daily_records.append({
            "date": document[
                "_parsed_date"
            ].isoformat(),
            "completed_steps": (
                completed_count
            ),
            "expected_steps": (
                expected_count
            ),
            "adherence": daily_percentage,
        })

    routine_adherence = {}

    for routine_type in [
        "matin",
        "soir",
    ]:
        values = type_daily_percentages.get(
            routine_type,
            [],
        )

        routine_adherence[
            routine_type
        ] = {
            "label": _routine_label(
                routine_type
            ),
            "step_count": len(
                expected_keys_by_type.get(
                    routine_type,
                    [],
                )
            ),
            "adherence": _average(values),
        }

    step_performance = []

    for key in expected_daily_keys:
        opportunities = (
            step_opportunity_counts[key]
        )

        completed_count = (
            step_completed_counts[key]
        )

        completion_rate = (
            round(
                completed_count
                / opportunities
                * 100,
                1,
            )
            if opportunities
            else 0
        )

        metadata = step_metadata.get(
            key,
            {},
        )

        step_performance.append({
            "key": key,
            "routine_type": metadata.get(
                "routine_type"
            ),
            "order": metadata.get(
                "order"
            ),
            "name": metadata.get(
                "name",
                key,
            ),
            "product_type": metadata.get(
                "product_type",
                "",
            ),
            "completed_count": (
                completed_count
            ),
            "opportunities": opportunities,
            "completion_rate": (
                completion_rate
            ),
        })

    step_performance.sort(
        key=lambda item: (
            -item["completion_rate"],
            item.get("order") or 0,
        )
    )

    today = date.today()
    tracked_dates = {
        item["_parsed_date"]
        for item in valid_tracking_docs
        if any(
            (
                item.get("completed")
                or {}
            ).values()
        )
    }

    current_streak = 0
    cursor_date = today

    while cursor_date in tracked_dates:
        current_streak += 1
        cursor_date -= timedelta(days=1)

    recent_records = [
        item
        for item in daily_records
        if (
            today
            - datetime.fromisoformat(
                item["date"]
            ).date()
        ).days
        <= 6
    ]

    previous_records = [
        item
        for item in daily_records
        if 7
        <= (
            today
            - datetime.fromisoformat(
                item["date"]
            ).date()
        ).days
        <= 13
    ]

    recent_adherence = _average([
        item["adherence"]
        for item in recent_records
    ])

    previous_adherence = _average([
        item["adherence"]
        for item in previous_records
    ])

    adherence_trend = "insufficient_data"

    if recent_records and previous_records:
        difference = (
            recent_adherence
            - previous_adherence
        )

        if difference >= 10:
            adherence_trend = "improving"

        elif difference <= -10:
            adherence_trend = "declining"

        else:
            adherence_trend = "stable"

    overall_adherence = _average(
        daily_percentages
    )

    tracked_days = len(
        valid_tracking_docs
    )

    confidence = min(
        100,
        tracked_days * 8,
    )

    best_patterns = []

    available_routine_scores = [
        {
            "type": routine_type,
            **values,
        }
        for routine_type, values
        in routine_adherence.items()
        if values.get("step_count", 0) > 0
    ]

    if available_routine_scores:
        best_routine = max(
            available_routine_scores,
            key=lambda item: item[
                "adherence"
            ],
        )

        if best_routine["adherence"] > 0:
            best_patterns.append({
                "type": "best_routine_period",
                "severity": "positive",
                "confidence": confidence,
                "message": (
                    f"{best_routine['label']} "
                    "est actuellement la plus régulière."
                ),
                "details": {
                    "routine_type": (
                        best_routine["type"]
                    ),
                    "adherence": (
                        best_routine[
                            "adherence"
                        ]
                    ),
                },
            })

    if current_streak >= 3:
        best_patterns.append({
            "type": "routine_streak",
            "severity": "positive",
            "confidence": min(
                100,
                current_streak * 12,
            ),
            "message": (
                f"Votre routine est suivie depuis "
                f"{current_streak} jours consécutifs."
            ),
            "details": {
                "streak": current_streak,
            },
        })

    if adherence_trend == "improving":
        best_patterns.append({
            "type": "routine_consistency_improving",
            "severity": "positive",
            "confidence": confidence,
            "message": (
                "Votre régularité progresse "
                "par rapport à la semaine précédente."
            ),
            "details": {
                "recent_adherence": (
                    recent_adherence
                ),
                "previous_adherence": (
                    previous_adherence
                ),
            },
        })

    elif adherence_trend == "declining":
        best_patterns.append({
            "type": "routine_consistency_declining",
            "severity": "warning",
            "confidence": confidence,
            "message": (
                "Votre régularité a diminué "
                "par rapport à la semaine précédente."
            ),
            "details": {
                "recent_adherence": (
                    recent_adherence
                ),
                "previous_adherence": (
                    previous_adherence
                ),
            },
        })

    recommendations = []

    if tracked_days == 0:
        recommendations.append(
            "Cochez vos étapes quotidiennes pour permettre à OASIS d’apprendre votre régularité."
        )

    if overall_adherence < 40 and tracked_days >= 3:
        recommendations.append(
            "Une routine plus courte pourrait être plus simple à maintenir régulièrement."
        )

    weakest_steps = sorted(
        step_performance,
        key=lambda item: (
            item["completion_rate"],
            item.get("order") or 0,
        ),
    )

    if weakest_steps and tracked_days >= 3:
        weakest = weakest_steps[0]

        if weakest["completion_rate"] < 50:
            recommendations.append(
                f"L’étape « {weakest['name']} » est la moins suivie actuellement."
            )

    status = "learning"

    if tracked_days == 0:
        status = "insufficient_data"

    elif tracked_days >= 14:
        status = "established"

    return {
        "status": status,
        "confidence": confidence,
        "tracked_days": tracked_days,
        "active_days": active_days,
        "perfect_days": perfect_days,
        "current_streak": current_streak,
        "overall_adherence": (
            overall_adherence
        ),
        "recent_adherence": (
            recent_adherence
        ),
        "previous_adherence": (
            previous_adherence
        ),
        "adherence_trend": (
            adherence_trend
        ),
        "routine_adherence": (
            routine_adherence
        ),
        "step_performance": (
            step_performance
        ),
        "best_patterns": (
            best_patterns[:5]
        ),
        "recommendations": (
            recommendations[:3]
        ),
        "daily_history": (
            daily_records[:30]
        ),
    }