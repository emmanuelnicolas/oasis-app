import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../../theme";

import { useResponsive } from "../../../../hooks/useResponsive";
import { getSkinPriority } from "./SkinPriority";

type Props = {
  insights: string[];
  learnings: any;
};

function toPercent(value: unknown) {
  const numberValue = Number(value || 0);

  return Math.max(
    0,
    Math.min(100, Math.round(numberValue * 10))
  );
}

export function InsightCard({
  insights,
  learnings,
}: Props) {
  const { isPhone } = useResponsive();

  const metrics =
    learnings?.skin_intelligence?.metrics || {};

  const skinEntries = Number(
    learnings?.skin_intelligence?.entry_count || 0
  );

  const priority = getSkinPriority({
    hydration: toPercent(metrics.hydration?.latest),
    glow: toPercent(metrics.glow?.latest),
    texture: toPercent(metrics.texture?.latest),
    redness: toPercent(metrics.redness?.latest),
  });

  const backendInsight = insights.find(
    (item) =>
      typeof item === "string" &&
      item.trim().length > 0
  );

  const priorityInsights = {
    hydration:
      "Votre hydratation semble être le principal axe d’amélioration actuellement.",
    glow:
      "L’éclat est actuellement l’indicateur qui présente la plus grande marge de progression.",
    texture:
      "La régularité de la texture semble être la priorité actuelle de votre peau.",
    redness:
      "Les rougeurs nécessitent actuellement une attention particulière et une routine plus apaisante.",
  };

  let message =
    backendInsight ||
    priorityInsights[priority.key];

  if (skinEntries === 0) {
    message =
      "Ajoutez un premier suivi pour permettre à OASIS d’identifier une tendance fiable.";
  } else if (skinEntries < 3 && !backendInsight) {
    message =
      "OASIS observe encore vos premières données. Quelques suivis supplémentaires permettront de confirmer cette tendance.";
  }

  return (
    <View
      style={[
        styles.card,
        isPhone && styles.cardPhone,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.1}
        style={styles.eyebrow}
      >
        INSIGHT PRINCIPAL
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={[
          styles.message,
          isPhone && styles.messagePhone,
        ]}
      >
        {message}
      </Text>

      {skinEntries >= 3 ? (
        <Text
          maxFontSizeMultiplier={1.15}
          style={styles.basis}
        >
          Priorité détectée : {priority.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 150,
    backgroundColor: "#F1E9E2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
  },

  message: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  basis: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  cardPhone: {
    minHeight: 0,
    padding: spacing.md,
  },

  messagePhone: {
    fontSize: 15,
    lineHeight: 21,
  },
});