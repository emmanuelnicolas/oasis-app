from typing import Dict, Any, List


POSITIVE_METRICS = ["hydration", "glow", "texture"]
NEGATIVE_METRICS = ["irritation", "breakouts", "redness"]


async def compute_ingredient_correlations(db, user_id: str) -> Dict[str, Any]:
    """
    Détecte les corrélations simples entre ingrédients utilisés
    et évolution des métriques du journal peau.
    """

    tracking_entries = await db.skin_tracking.find(
        {
            "user_id": user_id,
            "linked_products.0": {"$exists": True},
        },
        {
            "_id": 0,
            "hydration": 1,
            "glow": 1,
            "texture": 1,
            "irritation": 1,
            "breakouts": 1,
            "redness": 1,
            "linked_products": 1,
            "created_at": 1,
        }
    ).sort("created_at", 1).to_list(length=100)

    if len(tracking_entries) < 2:
        return {
            "correlations": [],
            "confidence": 0,
        }

    ingredient_effects = {}

    for index in range(1, len(tracking_entries)):
        previous_entry = tracking_entries[index - 1]
        current_entry = tracking_entries[index]

        linked_products = previous_entry.get("linked_products", [])

        if not linked_products:
            continue

        metric_delta_score = 0

        for metric in POSITIVE_METRICS:
            metric_delta_score += (
                current_entry.get(metric, 0) -
                previous_entry.get(metric, 0)
            )

        for metric in NEGATIVE_METRICS:
            metric_delta_score -= (
                current_entry.get(metric, 0) -
                previous_entry.get(metric, 0)
            )

        for product in linked_products:
            analysis = await db.product_analyses.find_one(
                {
                    "user_id": user_id,
                    "analysis_id": product.get("analysis_id"),
                },
                {
                    "_id": 0,
                    "ingredients": 1,
                }
            )

            if not analysis:
                continue

            for ingredient in analysis.get("ingredients", []):
                name = ingredient.get("name")

                if not name:
                    continue

                if name not in ingredient_effects:
                    ingredient_effects[name] = {
                        "ingredient": name,
                        "score": 0,
                        "observations": 0,
                    }

                ingredient_effects[name]["score"] += metric_delta_score
                ingredient_effects[name]["observations"] += 1

    correlations = sorted(
        ingredient_effects.values(),
        key=lambda item: item["score"],
        reverse=True
    )

    confidence = min(
        100,
        sum(item["observations"] for item in correlations) * 5
    )

    return {
        "correlations": correlations[:10],
        "confidence": confidence,
    }