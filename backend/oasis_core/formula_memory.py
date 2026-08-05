from typing import Any, Dict, List, Optional


POSITIVE_RESULTS = {
    "positive",
    "positif",
    "good",
    "excellent",
    "improved",
    "improving",
    "better",
    "efficace",
}

NEGATIVE_RESULTS = {
    "negative",
    "négatif",
    "negatif",
    "bad",
    "worse",
    "worsening",
    "irritating",
    "irritation",
    "mauvais",
}


def _safe_number(
    value: Any,
    default: float = 0,
) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_result(value: Any) -> str:
    return str(value or "").strip().lower()


def _classify_feedback(
    feedback: Dict[str, Any],
) -> Optional[str]:
    """
    Retourne :
    - positive
    - negative
    - None si le retour n'est pas exploitable
    """

    if feedback.get("irritation") is True:
        return "negative"

    result = _normalize_result(
        feedback.get("overall_result")
    )

    if result in POSITIVE_RESULTS:
        return "positive"

    if result in NEGATIVE_RESULTS:
        return "negative"

    return None


def _average(
    values: List[float],
) -> Optional[float]:
    if not values:
        return None

    return round(
        sum(values) / len(values),
        1,
    )


def _most_common(
    values: List[str],
) -> Optional[str]:
    if not values:
        return None

    counts: Dict[str, int] = {}

    for value in values:
        normalized = str(value or "").strip()

        if not normalized:
            continue

        counts[normalized] = (
            counts.get(normalized, 0) + 1
        )

    if not counts:
        return None

    return max(
        counts,
        key=counts.get,
    )


async def compute_formula_memory(
    db,
    user_id: str,
) -> Dict[str, Any]:
    """
    Analyse les formules liées aux retours utilisateur.

    Cette mémoire ne juge pas une formule isolée.
    Elle cherche les caractéristiques des produits
    associés aux bons et mauvais résultats.
    """

    feedbacks = await db.product_feedback.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "analysis_id": 1,
            "overall_result": 1,
            "irritation": 1,
            "useful": 1,
        },
    ).to_list(length=200)

    usable_feedbacks = [
        feedback
        for feedback in feedbacks
        if feedback.get("analysis_id")
        and _classify_feedback(feedback)
    ]

    if not usable_feedbacks:
        return {
            "status": "insufficient_data",
            "total_feedbacks": len(feedbacks),
            "usable_feedbacks": 0,
            "confidence": 0,
            "positive_formula_profile": None,
            "negative_formula_profile": None,
            "preferred_active_load": None,
            "observed_synergies": [],
            "observed_conflicts": [],
        }

    analysis_ids = list({
        feedback["analysis_id"]
        for feedback in usable_feedbacks
    })

    analyses = await db.product_analyses.find(
        {
            "user_id": user_id,
            "analysis_id": {
                "$in": analysis_ids,
            },
        },
        {
            "_id": 0,
            "analysis_id": 1,
            "product_name": 1,
            "formula_analysis": 1,
            "synergy_analysis": 1,
        },
    ).to_list(length=200)

    analyses_by_id = {
        analysis["analysis_id"]: analysis
        for analysis in analyses
        if analysis.get("analysis_id")
    }

    positive_records: List[Dict[str, Any]] = []
    negative_records: List[Dict[str, Any]] = []

    synergy_counts: Dict[str, int] = {}
    conflict_counts: Dict[str, int] = {}

    for feedback in usable_feedbacks:
        analysis = analyses_by_id.get(
            feedback["analysis_id"]
        )

        if not analysis:
            continue

        formula = (
            analysis.get("formula_analysis")
            or {}
        )

        synergy = (
            analysis.get("synergy_analysis")
            or {}
        )

        if not formula and not synergy:
            continue

        record = {
            "analysis_id": analysis.get(
                "analysis_id"
            ),
            "product_name": analysis.get(
                "product_name"
            ),
            "hydration_score": _safe_number(
                formula.get("hydration_score")
            ),
            "barrier_support": _safe_number(
                formula.get("barrier_support")
            ),
            "irritation_risk": _safe_number(
                formula.get("irritation_risk")
            ),
            "active_balance_score": (
                _safe_number(
                    formula.get(
                        "active_balance_score"
                    )
                )
            ),
            "active_position_quality": (
                _safe_number(
                    formula.get(
                        "active_position_quality"
                    )
                )
            ),
            "active_load": (
                synergy.get("active_load", {})
                .get("level")
            ),
            "synergy_balance_score": (
                _safe_number(
                    synergy.get("balance_score")
                )
            ),
            "cumulative_irritation_risk": (
                _safe_number(
                    synergy.get(
                        "cumulative_irritation_risk"
                    )
                )
            ),
        }

        feedback_type = _classify_feedback(
            feedback
        )

        if feedback_type == "positive":
            positive_records.append(record)

            for item in synergy.get(
                "synergies",
                [],
            ):
                message = str(
                    item.get("message") or ""
                ).strip()

                if message:
                    synergy_counts[message] = (
                        synergy_counts.get(
                            message,
                            0,
                        )
                        + 1
                    )

        elif feedback_type == "negative":
            negative_records.append(record)

            for item in synergy.get(
                "conflicts",
                [],
            ):
                message = str(
                    item.get("message") or ""
                ).strip()

                if message:
                    conflict_counts[message] = (
                        conflict_counts.get(
                            message,
                            0,
                        )
                        + 1
                    )

    def build_profile(
        records: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        if not records:
            return None

        return {
            "sample_size": len(records),
            "average_hydration_score": _average([
                record["hydration_score"]
                for record in records
            ]),
            "average_barrier_support": _average([
                record["barrier_support"]
                for record in records
            ]),
            "average_irritation_risk": _average([
                record["irritation_risk"]
                for record in records
            ]),
            "average_active_balance_score": (
                _average([
                    record[
                        "active_balance_score"
                    ]
                    for record in records
                ])
            ),
            "average_active_position_quality": (
                _average([
                    record[
                        "active_position_quality"
                    ]
                    for record in records
                ])
            ),
            "average_synergy_balance_score": (
                _average([
                    record[
                        "synergy_balance_score"
                    ]
                    for record in records
                ])
            ),
            "average_cumulative_irritation_risk": (
                _average([
                    record[
                        "cumulative_irritation_risk"
                    ]
                    for record in records
                ])
            ),
            "most_common_active_load": _most_common([
                record["active_load"]
                for record in records
                if record.get("active_load")
            ]),
            "products": [
                {
                    "analysis_id": record[
                        "analysis_id"
                    ],
                    "product_name": record[
                        "product_name"
                    ],
                }
                for record in records[:5]
            ],
        }

    positive_profile = build_profile(
        positive_records
    )

    negative_profile = build_profile(
        negative_records
    )

    preferred_active_load = None

    if positive_profile:
        preferred_active_load = (
            positive_profile.get(
                "most_common_active_load"
            )
        )

    matched_records = (
        len(positive_records)
        + len(negative_records)
    )

    confidence = min(
        100,
        round(matched_records * 15),
    )

    observed_synergies = sorted(
        [
            {
                "message": message,
                "occurrences": count,
            }
            for message, count
            in synergy_counts.items()
        ],
        key=lambda item: item["occurrences"],
        reverse=True,
    )[:5]

    observed_conflicts = sorted(
        [
            {
                "message": message,
                "occurrences": count,
            }
            for message, count
            in conflict_counts.items()
        ],
        key=lambda item: item["occurrences"],
        reverse=True,
    )[:5]

    return {
        "status": (
            "learning"
            if matched_records < 5
            else "established"
        ),
        "total_feedbacks": len(feedbacks),
        "usable_feedbacks": matched_records,
        "positive_formula_count": len(
            positive_records
        ),
        "negative_formula_count": len(
            negative_records
        ),
        "confidence": confidence,
        "positive_formula_profile": (
            positive_profile
        ),
        "negative_formula_profile": (
            negative_profile
        ),
        "preferred_active_load": (
            preferred_active_load
        ),
        "observed_synergies": (
            observed_synergies
        ),
        "observed_conflicts": (
            observed_conflicts
        ),
    }