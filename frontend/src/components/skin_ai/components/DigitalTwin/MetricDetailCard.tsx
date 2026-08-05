import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  colors,
  radius,
  spacing,
} from "../../../../theme";

import type { OrbMetricKey } from "./OrbMetrics";

type Props = {
  metric: OrbMetricKey;
  value: number;
};

const metricContent: Record<
  OrbMetricKey,
  {
    label: string;
    target: string;
    low: string;
    medium: string;
    good: string;
  }
> = {
  hydration: {
    label: "Hydratation",
    target: "Objectif conseillé : 70 à 80%",
    low: "Votre peau semble manquer d’hydratation. Privilégiez une routine douce avec des humectants et une crème protectrice.",
    medium: "Votre niveau d’hydratation est correct, mais peut encore être stabilisé avec une routine régulière.",
    good: "Votre hydratation est actuellement satisfaisante. Maintenez une routine simple et constante.",
  },

  glow: {
    label: "Éclat",
    target: "Objectif conseillé : 70 à 80%",
    low: "L’éclat semble faible. La régularité de la routine et une bonne hydratation peuvent aider.",
    medium: "Votre peau présente un éclat modéré. Continuez les suivis pour confirmer l’évolution.",
    good: "Votre niveau d’éclat est actuellement satisfaisant.",
  },

  texture: {
    label: "Texture",
    target: "Objectif conseillé : 70 à 80%",
    low: "La texture semble irrégulière. Évitez de multiplier les actifs exfoliants trop rapidement.",
    medium: "La texture est intermédiaire et peut encore progresser avec une routine stable.",
    good: "Votre texture paraît actuellement assez régulière.",
  },

  redness: {
    label: "Rougeurs",
    target: "Objectif conseillé : moins de 20%",
    low: "Les rougeurs semblent faibles. Continuez à protéger la barrière cutanée.",
    medium: "Des rougeurs modérées sont observées. Privilégiez des produits apaisants et limitez les irritants.",
    good: "Le niveau de rougeurs est élevé. Simplifiez temporairement la routine et surveillez les réactions.",
  },
};

function getMessage(
  metric: OrbMetricKey,
  value: number
) {
  const content = metricContent[metric];

  if (metric === "redness") {
    if (value < 20) return content.low;
    if (value < 50) return content.medium;
    return content.good;
  }

  if (value < 40) return content.low;
  if (value < 70) return content.medium;
  return content.good;
}

export function MetricDetailCard({
  metric,
  value,
}: Props) {
  const content = metricContent[metric];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text
          maxFontSizeMultiplier={1.1}
          style={styles.label}
        >
          {content.label}
        </Text>

        <Text
          maxFontSizeMultiplier={1.1}
          style={styles.value}
        >
          {value}%
        </Text>
      </View>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.message}
      >
        {getMessage(metric, value)}
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.target}
      >
        {content.target}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#EEE4DC",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D4C6BA",
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  label: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  value: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  message: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  target: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});