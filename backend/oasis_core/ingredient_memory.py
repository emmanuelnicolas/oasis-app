from typing import Dict, Any
from oasis_core.ingredient_correlation import compute_ingredient_correlations


async def compute_ingredient_memory(db, user_id: str) -> Dict[str, Any]:
    feedbacks = await db.product_feedback.find(
        {"user_id": user_id},
        {"_id": 0, "analysis_id": 1, "overall_result": 1}
    ).to_list(length=100)

    ingredient_stats = {}

    for feedback in feedbacks:
        analysis = await db.product_analyses.find_one(
            {
                "user_id": user_id,
                "analysis_id": feedback.get("analysis_id")
            },
            {"_id": 0, "ingredients": 1}
        )

        if not analysis:
            continue

        result = feedback.get("overall_result")

        for ingredient in analysis.get("ingredients", []):
            name = ingredient.get("name")

            if not name:
                continue

            if name not in ingredient_stats:
                ingredient_stats[name] = {
                    "ingredient": name,
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0,
                    "score": 0,
                }

            if result == "improved":
                ingredient_stats[name]["positive"] += 1
                ingredient_stats[name]["score"] += 2

            elif result == "stable":
                ingredient_stats[name]["neutral"] += 1
                ingredient_stats[name]["score"] += 1

            elif result == "worse":
                ingredient_stats[name]["negative"] += 1
                ingredient_stats[name]["score"] -= 2

    positive_ingredients = sorted(
        [
            item for item in ingredient_stats.values()
            if item["score"] > 0
        ],
        key=lambda x: x["score"],
        reverse=True
    )[:5]

    watch_ingredients = sorted(
        [
            item for item in ingredient_stats.values()
            if item["score"] < 0
        ],
        key=lambda x: x["score"]
    )[:5]

    total_signals = sum(
        item["positive"] + item["neutral"] + item["negative"]
        for item in ingredient_stats.values()
    )

    confidence = min(100, total_signals * 10)
    correlations_data = await compute_ingredient_correlations(db, user_id)
    
    return {
        "positive_ingredients": positive_ingredients,
        "watch_ingredients": watch_ingredients,
        "confidence": confidence,
        "correlations": correlations_data["correlations"],
        "correlation_confidence": correlations_data["confidence"],
    }