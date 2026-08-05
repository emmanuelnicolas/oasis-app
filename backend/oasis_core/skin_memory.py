from typing import Dict, Any


POSITIVE_METRICS = ["hydration", "glow", "texture"]
NEGATIVE_METRICS = ["irritation", "breakouts", "redness"]


async def compute_skin_memory(db, user_id: str) -> Dict[str, Any]:
    entries = await db.skin_tracking.find(
        {"user_id": user_id},
        {
            "_id": 0,
            "hydration": 1,
            "glow": 1,
            "texture": 1,
            "irritation": 1,
            "breakouts": 1,
            "redness": 1,
            "created_at": 1,
        }
    ).sort("created_at", 1).to_list(length=30)

    if len(entries) < 2:
        return {
            "trend": "insufficient_data",
            "entry_count": len(entries),
            "metrics": {},
        }

    first = entries[0]
    latest = entries[-1]

    metrics = {}

    positive_score = 0
    negative_score = 0

    for key in POSITIVE_METRICS:
        delta = latest.get(key, 0) - first.get(key, 0)

        metrics[key] = {
            "first": first.get(key),
            "latest": latest.get(key),
            "delta": delta,
            "direction": "up" if delta > 0 else "down" if delta < 0 else "stable",
        }

        positive_score += delta

    for key in NEGATIVE_METRICS:
        delta = latest.get(key, 0) - first.get(key, 0)

        metrics[key] = {
            "first": first.get(key),
            "latest": latest.get(key),
            "delta": delta,
            "direction": "down" if delta < 0 else "up" if delta > 0 else "stable",
        }

        negative_score += delta

    overall_score = positive_score - negative_score

    if overall_score >= 2:
        trend = "improving"
    elif overall_score <= -2:
        trend = "worsening"
    else:
        trend = "stable"

    return {
        "trend": trend,
        "entry_count": len(entries),
        "metrics": metrics,
    }