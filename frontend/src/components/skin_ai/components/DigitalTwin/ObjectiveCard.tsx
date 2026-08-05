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
  learnings: any;
};

function toPercent(value: unknown) {
  const numberValue = Number(value || 0);

  return Math.max(
    0,
    Math.min(100, Math.round(numberValue * 10))
  );
}

export function ObjectiveCard({ learnings }: Props) {
  const { isPhone } = useResponsive();

  const metrics =
    learnings?.skin_intelligence?.metrics || {};

  const hydration = toPercent(
    metrics.hydration?.latest
  );

  const glow = toPercent(
    metrics.glow?.latest
  );

  const texture = toPercent(
    metrics.texture?.latest
  );

  const redness = toPercent(
    metrics.redness?.latest
  );

  const priority = getSkinPriority({
    hydration,
    glow,
    texture,
    redness,
  });

  const displayedValue = priority.value;

  const targetText =
    priority.key === "redness"
      ? `Objectif recommandé : moins de ${priority.target}%`
      : `Objectif recommandé : ${priority.target}%`;

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
        OBJECTIF PRIORITAIRE
      </Text>

      <View style={styles.header}>
        <Text
          maxFontSizeMultiplier={1.15}
          style={[
            styles.title,
            isPhone && styles.titlePhone,
          ]}
        >
          {priority.label}
        </Text>

        <Text
          maxFontSizeMultiplier={1.1}
          style={styles.value}
        >
          {displayedValue}%
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${priority.progress}%`,
            },
          ]}
        />
      </View>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.target}
      >
        {targetText}
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.message}
      >
        {priority.message}
      </Text>
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  title: {
    flex: 1,
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginRight: spacing.sm,
  },

  value: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  track: {
    height: 8,
    backgroundColor: "#E1D6CD",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },

  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  target: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  message: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  cardPhone: {
    minHeight: 0,
    padding: spacing.md,
  },

  titlePhone: {
    fontSize: 16,
    lineHeight: 21,
  },
});