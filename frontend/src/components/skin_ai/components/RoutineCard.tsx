import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

import { useResponsive } from "../../../hooks/useResponsive";

export type RoutinePeriod =
  | "matin"
  | "soir"
  | "hebdo";

export type RoutineItem = {
  order: number;
  label: string;
  productName: string;
  completed?: boolean;
};

type Props = {
  period?: RoutinePeriod;
  items?: RoutineItem[];
  onToggleStep?: (
    period: RoutinePeriod,
    order: number
  ) => void | Promise<void>;
};

const DEFAULT_ITEMS: RoutineItem[] = [
  {
    order: 1,
    label: "Nettoyant",
    productName: "Ajoutez votre produit",
    completed: false,
  },
  {
    order: 2,
    label: "Sérum",
    productName: "Ajoutez votre produit",
    completed: false,
  },
  {
    order: 3,
    label: "Hydratant",
    productName: "Ajoutez votre produit",
    completed: false,
  },
];

function getRoutineTitle(
  period: RoutinePeriod
) {
  if (period === "soir") {
    return "Routine du soir";
  }

  if (period === "hebdo") {
    return "Routine de la semaine";
  }

  return "Routine du matin";
}

function getRoutineEyebrow(
  period: RoutinePeriod
) {
  if (period === "hebdo") {
    return "SOINS HEBDOMADAIRES";
  }

  return "ROUTINE QUOTIDIENNE";
}

export function RoutineCard({
  period = "matin",
  items = DEFAULT_ITEMS,
  onToggleStep,
}: Props) {
  const { isPhone } = useResponsive();

  const completedCount = items.filter(
    (item) => item.completed
  ).length;

  const progress =
    items.length > 0
      ? Math.round(
          (completedCount / items.length) *
            100
        )
      : 0;

  const title = getRoutineTitle(period);
  const eyebrow =
    getRoutineEyebrow(period);

  return (
    <View
      style={[
        styles.card,
        period === "hebdo" &&
          styles.weeklyCard,
        isPhone && styles.cardPhone,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={styles.eyebrow}
          >
            {eyebrow}
          </Text>

          <Text
            maxFontSizeMultiplier={1.15}
            style={[
              styles.title,
              isPhone && styles.titlePhone,
            ]}
          >
            {title}
          </Text>

          {period === "hebdo" ? (
            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.weeklyDescription}
            >
              À réaliser une ou plusieurs
              fois selon votre routine.
            </Text>
          ) : null}
        </View>

        <Text
          maxFontSizeMultiplier={1.1}
          style={styles.progressValue}
        >
          {progress}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            period === "hebdo" &&
              styles.weeklyProgressFill,
            {
              width:
                progress > 0
                  ? `${progress}%`
                  : "0%",
            },
          ]}
        />
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View
            key={`${period}-${item.order}`}
            style={[
              styles.row,
              isPhone && styles.rowPhone,
              index > 0 && styles.rowBorder,
            ]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: Boolean(
                  item.completed
                ),
              }}
              accessibilityLabel={`${
                item.label
              } ${
                item.completed
                  ? "terminé"
                  : "non terminé"
              }`}
              onPress={() =>
                onToggleStep?.(
                  period,
                  item.order
                )
              }
              hitSlop={8}
              style={({ pressed }) => [
                styles.checkbox,
                item.completed &&
                  styles.checkboxCompleted,
                period === "hebdo" &&
                  item.completed &&
                  styles.weeklyCheckboxCompleted,
                pressed &&
                  styles.checkboxPressed,
              ]}
            >
              {item.completed ? (
                <Text
                  style={styles.checkmark}
                >
                  ✓
                </Text>
              ) : null}
            </Pressable>

            <View style={styles.rowContent}>
              <Text
                maxFontSizeMultiplier={1.15}
                style={styles.stepLabel}
              >
                {item.label}
              </Text>

              <Text
                maxFontSizeMultiplier={1.15}
                style={styles.productName}
              >
                {item.productName}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  weeklyCard: {
    backgroundColor: "#F4F0E8",
    borderColor: "#CEC4B4",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },

  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  weeklyDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  progressValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  progressTrack: {
    height: 8,
    backgroundColor: "#E5DCD4",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.md,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  weeklyProgressFill: {
    backgroundColor: "#8C7965",
  },

  list: {
    borderTopWidth: 1,
    borderTopColor: "#DED3CA",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#DED3CA",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B9A99C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  checkboxCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  weeklyCheckboxCompleted: {
    backgroundColor: "#8C7965",
    borderColor: "#8C7965",
  },

  checkboxPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.92 }],
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  rowContent: {
    flex: 1,
  },

  stepLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },

  productName: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  cardPhone: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  titlePhone: {
    fontSize: 19,
    lineHeight: 24,
  },

  rowPhone: {
    paddingVertical: spacing.sm,
  },
});