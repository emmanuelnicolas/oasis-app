import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

import type {
  RoutineItem,
  RoutinePeriod,
} from "./RoutineCard";

type Props = {
  morningItems?: RoutineItem[];
  eveningItems?: RoutineItem[];
  weeklyItems?: RoutineItem[];

  onToggleStep?: (
    period: RoutinePeriod,
    order: number
  ) => void | Promise<void>;

  onOpenDetails?: () => void;
};

type PeriodRowProps = {
  period: RoutinePeriod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: RoutineItem[];

  onToggleStep?: (
    period: RoutinePeriod,
    order: number
  ) => void | Promise<void>;
};

function PeriodRow({
  period,
  label,
  icon,
  items,
  onToggleStep,
}: PeriodRowProps) {
  const completedCount = items.filter(
    (item) => item.completed
  ).length;

  const totalCount = items.length;

  const percentage =
    totalCount > 0
      ? Math.round(
          (completedCount / totalCount) * 100
        )
      : 0;

  return (
    <View style={styles.periodRow}>
      <View style={styles.periodHeader}>
        <View style={styles.periodIdentity}>
          <View style={styles.periodIcon}>
            <Ionicons
              name={icon}
              size={18}
              color={colors.textPrimary}
            />
          </View>

          <View>
            <Text style={styles.periodLabel}>
              {label}
            </Text>

            <Text style={styles.periodProgress}>
              {completedCount}/{totalCount} étape
              {totalCount > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.periodPercent}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.timeline}>
        {items.map((item, index) => {
          const isLast =
            index === items.length - 1;

          return (
            <Pressable
              key={`${period}-${item.order}`}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: Boolean(item.completed),
              }}
              accessibilityLabel={`${item.label}, ${
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
              style={({ pressed }) => [
                styles.timelineItem,
                pressed &&
                  styles.timelineItemPressed,
              ]}
            >
              <View style={styles.timelineMarker}>
                <View
                  style={[
                    styles.timelineDot,
                    item.completed &&
                      styles.timelineDotCompleted,
                  ]}
                >
                  {item.completed ? (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color="#FFFFFF"
                    />
                  ) : (
                    <View
                      style={
                        styles.timelineDotInner
                      }
                    />
                  )}
                </View>

                {!isLast ? (
                  <View
                    style={[
                      styles.timelineLine,
                      item.completed &&
                        styles.timelineLineCompleted,
                    ]}
                  />
                ) : null}
              </View>

              <View style={styles.stepContent}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.stepLabel,
                    item.completed &&
                      styles.stepLabelCompleted,
                  ]}
                >
                  {item.label}
                </Text>

                {item.productName ? (
                  <Text
                    numberOfLines={2}
                    style={styles.stepDescription}
                  >
                    {item.productName}
                  </Text>
                ) : null}
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color="#A99C92"
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DailyRoutineSummary({
  morningItems = [],
  eveningItems = [],
  weeklyItems = [],
  onToggleStep,
  onOpenDetails,
}: Props) {
  const hasDailyRoutine =
    morningItems.length > 0 ||
    eveningItems.length > 0;

  if (!hasDailyRoutine) {
    return null;
  }

  const weeklyRemaining =
    weeklyItems.filter(
      (item) => !item.completed
    ).length;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir la routine complète"
        onPress={onOpenDetails}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <View>
          <Text style={styles.eyebrow}>
            ROUTINE DU JOUR
          </Text>

          <Text style={styles.title}>
            Vos soins essentiels
          </Text>
        </View>

        <View style={styles.arrowButton}>
          <Ionicons
            name="arrow-forward"
            size={19}
            color={colors.textPrimary}
          />
        </View>
      </Pressable>

      {morningItems.length > 0 ? (
        <PeriodRow
          period="matin"
          label="Matin"
          icon="sunny-outline"
          items={morningItems}
          onToggleStep={onToggleStep}
        />
      ) : null}

      {eveningItems.length > 0 ? (
        <PeriodRow
          period="soir"
          label="Soir"
          icon="moon-outline"
          items={eveningItems}
          onToggleStep={onToggleStep}
        />
      ) : null}

      {weeklyItems.length > 0 ? (
        <View style={styles.weeklyLine}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.weeklyText}>
            {weeklyRemaining > 0
              ? `${weeklyRemaining} soin${
                  weeklyRemaining > 1
                    ? "s"
                    : ""
                } hebdomadaire${
                  weeklyRemaining > 1
                    ? "s"
                    : ""
                } restant${
                  weeklyRemaining > 1
                    ? "s"
                    : ""
                }`
              : "Soins hebdomadaires terminés"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  headerPressed: {
    opacity: 0.7,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  title: {
    fontSize: 19,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EAE4",
    borderWidth: 1,
    borderColor: "#DED2C8",
  },

  periodRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E0D6CE",
  },

  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  periodIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },

  periodIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    backgroundColor: "#EFE7E0",
  },

  periodLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  periodProgress: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  periodPercent: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  timeline: {
    paddingLeft: 4,
  },

  timelineItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  timelineItemPressed: {
    opacity: 0.65,
  },

  timelineMarker: {
    width: 30,
    alignItems: "center",
    alignSelf: "stretch",
  },

  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3EE",
    borderWidth: 1.5,
    borderColor: "#B8AAA0",
    zIndex: 2,
  },

  timelineDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },

  timelineLine: {
    position: "absolute",
    top: 22,
    bottom: -1,
    width: 1.5,
    backgroundColor: "#DDD2CA",
  },

  timelineLineCompleted: {
    backgroundColor: colors.primary,
  },

  stepContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingBottom: spacing.md,
  },

  stepLabel: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  stepLabelCompleted: {
    opacity: 0.6,
  },

  stepDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2,
  },

  weeklyLine: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0D6CE",
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },

  weeklyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});