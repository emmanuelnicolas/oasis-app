from collections import Counter
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


def _metric_average(
    entries: List[Dict[str, Any]],
    key: str,
) -> Optional[float]:
    values = [
        _safe_number(entry.get(key))
        for entry in entries
        if entry.get(key) is not None
    ]

    return _average(values)


def _build_skin_profile(
    entries: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    if not entries:
        return None

    return {
        "sample_size": len(entries),
        "hydration": _metric_average(
            entries,
            "hydration",
        ),
        "glow": _metric_average(
            entries,
            "glow",
        ),
        "texture": _metric_average(
            entries,
            "texture",
        ),
        "irritation": _metric_average(
            entries,
            "irritation",
        ),
        "breakouts": _metric_average(
            entries,
            "breakouts",
        ),
        "redness": _metric_average(
            entries,
            "redness",
        ),
    }


async def detect_user_patterns(
    db,
    user_id: str,
) -> List[Dict[str, Any]]:
    patterns: List[Dict[str, Any]] = []

    tracking_entries = await db.skin_tracking.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "tracking_id": 1,
            "linked_products": 1,
            "hydration": 1,
            "glow": 1,
            "texture": 1,
            "irritation": 1,
            "breakouts": 1,
            "redness": 1,
            "created_at": 1,
        },
    ).sort(
        "created_at",
        -1,
    ).to_list(length=200)

    feedbacks = await db.product_feedback.find(
        {
            "user_id": user_id,
        },
        {
            "_id": 0,
            "analysis_id": 1,
            "overall_result": 1,
            "irritation": 1,
            "created_at": 1,
        },
    ).to_list(length=200)

    tracking_count = len(tracking_entries)
    feedback_count = len(feedbacks)

    if tracking_count < 2:
        patterns.append({
            "type": "insufficient_skin_tracking",
            "severity": "info",
            "confidence": 0,
            "message": (
                "Pas encore assez de suivis peau "
                "pour détecter une tendance fiable."
            ),
        })

    if feedback_count == 0:
        patterns.append({
            "type": "missing_product_feedback",
            "severity": "info",
            "confidence": 0,
            "message": (
                "Aucun retour produit n’a encore "
                "été donné."
            ),
        })

    # ---------- Évolution récente de la peau ----------

    if tracking_count >= 3:
        recent_entries = tracking_entries[:3]
        older_entries = tracking_entries[3:6]

        if older_entries:
            recent_profile = _build_skin_profile(
                recent_entries
            )

            older_profile = _build_skin_profile(
                older_entries
            )

            if recent_profile and older_profile:
                positive_change = 0
                negative_change = 0

                for metric in [
                    "hydration",
                    "glow",
                    "texture",
                ]:
                    recent_value = recent_profile.get(
                        metric
                    )

                    older_value = older_profile.get(
                        metric
                    )

                    if (
                        recent_value is None
                        or older_value is None
                    ):
                        continue

                    diff = recent_value - older_value

                    if diff >= 1:
                        positive_change += 1
                    elif diff <= -1:
                        negative_change += 1

                for metric in [
                    "irritation",
                    "breakouts",
                    "redness",
                ]:
                    recent_value = recent_profile.get(
                        metric
                    )

                    older_value = older_profile.get(
                        metric
                    )

                    if (
                        recent_value is None
                        or older_value is None
                    ):
                        continue

                    diff = recent_value - older_value

                    if diff <= -1:
                        positive_change += 1
                    elif diff >= 1:
                        negative_change += 1

                if positive_change >= 2:
                    patterns.append({
                        "type": "recent_skin_improvement",
                        "severity": "positive",
                        "confidence": min(
                            100,
                            tracking_count * 10,
                        ),
                        "message": (
                            "Plusieurs indicateurs de peau "
                            "s’améliorent sur vos suivis récents."
                        ),
                        "details": {
                            "improving_metrics": (
                                positive_change
                            ),
                            "recent_sample_size": len(
                                recent_entries
                            ),
                            "comparison_sample_size": len(
                                older_entries
                            ),
                        },
                    })

                elif negative_change >= 2:
                    patterns.append({
                        "type": "recent_skin_worsening",
                        "severity": "warning",
                        "confidence": min(
                            100,
                            tracking_count * 10,
                        ),
                        "message": (
                            "Plusieurs indicateurs de peau "
                            "se dégradent sur vos suivis récents."
                        ),
                        "details": {
                            "worsening_metrics": (
                                negative_change
                            ),
                            "recent_sample_size": len(
                                recent_entries
                            ),
                            "comparison_sample_size": len(
                                older_entries
                            ),
                        },
                    })

    # ---------- Produits liés aux suivis ----------

    linked_product_counts: Counter[str] = Counter()

    product_skin_entries: Dict[
        str,
        List[Dict[str, Any]]
    ] = {}

    for entry in tracking_entries:
        linked_products = (
            entry.get("linked_products")
            or []
        )

        for analysis_id in linked_products:
            analysis_key = str(
                analysis_id or ""
            ).strip()

            if not analysis_key:
                continue

            linked_product_counts[
                analysis_key
            ] += 1

            product_skin_entries.setdefault(
                analysis_key,
                [],
            ).append(entry)

    analysis_ids = set(
        linked_product_counts.keys()
    )

    analysis_ids.update(
        str(feedback.get("analysis_id"))
        for feedback in feedbacks
        if feedback.get("analysis_id")
    )

    analyses = []

    if analysis_ids:
        analyses = await db.product_analyses.find(
            {
                "user_id": user_id,
                "analysis_id": {
                    "$in": list(analysis_ids),
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

    # ---------- Patterns de feedback ----------

    positive_feedbacks = []
    negative_feedbacks = []

    for feedback in feedbacks:
        classification = _classify_feedback(
            feedback
        )

        if classification == "positive":
            positive_feedbacks.append(feedback)

        elif classification == "negative":
            negative_feedbacks.append(feedback)

    if len(positive_feedbacks) >= 2:
        patterns.append({
            "type": "repeated_positive_product_feedback",
            "severity": "positive",
            "confidence": min(
                100,
                len(positive_feedbacks) * 18,
            ),
            "message": (
                "Plusieurs produits ont reçu un "
                "retour positif de votre part."
            ),
            "details": {
                "positive_feedback_count": len(
                    positive_feedbacks
                ),
            },
        })

    if len(negative_feedbacks) >= 2:
        patterns.append({
            "type": "repeated_negative_product_feedback",
            "severity": "warning",
            "confidence": min(
                100,
                len(negative_feedbacks) * 18,
            ),
            "message": (
                "Plusieurs produits sont associés "
                "à des résultats négatifs ou à une irritation."
            ),
            "details": {
                "negative_feedback_count": len(
                    negative_feedbacks
                ),
            },
        })

    # ---------- Risque irritant des produits négatifs ----------

    negative_irritation_scores: List[float] = []
    negative_barrier_scores: List[float] = []
    negative_active_loads: List[str] = []

    for feedback in negative_feedbacks:
        analysis = analyses_by_id.get(
            feedback.get("analysis_id")
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

        if formula.get("irritation_risk") is not None:
            negative_irritation_scores.append(
                _safe_number(
                    formula.get("irritation_risk")
                )
            )

        if formula.get("barrier_support") is not None:
            negative_barrier_scores.append(
                _safe_number(
                    formula.get("barrier_support")
                )
            )

        active_load = (
            synergy.get("active_load", {})
            .get("level")
        )

        if active_load:
            negative_active_loads.append(
                str(active_load).lower()
            )

    average_negative_irritation = _average(
        negative_irritation_scores
    )

    if (
        len(negative_irritation_scores) >= 2
        and average_negative_irritation is not None
        and average_negative_irritation >= 55
    ):
        patterns.append({
            "type": "high_irritation_formulas_linked_to_negative_results",
            "severity": "warning",
            "confidence": min(
                100,
                len(
                    negative_irritation_scores
                ) * 20,
            ),
            "message": (
                "Vos retours négatifs sont souvent "
                "associés à des formules présentant "
                "un risque d’irritation élevé."
            ),
            "details": {
                "average_irritation_risk": (
                    average_negative_irritation
                ),
                "sample_size": len(
                    negative_irritation_scores
                ),
            },
        })

    average_negative_barrier = _average(
        negative_barrier_scores
    )

    if (
        len(negative_barrier_scores) >= 2
        and average_negative_barrier is not None
        and average_negative_barrier <= 40
    ):
        patterns.append({
            "type": "low_barrier_support_linked_to_negative_results",
            "severity": "warning",
            "confidence": min(
                100,
                len(
                    negative_barrier_scores
                ) * 20,
            ),
            "message": (
                "Les produits qui vous réussissent "
                "le moins offrent souvent peu de soutien "
                "à la barrière cutanée."
            ),
            "details": {
                "average_barrier_support": (
                    average_negative_barrier
                ),
                "sample_size": len(
                    negative_barrier_scores
                ),
            },
        })

    high_load_count = sum(
        1
        for load in negative_active_loads
        if load in {
            "high",
            "intense",
            "élevée",
            "elevee",
        }
    )

    if high_load_count >= 2:
        patterns.append({
            "type": "high_active_load_linked_to_negative_results",
            "severity": "warning",
            "confidence": min(
                100,
                high_load_count * 25,
            ),
            "message": (
                "Les formules très chargées en actifs "
                "reviennent dans plusieurs de vos "
                "retours négatifs."
            ),
            "details": {
                "occurrences": high_load_count,
            },
        })

    # ---------- Produits fréquents dans le journal ----------

    for (
        analysis_id,
        occurrence_count,
    ) in linked_product_counts.most_common(3):
        if occurrence_count < 2:
            continue

        analysis = analyses_by_id.get(
            analysis_id,
            {},
        )

        product_name = (
            analysis.get("product_name")
            or "Un produit"
        )

        linked_entries = product_skin_entries.get(
            analysis_id,
            [],
        )

        linked_profile = _build_skin_profile(
            linked_entries
        )

        patterns.append({
            "type": "frequently_tracked_product",
            "severity": "info",
            "confidence": min(
                100,
                occurrence_count * 20,
            ),
            "message": (
                f"{product_name} apparaît dans "
                f"{occurrence_count} suivis de peau."
            ),
            "details": {
                "analysis_id": analysis_id,
                "product_name": product_name,
                "occurrences": occurrence_count,
                "skin_profile": linked_profile,
            },
        })

    # ---------- Limite du nombre de patterns ----------

    severity_priority = {
        "warning": 0,
        "positive": 1,
        "info": 2,
    }

    patterns.sort(
        key=lambda pattern: (
            severity_priority.get(
                pattern.get("severity"),
                3,
            ),
            -int(
                pattern.get("confidence", 0)
            ),
        )
    )

    return patterns[:10]