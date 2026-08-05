from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Set


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

    replacements = {
        "é": "e",
        "è": "e",
        "ê": "e",
        "à": "a",
        "â": "a",
        "î": "i",
        "ï": "i",
        "ô": "o",
        "ù": "u",
        "ç": "c",
    }

    for source, target in replacements.items():
        normalized = normalized.replace(
            source,
            target,
        )

    normalized = re.sub(
        r"\s+",
        " ",
        normalized,
    )

    return normalized.strip()


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


def contains_any(
    names: Set[str],
    candidates: Set[str],
) -> bool:
    return bool(names & candidates)


RETINOIDS = {
    "RETINOL",
    "RETINAL",
    "RETINALDEHYDE",
    "RETINYL PALMITATE",
    "RETINYL ACETATE",
}

AHA = {
    "GLYCOLIC ACID",
    "LACTIC ACID",
    "MANDELIC ACID",
    "MALIC ACID",
    "TARTARIC ACID",
}

BHA = {
    "SALICYLIC ACID",
    "BETAINE SALICYLATE",
}

PHA = {
    "GLUCONOLACTONE",
    "LACTOBIONIC ACID",
}

PURE_VITAMIN_C = {
    "ASCORBIC ACID",
    "L ASCORBIC ACID",
}

VITAMIN_C_DERIVATIVES = {
    "SODIUM ASCORBYL PHOSPHATE",
    "MAGNESIUM ASCORBYL PHOSPHATE",
    "ASCORBYL GLUCOSIDE",
    "TETRAHEXYLDECYL ASCORBATE",
    "3 O ETHYL ASCORBIC ACID",
}

NIACINAMIDE = {
    "NIACINAMIDE",
}

CERAMIDES = {
    "CERAMIDE NP",
    "CERAMIDE AP",
    "CERAMIDE EOP",
    "CERAMIDE NS",
    "CERAMIDE AS",
}

HUMECTANTS = {
    "GLYCERIN",
    "HYALURONIC ACID",
    "SODIUM HYALURONATE",
    "PANTHENOL",
    "UREA",
    "BETAINE",
    "PROPANEDIOL",
}

SOOTHING_INGREDIENTS = {
    "PANTHENOL",
    "ALLANTOIN",
    "BISABOLOL",
    "CENTELLA ASIATICA EXTRACT",
    "MADECASSOSIDE",
    "BETA GLUCAN",
    "DIPOTASSIUM GLYCYRRHIZATE",
}

BARRIER_LIPIDS = {
    "CHOLESTEROL",
    "PHYTOSPHINGOSINE",
    "SQUALANE",
}

PEPTIDES = {
    "PALMITOYL PENTAPEPTIDE 4",
    "PALMITOYL TRIPEPTIDE 1",
    "PALMITOYL TETRAPEPTIDE 7",
    "COPPER TRIPEPTIDE 1",
    "ACETYL HEXAPEPTIDE 8",
}

BENZOYL_PEROXIDE = {
    "BENZOYL PEROXIDE",
}

FRAGRANCE = {
    "PARFUM",
    "FRAGRANCE",
}

DRYING_ALCOHOLS = {
    "ALCOHOL DENAT",
    "ETHANOL",
    "SD ALCOHOL 40",
    "ISOPROPYL ALCOHOL",
}

ESSENTIAL_OILS = {
    "LAVANDULA ANGUSTIFOLIA OIL",
    "CITRUS LIMON PEEL OIL",
    "CITRUS AURANTIUM DULCIS PEEL OIL",
    "MENTHA PIPERITA OIL",
    "EUCALYPTUS GLOBULUS LEAF OIL",
    "TEA TREE LEAF OIL",
    "MELALEUCA ALTERNIFOLIA LEAF OIL",
}


def build_rule(
    rule_type: str,
    severity: str,
    ingredients: List[str],
    message: str,
    recommendation: str,
    score_delta: int,
) -> Dict[str, Any]:
    return {
        "type": rule_type,
        "severity": severity,
        "ingredients": ingredients,
        "message": message,
        "recommendation": recommendation,
        "score_delta": score_delta,
    }


def analyze_known_combinations(
    names: Set[str],
) -> Dict[str, List[Dict[str, Any]]]:
    synergies: List[Dict[str, Any]] = []
    conflicts: List[Dict[str, Any]] = []
    redundancies: List[Dict[str, Any]] = []

    has_retinoid = contains_any(
        names,
        RETINOIDS,
    )

    has_aha = contains_any(
        names,
        AHA,
    )

    has_bha = contains_any(
        names,
        BHA,
    )

    has_pha = contains_any(
        names,
        PHA,
    )

    has_pure_vitamin_c = contains_any(
        names,
        PURE_VITAMIN_C,
    )

    has_vitamin_c_derivative = contains_any(
        names,
        VITAMIN_C_DERIVATIVES,
    )

    has_niacinamide = contains_any(
        names,
        NIACINAMIDE,
    )

    has_ceramide = contains_any(
        names,
        CERAMIDES,
    )

    has_humectant = contains_any(
        names,
        HUMECTANTS,
    )

    has_soothing = contains_any(
        names,
        SOOTHING_INGREDIENTS,
    )

    has_barrier_lipid = contains_any(
        names,
        BARRIER_LIPIDS,
    )

    has_peptide = contains_any(
        names,
        PEPTIDES,
    )

    has_benzoyl_peroxide = contains_any(
        names,
        BENZOYL_PEROXIDE,
    )

    if has_niacinamide and has_humectant:
        synergies.append(
            build_rule(
                rule_type="hydration_support",
                severity="positive",
                ingredients=[
                    "Niacinamide",
                    "Humectants",
                ],
                message=(
                    "La niacinamide associée à des humectants "
                    "peut soutenir l’hydratation et la barrière cutanée."
                ),
                recommendation=(
                    "Association cohérente pour une routine hydratante."
                ),
                score_delta=8,
            )
        )

    if (
        has_ceramide
        and has_barrier_lipid
    ):
        synergies.append(
            build_rule(
                rule_type="barrier_lipid_system",
                severity="positive",
                ingredients=[
                    "Céramides",
                    "Lipides de barrière",
                ],
                message=(
                    "Les céramides associés au cholestérol, "
                    "au squalane ou à la phytosphingosine "
                    "forment un soutien cohérent de la barrière cutanée."
                ),
                recommendation=(
                    "Association particulièrement intéressante "
                    "pour les peaux sèches ou fragilisées."
                ),
                score_delta=12,
            )
        )

    if (
        has_retinoid
        and has_soothing
    ):
        synergies.append(
            build_rule(
                rule_type="retinoid_buffering",
                severity="positive",
                ingredients=[
                    "Rétinoïde",
                    "Actifs apaisants",
                ],
                message=(
                    "La présence d’actifs apaisants peut aider "
                    "à améliorer la tolérance du rétinoïde."
                ),
                recommendation=(
                    "Introduire progressivement malgré la présence "
                    "d’agents apaisants."
                ),
                score_delta=6,
            )
        )

    if (
        has_pure_vitamin_c
        and has_vitamin_c_derivative
    ):
        redundancies.append(
            build_rule(
                rule_type="vitamin_c_redundancy",
                severity="medium",
                ingredients=[
                    "Vitamine C pure",
                    "Dérivés de vitamine C",
                ],
                message=(
                    "Plusieurs formes de vitamine C sont présentes. "
                    "Cela peut être pertinent, mais aussi redondant."
                ),
                recommendation=(
                    "La tolérance et le positionnement des différentes "
                    "formes doivent être pris en compte."
                ),
                score_delta=-3,
            )
        )

    if (
        has_aha
        and has_bha
        and has_pha
    ):
        redundancies.append(
            build_rule(
                rule_type="multiple_exfoliants",
                severity="high",
                ingredients=[
                    "AHA",
                    "BHA",
                    "PHA",
                ],
                message=(
                    "La formule combine plusieurs familles d’exfoliants."
                ),
                recommendation=(
                    "Une utilisation fréquente peut augmenter "
                    "le risque d’irritation."
                ),
                score_delta=-12,
            )
        )

    elif (
        sum([
            has_aha,
            has_bha,
            has_pha,
        ])
        >= 2
    ):
        redundancies.append(
            build_rule(
                rule_type="dual_exfoliation",
                severity="medium",
                ingredients=[
                    "Exfoliants multiples",
                ],
                message=(
                    "La formule associe plusieurs types d’exfoliants."
                ),
                recommendation=(
                    "Surveiller la fréquence d’utilisation "
                    "et la tolérance de la peau."
                ),
                score_delta=-7,
            )
        )

    if (
        has_retinoid
        and (has_aha or has_bha)
    ):
        conflicts.append(
            build_rule(
                rule_type="retinoid_exfoliant_load",
                severity="high",
                ingredients=[
                    "Rétinoïde",
                    "Acides exfoliants",
                ],
                message=(
                    "L’association rétinoïde et acides exfoliants "
                    "peut augmenter le risque d’irritation."
                ),
                recommendation=(
                    "Introduire progressivement et éviter de cumuler "
                    "avec d’autres exfoliants dans la même routine."
                ),
                score_delta=-18,
            )
        )

    if (
        has_benzoyl_peroxide
        and has_retinoid
    ):
        conflicts.append(
            build_rule(
                rule_type="benzoyl_peroxide_retinoid",
                severity="high",
                ingredients=[
                    "Peroxyde de benzoyle",
                    "Rétinoïde",
                ],
                message=(
                    "Le peroxyde de benzoyle et certains rétinoïdes "
                    "peuvent être difficiles à tolérer ensemble."
                ),
                recommendation=(
                    "Privilégier une utilisation séparée "
                    "et demander conseil en cas de doute."
                ),
                score_delta=-18,
            )
        )

    if (
        has_pure_vitamin_c
        and (has_aha or has_bha)
    ):
        conflicts.append(
            build_rule(
                rule_type="vitamin_c_exfoliant_load",
                severity="medium",
                ingredients=[
                    "Vitamine C pure",
                    "Acides exfoliants",
                ],
                message=(
                    "La vitamine C pure associée à des acides "
                    "peut augmenter la sensibilisation de certaines peaux."
                ),
                recommendation=(
                    "Introduire progressivement, surtout sur peau sensible."
                ),
                score_delta=-9,
            )
        )

    if (
        has_peptide
        and has_aha
    ):
        conflicts.append(
            build_rule(
                rule_type="peptides_acidic_environment",
                severity="low",
                ingredients=[
                    "Peptides",
                    "AHA",
                ],
                message=(
                    "Certains peptides peuvent être moins intéressants "
                    "dans un environnement très acide."
                ),
                recommendation=(
                    "Ce signal reste modéré et dépend de la formulation réelle."
                ),
                score_delta=-3,
            )
        )

    return {
        "synergies": synergies,
        "conflicts": conflicts,
        "redundancies": redundancies,
    }


def calculate_active_load(
    ingredient_names: List[str],
    ingredients_map: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    active_count = 0
    strong_active_count = 0
    irritating_active_count = 0
    active_details = []

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
            continue

        benefits = ingredient_data.get(
            "official_benefits",
            [],
        )

        risk_level = normalize_tag(
            ingredient_data.get(
                "risk_level",
                "low",
            )
        )

        dose_sensitivity = normalize_tag(
            ingredient_data.get(
                "dose_sensitivity",
                "medium",
            )
        )

        category = normalize_tag(
            ingredient_data.get(
                "category",
                "",
            )
        )

        is_active = bool(benefits)

        if not is_active:
            continue

        active_count += 1

        if dose_sensitivity == "high":
            strong_active_count += 1

        if (
            risk_level == "high"
            or category
            in {
                "exfoliant",
                "retinoid",
                "fragrance",
                "essential_oil",
            }
        ):
            irritating_active_count += 1

        active_details.append({
            "ingredient": (
                ingredient_data.get(
                    "inci_name"
                )
                or raw_name
            ),
            "position": index + 1,
            "risk_level": risk_level,
            "dose_sensitivity":
                dose_sensitivity,
            "category": category,
        })

    if (
        strong_active_count >= 3
        or irritating_active_count >= 3
    ):
        level = "élevée"

    elif (
        strong_active_count >= 1
        or irritating_active_count >= 1
        or active_count >= 5
    ):
        level = "modérée"

    else:
        level = "faible"

    return {
        "level": level,
        "active_count": active_count,
        "strong_active_count":
            strong_active_count,
        "irritating_active_count":
            irritating_active_count,
        "active_details":
            active_details[:15],
    }


def calculate_cumulative_irritation(
    ingredient_names: List[str],
    profile: Dict[str, Any],
    ingredients_map: Dict[str, Dict[str, Any]],
    conflicts: List[Dict[str, Any]],
    redundancies: List[Dict[str, Any]],
) -> int:
    score = 5.0

    sensitivity = normalize_tag(
        profile.get("sensitivity")
    )

    skin_type = normalize_tag(
        profile.get("skin_type")
    )

    concerns = {
        normalize_tag(value)
        for value in profile.get(
            "concerns",
            [],
        )
    }

    normalized_names = {
        normalize_ingredient_name(name)
        for name in ingredient_names
    }

    if contains_any(
        normalized_names,
        FRAGRANCE,
    ):
        score += 10

    if contains_any(
        normalized_names,
        DRYING_ALCOHOLS,
    ):
        score += 14

    if contains_any(
        normalized_names,
        ESSENTIAL_OILS,
    ):
        score += 10

    for raw_name in ingredient_names:
        ingredient_data = (
            ingredients_map.get(
                normalize_ingredient_name(
                    raw_name
                )
            )
        )

        if not ingredient_data:
            continue

        risk_level = normalize_tag(
            ingredient_data.get(
                "risk_level",
                "low",
            )
        )

        avoid_for = {
            normalize_tag(value)
            for value in ingredient_data.get(
                "avoid_for",
                [],
            )
        }

        if risk_level == "high":
            score += 8

        elif risk_level == "medium":
            score += 3

        if (
            sensitivity
            in {
                "moyenne",
                "forte",
                "medium",
                "high",
            }
            and "sensible" in avoid_for
        ):
            score += 6

        if (
            skin_type in {
                "seche",
                "dry",
            }
            and "seche" in avoid_for
        ):
            score += 4

        if (
            "acne" in concerns
            and "acne" in avoid_for
        ):
            score += 4

    for conflict in conflicts:
        severity = conflict.get(
            "severity"
        )

        if severity == "high":
            score += 14

        elif severity == "medium":
            score += 7

        else:
            score += 3

    for redundancy in redundancies:
        severity = redundancy.get(
            "severity"
        )

        if severity == "high":
            score += 8

        elif severity == "medium":
            score += 4

    return clamp_score(score)


def analyze_synergies(
    ingredient_names: List[str],
    profile: Optional[Dict[str, Any]],
    ingredients_map: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    profile = profile or {}

    normalized_names = {
        normalize_ingredient_name(name)
        for name in ingredient_names
        if str(name or "").strip()
    }

    combination_result = (
        analyze_known_combinations(
            normalized_names
        )
    )

    synergies = combination_result[
        "synergies"
    ]

    conflicts = combination_result[
        "conflicts"
    ]

    redundancies = combination_result[
        "redundancies"
    ]

    active_load = calculate_active_load(
        ingredient_names,
        ingredients_map,
    )

    cumulative_irritation = (
        calculate_cumulative_irritation(
            ingredient_names=ingredient_names,
            profile=profile,
            ingredients_map=ingredients_map,
            conflicts=conflicts,
            redundancies=redundancies,
        )
    )

    synergy_bonus = sum(
        max(
            0,
            int(
                synergy.get(
                    "score_delta",
                    0,
                )
            ),
        )
        for synergy in synergies
    )

    conflict_penalty = sum(
        abs(
            min(
                0,
                int(
                    conflict.get(
                        "score_delta",
                        0,
                    )
                ),
            )
        )
        for conflict in conflicts
    )

    redundancy_penalty = sum(
        abs(
            min(
                0,
                int(
                    redundancy.get(
                        "score_delta",
                        0,
                    )
                ),
            )
        )
        for redundancy in redundancies
    )

    balance_score = clamp_score(
        65
        + synergy_bonus
        - conflict_penalty
        - redundancy_penalty
        - cumulative_irritation * 0.20
    )

    if (
        conflicts
        and any(
            conflict.get("severity")
            == "high"
            for conflict in conflicts
        )
    ):
        verdict = "association à surveiller"

    elif cumulative_irritation >= 65:
        verdict = "charge irritante élevée"

    elif synergies and not conflicts:
        verdict = "associations cohérentes"

    elif redundancies:
        verdict = "formule potentiellement redondante"

    else:
        verdict = "équilibre correct"

    return {
        "verdict": verdict,
        "balance_score": balance_score,
        "cumulative_irritation_risk":
            cumulative_irritation,
        "active_load": active_load,
        "synergies": synergies,
        "conflicts": conflicts,
        "redundancies": redundancies,
        "summary": {
            "synergy_count":
                len(synergies),
            "conflict_count":
                len(conflicts),
            "redundancy_count":
                len(redundancies),
        },
    }