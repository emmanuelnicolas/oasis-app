from typing import List, Dict, Any


async def build_user_insights(
    learning_summary: Dict[str, Any],
    ingredient_memory: Dict[str, Any],
    formula_memory: Dict[str, Any],
    routine_memory: Dict[str, Any],
    skin_memory: Dict[str, Any],
    patterns: List[Dict[str, Any]],
) -> List[str]:

    insights: List[str] = []

    # ---------- Skin trend ----------

    trend = skin_memory.get("trend")

    if trend == "improving":
        insights.append(
            "📈 Votre peau montre une amélioration globale ces derniers suivis."
        )

    elif trend == "worsening":
        insights.append(
            "⚠️ Votre peau semble se dégrader récemment. Il peut être utile de revoir votre routine."
        )

    elif trend == "stable":
        insights.append(
            "🌿 Votre peau reste globalement stable."
        )

    # ---------- Ingredient intelligence ----------

    positive = ingredient_memory.get(
        "positive_ingredients",
        [],
    )

    if positive:
        best = positive[0]

        ingredient_name = best.get(
            "ingredient",
            "Un ingrédient",
        )

        insights.append(
            f"🧪 {ingredient_name} semble bien fonctionner pour votre peau."
        )

    watch = ingredient_memory.get(
        "watch_ingredients",
        [],
    )

    if watch:
        worst = watch[0]

        ingredient_name = worst.get(
            "ingredient",
            "Un ingrédient",
        )

        insights.append(
            f"🚩 {ingredient_name} mérite votre attention."
        )

    # ---------- Formula intelligence ----------

    formula_status = formula_memory.get(
        "status",
        "insufficient_data",
    )

    formula_confidence = formula_memory.get(
        "confidence",
        0,
    )

    positive_formula = formula_memory.get(
        "positive_formula_profile",
    )

    negative_formula = formula_memory.get(
        "negative_formula_profile",
    )

    preferred_active_load = formula_memory.get(
        "preferred_active_load",
    )

    if positive_formula:
        sample_size = positive_formula.get(
            "sample_size",
            0,
        )

        barrier_support = positive_formula.get(
            "average_barrier_support",
        )

        hydration_score = positive_formula.get(
            "average_hydration_score",
        )

        irritation_risk = positive_formula.get(
            "average_irritation_risk",
        )

        if (
            sample_size >= 2
            and barrier_support is not None
            and barrier_support >= 65
        ):
            insights.append(
                "🛡️ Les produits qui soutiennent bien la barrière cutanée semblent associés à de meilleurs résultats pour votre peau."
            )

        if (
            sample_size >= 2
            and hydration_score is not None
            and hydration_score >= 65
        ):
            insights.append(
                "💧 Votre peau semble mieux répondre aux formules avec un bon potentiel hydratant."
            )

        if (
            sample_size >= 2
            and irritation_risk is not None
            and irritation_risk <= 35
        ):
            insights.append(
                "🌿 Les formules à faible risque d’irritation semblent mieux vous convenir."
            )

    if preferred_active_load:
        active_load_labels = {
            "low": "faible",
            "light": "faible",
            "moderate": "modérée",
            "medium": "modérée",
            "high": "élevée",
            "intense": "élevée",
        }

        translated_load = active_load_labels.get(
            str(preferred_active_load).lower(),
            str(preferred_active_load),
        )

        insights.append(
            f"⚗️ Votre peau semble mieux tolérer une charge d’actifs {translated_load}."
        )

    if positive_formula and negative_formula:
        positive_irritation = positive_formula.get(
            "average_irritation_risk",
        )

        negative_irritation = negative_formula.get(
            "average_irritation_risk",
        )

        if (
            positive_irritation is not None
            and negative_irritation is not None
            and negative_irritation
            >= positive_irritation + 15
        ):
            insights.append(
                "⚠️ Les produits associés à vos mauvais résultats présentent en moyenne un risque d’irritation plus élevé."
            )

        positive_barrier = positive_formula.get(
            "average_barrier_support",
        )

        negative_barrier = negative_formula.get(
            "average_barrier_support",
        )

        if (
            positive_barrier is not None
            and negative_barrier is not None
            and positive_barrier
            >= negative_barrier + 15
        ):
            insights.append(
                "🧱 Les produits qui vous réussissent semblent offrir un meilleur soutien de la barrière cutanée."
            )

    observed_synergies = formula_memory.get(
        "observed_synergies",
        [],
    )

    if observed_synergies:
        strongest_synergy = observed_synergies[0]

        message = strongest_synergy.get(
            "message",
        )

        occurrences = strongest_synergy.get(
            "occurrences",
            0,
        )

        if message and occurrences >= 2:
            insights.append(
                f"✨ Une association revient dans plusieurs de vos bons résultats : {message}"
            )

    observed_conflicts = formula_memory.get(
        "observed_conflicts",
        [],
    )

    if observed_conflicts:
        strongest_conflict = observed_conflicts[0]

        message = strongest_conflict.get(
            "message",
        )

        occurrences = strongest_conflict.get(
            "occurrences",
            0,
        )

        if message and occurrences >= 2:
            insights.append(
                f"🚨 Une association revient dans plusieurs réactions négatives : {message}"
            )

    if (
        formula_status == "learning"
        and formula_confidence < 60
    ):
        insights.append(
            "🧠 OASIS commence à identifier les types de formules que votre peau tolère le mieux. Continuez à donner des retours produits."
        )

    # ---------- Feedback ----------

    total_feedbacks = learning_summary.get(
        "total_feedbacks",
        0,
    )

    if total_feedbacks == 0:
        insights.append(
            "💬 Donnez un retour sur vos produits après quelques jours pour aider OASIS à mieux comprendre votre peau."
        )
    # ---------- Routine intelligence ----------

    routine_status = routine_memory.get(
        "status",
        "insufficient_data",
    )

    routine_confidence = int(
        routine_memory.get(
            "confidence",
            0,
        )
        or 0
    )

    current_streak = int(
        routine_memory.get(
            "current_streak",
            0,
        )
        or 0
    )

    overall_adherence = float(
        routine_memory.get(
            "overall_adherence",
            0,
        )
        or 0
    )

    adherence_trend = routine_memory.get(
        "adherence_trend",
        "insufficient_data",
    )

    routine_adherence = (
        routine_memory.get(
            "routine_adherence",
            {},
        )
        or {}
    )

    step_performance = (
        routine_memory.get(
            "step_performance",
            [],
        )
        or []
    )

    routine_recommendations = (
        routine_memory.get(
            "recommendations",
            [],
        )
        or []
    )
    routine_skin_impact = (
        routine_memory.get(
            "skin_impact",
            {},
        )
        or {}
    )

    skin_impact_status = (
        routine_skin_impact.get(
            "status",
            "insufficient_comparison",
        )
    )

    skin_impact_confidence = int(
        routine_skin_impact.get(
            "confidence",
            0,
        )
        or 0
    )

    observed_skin_effects = (
        routine_skin_impact.get(
            "observed_effects",
            [],
        )
        or []
    )

    if current_streak >= 3:
        insights.append(
            f"🔥 Vous suivez votre routine depuis {current_streak} jours consécutifs."
        )

    if (
        adherence_trend == "improving"
        and routine_confidence >= 30
    ):
        insights.append(
            "📈 Votre régularité progresse par rapport à la semaine précédente."
        )

    elif (
        adherence_trend == "declining"
        and routine_confidence >= 30
    ):
        insights.append(
            "📉 Votre régularité a diminué récemment. Une routine plus simple pourrait être plus facile à maintenir."
        )

    elif (
        adherence_trend == "stable"
        and routine_confidence >= 40
    ):
        insights.append(
            "🌿 Votre régularité reste stable sur les deux dernières semaines."
        )

    routine_scores = []

    for routine_type in [
        "matin",
        "soir",
    ]:
        routine_data = (
            routine_adherence.get(
                routine_type,
                {},
            )
            or {}
        )

        step_count = int(
            routine_data.get(
                "step_count",
                0,
            )
            or 0
        )

        adherence = float(
            routine_data.get(
                "adherence",
                0,
            )
            or 0
        )

        if step_count > 0:
            routine_scores.append({
                "type": routine_type,
                "label": routine_data.get(
                    "label",
                    routine_type,
                ),
                "adherence": adherence,
            })

    if (
        routine_scores
        and routine_confidence >= 25
    ):
        best_routine = max(
            routine_scores,
            key=lambda item: item[
                "adherence"
            ],
        )

        weakest_routine = min(
            routine_scores,
            key=lambda item: item[
                "adherence"
            ],
        )

        if best_routine["adherence"] >= 50:
            insights.append(
                f"⏰ {best_routine['label']} est votre routine la plus régulière avec {round(best_routine['adherence'])}% d’adhérence."
            )

        if (
            len(routine_scores) >= 2
            and best_routine["adherence"]
            >= weakest_routine["adherence"] + 25
        ):
            insights.append(
                f"🕒 {weakest_routine['label']} est moins régulière que votre autre routine."
            )

    if (
        step_performance
        and routine_confidence >= 25
    ):
        weakest_step = min(
            step_performance,
            key=lambda item: float(
                item.get(
                    "completion_rate",
                    0,
                )
                or 0
            ),
        )

        weakest_rate = float(
            weakest_step.get(
                "completion_rate",
                0,
            )
            or 0
        )

        weakest_name = (
            weakest_step.get("name")
            or "Une étape"
        )

        opportunities = int(
            weakest_step.get(
                "opportunities",
                0,
            )
            or 0
        )

        if (
            opportunities >= 3
            and weakest_rate < 50
        ):
            insights.append(
                f"🧴 L’étape « {weakest_name} » est la moins suivie actuellement avec {round(weakest_rate)}% de réalisation."
            )

    if (
        routine_status == "learning"
        and overall_adherence > 0
        and overall_adherence < 40
    ):
        insights.append(
            "🪶 Votre routine semble encore difficile à maintenir. Réduire le nombre d’étapes pourrait améliorer votre régularité."
        )

    if (
        routine_status == "insufficient_data"
        and not routine_recommendations
    ):
        insights.append(
            "✅ Cochez vos étapes matin et soir pour permettre à OASIS d’apprendre votre rythme."
        )

    for recommendation in routine_recommendations[:1]:
        recommendation_text = str(
            recommendation or ""
        ).strip()

        if recommendation_text:
            insights.append(
                f"💡 {recommendation_text}"
            )
    # ---------- Routine / skin association ----------

    metric_labels = {
        "hydration": "l’hydratation",
        "glow": "l’éclat",
        "texture": "la texture",
        "irritation": "l’irritation",
        "breakouts": "les boutons",
        "redness": "les rougeurs",
    }

    metric_emojis = {
        "hydration": "💧",
        "glow": "✨",
        "texture": "🧴",
        "irritation": "🔥",
        "breakouts": "🔴",
        "redness": "🌸",
    }

    if (
        observed_skin_effects
        and skin_impact_confidence >= 30
    ):
        for effect in observed_skin_effects[:2]:
            metric = effect.get("metric")
            difference = effect.get(
                "difference"
            )
            direction = effect.get(
                "direction"
            )

            label = metric_labels.get(
                metric,
                metric or "un indicateur",
            )

            emoji = metric_emojis.get(
                metric,
                "📊",
            )

            if difference is None:
                continue

            try:
                difference_value = round(
                    float(difference),
                    1,
                )
            except (TypeError, ValueError):
                continue

            if direction == "improving":
                insights.append(
                    f"{emoji} {label.capitalize()} est en moyenne meilleure de {difference_value} point(s) pendant vos périodes les plus régulières."
                )

            elif direction == "decreasing":
                insights.append(
                    f"{emoji} {label.capitalize()} est en moyenne plus faible de {difference_value} point(s) pendant vos périodes les plus régulières."
                )

    elif (
        skin_impact_status == "learning"
        and skin_impact_confidence >= 20
    ):
        insights.append(
            "🔎 OASIS commence à comparer votre régularité avec l’évolution de votre peau, mais davantage de suivis sont encore nécessaires."
        )
    # ---------- Patterns ----------

    for pattern in patterns:
        pattern_type = pattern.get("type")
        confidence = int(
            pattern.get("confidence", 0)
            or 0
        )

        details = pattern.get(
            "details",
            {},
        ) or {}

        if (
            pattern_type
            == "missing_product_feedback"
        ):
            insights.append(
                "💬 Vos retours produits permettront à OASIS de comprendre quels ingrédients et quelles formules fonctionnent réellement pour votre peau."
            )

        elif (
            pattern_type
            == "insufficient_skin_tracking"
        ):
            insights.append(
                "📅 Continuez votre journal pendant quelques jours afin qu’OASIS puisse détecter les premières tendances."
            )

        elif (
            pattern_type
            == "recent_skin_improvement"
            and confidence >= 30
        ):
            improving_metrics = details.get(
                "improving_metrics",
                0,
            )

            if improving_metrics:
                insights.append(
                    f"📈 {improving_metrics} indicateurs de votre peau s’améliorent sur vos suivis récents."
                )
            else:
                insights.append(
                    "📈 Plusieurs indicateurs de votre peau s’améliorent sur vos suivis récents."
                )

        elif (
            pattern_type
            == "recent_skin_worsening"
            and confidence >= 30
        ):
            worsening_metrics = details.get(
                "worsening_metrics",
                0,
            )

            if worsening_metrics:
                insights.append(
                    f"⚠️ {worsening_metrics} indicateurs de votre peau se dégradent récemment. Vérifiez les changements récents dans votre routine."
                )
            else:
                insights.append(
                    "⚠️ Plusieurs indicateurs de votre peau se dégradent récemment. Vérifiez les changements récents dans votre routine."
                )

        elif (
            pattern_type
            == "repeated_positive_product_feedback"
            and confidence >= 30
        ):
            positive_count = details.get(
                "positive_feedback_count",
                0,
            )

            if positive_count:
                insights.append(
                    f"✅ {positive_count} produits ont déjà donné un résultat positif pour votre peau."
                )
            else:
                insights.append(
                    "✅ Plusieurs produits ont déjà donné un résultat positif pour votre peau."
                )

        elif (
            pattern_type
            == "repeated_negative_product_feedback"
            and confidence >= 30
        ):
            negative_count = details.get(
                "negative_feedback_count",
                0,
            )

            if negative_count:
                insights.append(
                    f"🚩 {negative_count} produits sont associés à une irritation ou à un résultat négatif."
                )
            else:
                insights.append(
                    "🚩 Plusieurs produits sont associés à une irritation ou à un résultat négatif."
                )

        elif (
            pattern_type
            == "high_irritation_formulas_linked_to_negative_results"
            and confidence >= 40
        ):
            average_risk = details.get(
                "average_irritation_risk"
            )

            if average_risk is not None:
                insights.append(
                    f"🔥 Les produits mal tolérés présentent un risque d’irritation moyen de {round(float(average_risk))}/100."
                )
            else:
                insights.append(
                    "🔥 Les produits mal tolérés présentent souvent un risque d’irritation élevé."
                )

        elif (
            pattern_type
            == "low_barrier_support_linked_to_negative_results"
            and confidence >= 40
        ):
            barrier_support = details.get(
                "average_barrier_support"
            )

            if barrier_support is not None:
                insights.append(
                    f"🧱 Les produits associés à vos mauvais résultats offrent en moyenne seulement {round(float(barrier_support))}/100 de soutien à la barrière cutanée."
                )
            else:
                insights.append(
                    "🧱 Les produits associés à vos mauvais résultats soutiennent souvent peu la barrière cutanée."
                )

        elif (
            pattern_type
            == "high_active_load_linked_to_negative_results"
            and confidence >= 40
        ):
            occurrences = details.get(
                "occurrences",
                0,
            )

            if occurrences:
                insights.append(
                    f"⚗️ Une charge d’actifs élevée revient dans {occurrences} de vos retours négatifs."
                )
            else:
                insights.append(
                    "⚗️ Les formules très chargées en actifs reviennent dans plusieurs de vos retours négatifs."
                )

        elif (
            pattern_type
            == "frequently_tracked_product"
            and confidence >= 40
        ):
            product_name = details.get(
                "product_name",
                "Un produit",
            )

            occurrences = details.get(
                "occurrences",
                0,
            )

            if occurrences:
                insights.append(
                    f"📌 {product_name} apparaît dans {occurrences} de vos suivis. OASIS commence à mesurer son impact sur votre peau."
                )
            else:
                insights.append(
                    f"📌 {product_name} revient régulièrement dans votre journal."
                )

    # ---------- Dédoublonnage ----------

    unique_insights: List[str] = []

    for insight in insights:
        if insight not in unique_insights:
            unique_insights.append(insight)

    # ---------- Aucun apprentissage ----------

    if not unique_insights:
        unique_insights.append(
            "🌱 OASIS commence à apprendre à partir de votre journal et de vos retours."
        )

    return unique_insights[:8]