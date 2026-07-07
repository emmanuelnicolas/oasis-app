import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme";
import type { Routine, TrackingCompleted } from "../../types/routine";

type Props = {
  focusRoutine: Routine | undefined;
  focusType: string;
  tracking: TrackingCompleted;
  completedCount: number;
  totalSteps: number;
  onToggleStep: (routineType: string, order: number) => void;
};

export function RoutineCard({
  focusRoutine,
  focusType,
  tracking,
  completedCount,
  totalSteps,
  onToggleStep,
}: Props) {
  if (!focusRoutine) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Aucune routine encore. Allez dans l'onglet Routines pour générer.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.routineCard} testID={`focus-routine-${focusType}`}>
      <Text style={styles.routineMoment}>Routine du {focusType}</Text>

      <Text style={styles.routineTitle}>{focusRoutine.title}</Text>

      <Text style={styles.routineDesc}>{focusRoutine.description}</Text>

      <Text style={styles.progressText}>
        {completedCount}/{totalSteps} étapes réalisées aujourd'hui
      </Text>

      {focusRoutine.steps.map((step) => {
        const key = `${focusType}_${step.order}`;
        const done = !!tracking[key];

        return (
          <TouchableOpacity
            key={step.order}
            testID={`step-${focusType}-${step.order}`}
            style={[styles.stepRow, done && styles.stepRowDone]}
            onPress={() => onToggleStep(focusType, step.order)}
          >
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
              {done && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.stepName, done && styles.stepNameDone]}>
                {step.name}
              </Text>

              <Text style={styles.stepProduct}>{step.product_type}</Text>

              <Text style={styles.stepInstructions}>{step.instructions}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  routineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routineMoment: {
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: "600",
  },
  routineTitle: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontWeight: "400",
  },
  routineDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  progressText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    alignItems: "flex-start",
  },
  stepRowDone: {
    opacity: 0.65,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  stepNameDone: {
    textDecorationLine: "line-through",
  },
  stepProduct: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stepInstructions: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});