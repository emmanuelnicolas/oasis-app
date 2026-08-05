from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


ONE_PERCENT_MARKERS = {
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


def normalize_claim(value: str) -> str:
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
        r"[^a-z0-9\s-]",
        " ",
        normalized,
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


def find_one_percent_line(
    ingredient_names: List[str],
) -> Optional[int]:
    for index, ingredient_name in enumerate(
        ingredient_names
    ):
        normalized = normalize_ingredient_name(
            ingredient_name
        )

        if normalized in ONE_PERCENT_MARKERS:
            return index

    return None


def get_position_strength(
    index: int,
    one_percent_index: Optional[int],
    effective_at_low_dose: bool,
) -> str:
    if (
        one_percent_index is not None
        and index > one_percent_index
    ):
        if effective_at_low_dose:
            return "faible_mais_pertinent"

        return "probablement_faible"

    if index <= 4:
        return "fort"

    if index <= 9:
        return "modere"

    return "incertain"


def get_claim_keywords(
    claim: str,
) -> set[str]:
    normalized = normalize_claim(claim)

    mapping = {
        "hydratation": {
            "hydratation",
            "hydrate",
            "hydrater",
            "deshydratation",
            "humectant",
        },
        "barriere": {
            "barriere",
            "reparation",
            "reparer",
            "ceramides",
            "apaisant",
        },
        "acne": {
            "acne",
            "boutons",
            "imperfections",
            "comedons",
        },
        "eclat": {
            "eclat",
            "glow",
            "luminosite",
            "terne",
        },
        "taches": {
            "taches",
            "hyperpigmentation",
            "uniformite",
            "teint",
        },
        "rides": {
            "rides",
            "anti age",
            "anti-age",
            "fermete",
            "elasticite",
        },
        "pores": {
            "pores",
            "grain de peau",
            "texture",
        },
        "rougeurs": {
            "rougeurs",
            "sensibilite",
            "apaisant",
        },
        "exfoliation": {
            "exfoliation",
            "peeling",
            "cellules mortes",
        },
    }

    matched = set()

    for category, keywords in mapping.items():
        if any(
            keyword in normalized
            for keyword in keywords
        ):
            matched.add(category)

    return matched


def ingredient_supports_claim(
    ingredient_data: Dict[str, Any],
    claim_categories: set[str],
) -> bool:
    benefits = {
        normalize_claim(benefit)
        for benefit in ingredient_data.get(
            "official_benefits",
            [],
        )
        if benefit
    }

    aliases = {
        "hydratation": {
            "hydratation",
            "deshydratation",
            "humectant",
            "hydrating",
            "moisturizing",
        },
        "barriere": {
            "barriere",
            "repair",
            "reparation",
            "soothing",
            "apaisant",
        },
        "acne": {
            "acne",
            "boutons",
            "imperfections",
        },
        "eclat": {
            "eclat",
            "antioxydant",
            "brightening",
        },
        "taches": {
            "taches",
            "hyperpigmentation",
            "brightening",
        },
        "rides": {
            "rides",
            "anti age",
            "anti-age",
            "firming",
        },
        "pores": {
            "pores",
            "texture",
            "exfoliant",
        },
        "rougeurs": {
            "rougeurs",
            "apaisant",
            "soothing",
        },
        "exfoliation": {
            "exfoliant",
            "exfoliation",
            "aha",
            "bha",
        },
    }

    for category in claim_categories:
        if benefits & aliases.get(
            category,
            set(),
        ):
            return True

    return False


def analyze_marketing_claims(
    ingredient_names: List[str],
    ingredients_map: Dict[
        str,
        Dict[str, Any],
    ],
    claims: Optional[List[str]] = None,
) -> Dict[str, Any]:
    claims = [
        claim
        for claim in (claims or [])
        if str(claim or "").strip()
    ]

    one_percent_index = (
        find_one_percent_line(
            ingredient_names
        )
    )

    active_evidence = []
    marketing_flags = []
    supported_claims = []
    weak_claims = []

    matched_ingredients = 0
    recognized_actives = 0

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

        matched_ingredients += 1

        benefits = ingredient_data.get(
            "official_benefits",
            [],
        )

        if not benefits:
            continue

        recognized_actives += 1

        effective_at_low_dose = bool(
            ingredient_data.get(
                "effective_at_low_dose",
                False,
            )
        )

        dose_sensitivity = str(
            ingredient_data.get(
                "dose_sensitivity",
                "medium",
            )
        )

        position_strength = (
            get_position_strength(
                index,
                one_percent_index,
                effective_at_low_dose,
            )
        )

        evidence = {
            "ingredient": (
                ingredient_data.get(
                    "inci_name"
                )
                or raw_name
            ),
            "position": index + 1,
            "benefits": benefits,
            "dose_sensitivity":
                dose_sensitivity,
            "effective_at_low_dose":
                effective_at_low_dose,
            "position_strength":
                position_strength,
        }

        active_evidence.append(evidence)

        if (
            position_strength
            == "probablement_faible"
        ):
            severity = (
                "high"
                if dose_sensitivity == "high"
                else "medium"
            )

            marketing_flags.append({
                "ingredient":
                    evidence["ingredient"],
                "position": index + 1,
                "severity": severity,
                "type":
                    "possible_under_dosing",
                "message": (
                    f"{evidence['ingredient']} apparaît "
                    "après un marqueur proche de 1 %. "
                    "Sa concentration est probablement faible."
                ),
            })

        elif (
            position_strength
            == "faible_mais_pertinent"
        ):
            marketing_flags.append({
                "ingredient":
                    evidence["ingredient"],
                "position": index + 1,
                "severity": "low",
                "type":
                    "low_dose_but_relevant",
                "message": (
                    f"{evidence['ingredient']} apparaît bas "
                    "dans la liste, mais peut rester pertinent "
                    "à faible dose."
                ),
            })

    for claim in claims:
        claim_categories = (
            get_claim_keywords(claim)
        )

        supporting_ingredients = []

        for evidence in active_evidence:
            ingredient_data = (
                ingredients_map.get(
                    normalize_ingredient_name(
                        evidence["ingredient"]
                    )
                )
            )

            if not ingredient_data:
                continue

            if ingredient_supports_claim(
                ingredient_data,
                claim_categories,
            ):
                supporting_ingredients.append(
                    evidence
                )

        strong_support = [
            evidence
            for evidence
            in supporting_ingredients
            if evidence[
                "position_strength"
            ]
            in {
                "fort",
                "modere",
                "faible_mais_pertinent",
            }
        ]

        weak_support = [
            evidence
            for evidence
            in supporting_ingredients
            if evidence[
                "position_strength"
            ]
            in {
                "probablement_faible",
                "incertain",
            }
        ]

        if strong_support:
            supported_claims.append({
                "claim": claim,
                "status": "supported",
                "confidence": clamp_score(
                    55
                    + len(
                        strong_support
                    ) * 12
                ),
                "supporting_ingredients": [
                    evidence["ingredient"]
                    for evidence
                    in strong_support[:5]
                ],
            })

        elif weak_support:
            weak_claims.append({
                "claim": claim,
                "status": "weakly_supported",
                "confidence": 40,
                "supporting_ingredients": [
                    evidence["ingredient"]
                    for evidence
                    in weak_support[:5]
                ],
                "reason": (
                    "Les actifs associés semblent "
                    "placés bas ou leur concentration "
                    "reste incertaine."
                ),
            })

        else:
            weak_claims.append({
                "claim": claim,
                "status": "unsupported",
                "confidence": 20,
                "supporting_ingredients": [],
                "reason": (
                    "Aucun ingrédient clairement associé "
                    "à cette promesse n'a été identifié."
                ),
            })

    total_ingredients = len(
        ingredient_names
    )

    database_coverage = (
        matched_ingredients
        / total_ingredients
        if total_ingredients > 0
        else 0
    )

    high_flags = sum(
        1
        for flag in marketing_flags
        if flag.get("severity") == "high"
    )

    medium_flags = sum(
        1
        for flag in marketing_flags
        if flag.get("severity") == "medium"
    )

    integrity_score = clamp_score(
        100
        - high_flags * 18
        - medium_flags * 9
    )

    if claims:
        claim_support_ratio = (
            len(supported_claims)
            / len(claims)
        )
    else:
        claim_support_ratio = 0.5

    marketing_confidence = clamp_score(
        database_coverage * 45
        + claim_support_ratio * 35
        + integrity_score * 0.20
    )

    if (
        high_flags > 0
        or any(
            claim.get("status")
            == "unsupported"
            for claim in weak_claims
        )
    ):
        verdict = "promesses à nuancer"

    elif weak_claims:
        verdict = "promesses partiellement cohérentes"

    elif claims and supported_claims:
        verdict = "promesses cohérentes"

    else:
        verdict = "analyse marketing limitée"

    return {
        "verdict": verdict,
        "marketing_confidence":
            marketing_confidence,
        "ingredient_integrity_score":
            integrity_score,
        "database_coverage": round(
            database_coverage,
            3,
        ),
        "one_percent_line_index": (
            one_percent_index + 1
            if one_percent_index
            is not None
            else None
        ),
        "recognized_actives":
            recognized_actives,
        "supported_claims":
            supported_claims,
        "weak_claims":
            weak_claims,
        "active_evidence":
            active_evidence[:15],
        "marketing_flags":
            marketing_flags[:10],
    }