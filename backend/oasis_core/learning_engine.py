from typing import Dict, Any

from oasis_core.learning_summary import compute_learning_summary
from oasis_core.ingredient_memory import compute_ingredient_memory
from oasis_core.skin_memory import compute_skin_memory
from oasis_core.pattern_engine import detect_user_patterns
from oasis_core.insight_engine import build_user_insights
from oasis_core.formula_memory import compute_formula_memory
from oasis_core.routine_memory import (
    compute_routine_memory,
)
from oasis_core.routine_skin_memory import (
    compute_routine_skin_memory,
)


async def compute_user_learnings(db, user_id: str) -> Dict[str, Any]:
    """
    OASIS Learning Engine.
    Orchestre les sous-moteurs de mémoire utilisateur.
    """

    learning_summary = await compute_learning_summary(db, user_id)
    ingredient_memory = await compute_ingredient_memory(db, user_id)
    formula_memory = await compute_formula_memory(
    db,
    user_id,
)
    skin_memory = await compute_skin_memory(db, user_id)
    routine_memory = await compute_routine_memory(
    db,
    user_id,
    routine_skin_memory = (
    await compute_routine_skin_memory(
        db,
        user_id,
    )
)
)
    patterns = await detect_user_patterns(db, user_id)

    insights = await build_user_insights(
        learning_summary=learning_summary,
        ingredient_memory=ingredient_memory,
        formula_memory=formula_memory,
        routine_memory=routine_memory,
        skin_memory=skin_memory,
        patterns=patterns,
)
    routine_memory["skin_impact"] = (
        routine_skin_memory
)
    return {
        "learning_summary": learning_summary,
        "ingredient_intelligence": ingredient_memory,
        "skin_intelligence": skin_memory,
        "routine_intelligence": routine_memory,
        "patterns": patterns,
        "insights": insights,
    }