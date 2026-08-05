from typing import Dict, Any


async def compute_learning_summary(db, user_id: str) -> Dict[str, Any]:
    feedbacks = await db.product_feedback.find(
        {"user_id": user_id},
        {"_id": 0, "overall_result": 1}
    ).to_list(length=100)

    positive_products = 0
    neutral_products = 0
    negative_products = 0

    for feedback in feedbacks:
        result = feedback.get("overall_result")

        if result == "improved":
            positive_products += 1
        elif result == "stable":
            neutral_products += 1
        elif result == "worse":
            negative_products += 1

    return {
        "total_feedbacks": len(feedbacks),
        "positive_products": positive_products,
        "neutral_products": neutral_products,
        "negative_products": negative_products,
    }