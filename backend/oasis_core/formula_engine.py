from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


HYDRATION_BENEFITS = {
    "hydratation",
    "deshydratation",
    "déshydratation",
    "humectant",
    "hydrating",
    "moisturizing",
}

BARRIER_BENEFITS = {
    "barriere",
    "barrière",
    "barrier",
    "ceramides",
    "céramides",
    "repair",
    "reparation",
    "réparation",
    "soothing",
    "apaisant",
}

ACTIVE_BENEFITS = {
    "acne",
    "taches",
    "eclat",
    "éclat",
    "rides",
    "pores",
    "rougeurs",
    "texture",
    "anti-age",
    "anti-âge",
    "antioxydant",
}

IRRITATING_CATEGORIES = {
    "fragrance",
    "essential_oil",
    "exfoliant",
    "alcohol",
}

HIGH_RISK_INGREDIENTS = {
    "ALCOHOL DENAT",
    "ALCOHOL DENAT.",
    "PARFUM",
    "FRAGRANCE",
}

LOW_PERCENT_MARKERS = {
    "PHENOXYETHANOL",
    "SODIUM BENZOATE",
    "POTASSIUM SORBATE",
    "ETHYLHEXYLGLYCERIN",
    "CAPRYLYL GLYCOL",
    "CHLORPHENESIN",
    "BENZYL ALCOHOL",
}


def normalize_ingredient_name(name: str) -> str:
    normalized = str(name or "").upper()

    normalized = re.sub(
        r"\(.*?\)",
        "",
        normalized,
    )

    normalized = (
        normalized
        .replace(".", "")
        .replace(",", "")
        .replace("/", " ")
        .replace("\\", " ")
        .replace("-", " ")
    )

    normalized = re.sub(
        r"\s+",
        " ",
        normalized,
    )

    return normalized.strip()


def normalize_tag(value: Any) -> str:
    normalized = str(value or "").lower().strip()

    normalized = (
        normalized
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("ç", "c")
    )

    return normalized


def clamp_score(
    value: float,
    minimum: int = 0,
    maximum: int = 100,
) -> int:
    return int(
        max(
            minimum,
            min(round(value), maximum),
        )
    )


def find_one_percent_line(
    ingredient_names: List[str],
) -> Optional[int]:
    for index, ingredient_name in enumerate(
        ingredient_names
    ):
        normalized = normalize_ingredient_name(
            ingredient_name
        )

        if normalized in LOW_PERCENT_MARKERS:
            return index

    return None


def get_position_weight(
    index: int,
    total: int,
) -> float:
    if total <= 0:
        return 1.0

    relative_position = (
        index + 1
    ) / total

    if index <= 4:
        return 1.0

    if relative_position <= 0.50:
        return 0.75

    if relative_position <= 0.75:
        return 0.50

    return 0.30


def extract_benefits(
    ingredient_data: Dict[str, Any],
) -> set[str]:
    return {
        normalize_tag(benefit)
        for benefit in ingredient_data.get(
            "official_benefits",
            [],
        )
        if benefit
    }


def calculate_active_position_quality(
    active_positions: List[Dict[str, Any]],
) -> int:
    if not active_positions:
        return 40

    weighted_scores = []

    for active in active_positions:
        position_weight = float(
            active.get(
                "position_weight",
                0,
            )
        )

        effective_at_low_dose = bool(
            active.get(
                "effective_at_low_dose",
                False,
            )
        )

        if effective_at_low_dose:
            position_weight = max(
                position_weight,
                0.65,
            )

        weighted_scores.append(
            position_weight * 100
        )

    return clamp_score(
        sum(weighted_scores)
        / len(weighted_scores)
    )


def estimate_active_levels(
    active_positions: List[Dict[str, Any]],
    one_percent_index: Optional[int],
) -> Dict[str, Dict[str, Any]]:
    estimated_levels: Dict[
        str,
        Dict[str, Any],
    ] = {}

    for active in active_positions:
        ingredient_name = active["name"]
        index = int(active["index"])

        effective_at_low_dose = bool(
            active.get(
                "effective_at_low_dose",
                False,
            )
        )

        dose_sensitivity = str(
            active.get(
                "dose_sensitivity",
                "medium",
            )
        )

        if (
            one_percent_index is not None
            and index > one_percent_index
        ):
            if effective_at_low_dose:
                level = "faible mais potentiellement pertinent"
                confidence = 70
            else:
                level = "probablement faible"
                confidence = 75

        elif index <= 4:
            level = "probablement significatif"
            confidence = 65

        elif index <= 9:
            level = "modéré ou intermédiaire"
            confidence = 55

        else:
            level = "incertain"
            confidence = 35

        if (
            dose_sensitivity == "high"
            and level == "probablement faible"
        ):
            confidence = min(
                90,
                confidence + 10,
            )

        estimated_levels[
            ingredient_name
        ] = {
            "level": level,
            "confidence": confidence,
            "position": index + 1,
            "effective_at_low_dose":
                effective_at_low_dose,
        }

    return estimated_levels


def analyze_formula(
    ingredient_names: List[str],
    profile: Optional[
        Dict[str, Any]
    ],
    ingredients_map: Dict[
        str,
        Dict[str, Any],
    ],
) -> Dict[str, Any]:
    profile = profile or {}

    hydration_points = 35.0
    barrier_points = 35.0
    irritation_points = 10.0
    active_balance_points = 45.0

    matched_ingredients = 0
    unknown_ingredients = 0

    active_positions: List[
        Dict[str, Any]
    ] = []

    hydration_supporters: List[str] = []
    barrier_supporters: List[str] = []
    irritation_sources: List[str] = []

    skin_type = normalize_tag(
        profile.get("skin_type")
    )

    sensitivity = normalize_tag(
        profile.get("sensitivity")
    )

    concerns = {
        normalize_tag(concern)
        for concern in profile.get(
            "concerns",
            [],
        )
    }

    one_percent_index = (
        find_one_percent_line(
            ingredient_names
        )
    )

    total_ingredients = len(
        ingredient_names
    )

    for index, raw_name in enumerate(
        ingredient_names
    ):
        normalized_name = (
            normalize_ingredient_name(
                raw_name
            )
        )

        ingredient_data = (
            ingredients_map.get(
                normalized_name
            )
        )

        if not ingredient_data:
            unknown_ingredients += 1
            continue

        matched_ingredients += 1

        ingredient_name = (
            ingredient_data.get(
                "inci_name"
            )
            or raw_name
        )

        category = normalize_tag(
            ingredient_data.get(
                "category"
            )
        )

        risk_level = normalize_tag(
            ingredient_data.get(
                "risk_level",
                "low",
            )
        )

        score_weight = float(
            ingredient_data.get(
                "score_weight",
                0,
            )
            or 0
        )

        avoid_for = {
            normalize_tag(value)
            for value in ingredient_data.get(
                "avoid_for",
                [],
            )
        }

        benefits = extract_benefits(
            ingredient_data
        )

        position_weight = (
            get_position_weight(
                index,
                total_ingredients,
            )
        )

        weighted_score = (
            score_weight
            * position_weight
        )

        hydration_match = bool(
            benefits
            & {
                normalize_tag(value)
                for value in
                HYDRATION_BENEFITS
            }
        )

        barrier_match = bool(
            benefits
            & {
                normalize_tag(value)
                for value in
                BARRIER_BENEFITS
            }
        )

        active_match = bool(
            benefits
            & {
                normalize_tag(value)
                for value in
                ACTIVE_BENEFITS
            }
        )

        concern_match = bool(
            benefits & concerns
        )

        if hydration_match:
            hydration_points += (
                10 * position_weight
            )

            hydration_supporters.append(
                ingredient_name
            )

        if barrier_match:
            barrier_points += (
                12 * position_weight
            )

            barrier_supporters.append(
                ingredient_name
            )

        if active_match or concern_match:
            active_balance_points += (
                7 * position_weight
            )

            active_positions.append({
                "name": ingredient_name,
                "index": index,
                "position_weight":
                    position_weight,
                "dose_sensitivity":
                    ingredient_data.get(
                        "dose_sensitivity",
                        "medium",
                    ),
                "effective_at_low_dose":
                    bool(
                        ingredient_data.get(
                            "effective_at_low_dose",
                            False,
                        )
                    ),
            })

        if weighted_score > 0:
            active_balance_points += (
                weighted_score * 0.60
            )

        elif weighted_score < 0:
            active_balance_points += (
                weighted_score * 0.40
            )

        is_irritating = (
            category
            in IRRITATING_CATEGORIES
            or normalized_name
            in {
                normalize_ingredient_name(
                    value
                )
                for value in
                HIGH_RISK_INGREDIENTS
            }
        )

        if risk_level == "high":
            irritation_points += (
                18 * position_weight
            )

            irritation_sources.append(
                ingredient_name
            )

        elif risk_level == "medium":
            irritation_points += (
                8 * position_weight
            )

        if is_irritating:
            irritation_points += (
                12 * position_weight
            )

            if (
                ingredient_name
                not in irritation_sources
            ):
                irritation_sources.append(
                    ingredient_name
                )

        if (
            sensitivity in {
                "moyenne",
                "forte",
                "medium",
                "high",
            }
            and "sensible" in avoid_for
        ):
            irritation_points += (
                14 * position_weight
            )

        if (
            skin_type in {
                "seche",
                "dry",
            }
            and "seche" in avoid_for
        ):
            barrier_points -= (
                10 * position_weight
            )

        if (
            "acne" in concerns
            and "acne" in avoid_for
        ):
            irritation_points += (
                8 * position_weight
            )

    hydration_score = clamp_score(
        hydration_points
    )

    barrier_support = clamp_score(
        barrier_points
    )

    irritation_risk = clamp_score(
        irritation_points
    )

    active_position_quality = (
        calculate_active_position_quality(
            active_positions
        )
    )

    active_balance_score = clamp_score(
        (
            active_balance_points
            + active_position_quality
        )
        / 2
    )

    if active_balance_score >= 80:
        active_balance = "excellent"

    elif active_balance_score >= 65:
        active_balance = "bon"

    elif active_balance_score >= 45:
        active_balance = "moyen"

    else:
        active_balance = "faible"

    if total_ingredients > 0:
        database_coverage = (
            matched_ingredients
            / total_ingredients
        )
    else:
        database_coverage = 0.0

    marketing_confidence = clamp_score(
        (
            database_coverage * 55
            + active_position_quality * 0.35
            + 10
        )
    )

    formula_confidence = clamp_score(
        database_coverage * 100
    )

    estimated_active_levels = (
        estimate_active_levels(
            active_positions,
            one_percent_index,
        )
    )

    return {
        "active_balance": active_balance,
        "active_balance_score":
            active_balance_score,
        "hydration_score":
            hydration_score,
        "barrier_support":
            barrier_support,
        "irritation_risk":
            irritation_risk,
        "active_position_quality":
            active_position_quality,
        "marketing_confidence":
            marketing_confidence,
        "formula_confidence":
            formula_confidence,
        "database_coverage":
            round(
                database_coverage,
                3,
            ),
        "matched_ingredients":
            matched_ingredients,
        "unknown_ingredients":
            unknown_ingredients,
        "one_percent_line_index": (
            one_percent_index + 1
            if one_percent_index
            is not None
            else None
        ),
        "hydration_supporters":
            hydration_supporters[:8],
        "barrier_supporters":
            barrier_supporters[:8],
        "irritation_sources":
            irritation_sources[:8],
        "estimated_active_levels":
            estimated_active_levels,
    }