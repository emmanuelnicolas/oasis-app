import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../theme";

type Props = {
  pendingFeedback: any[];
  onSubmit: (item: any, result: string) => void;
};

export function FeedbackCard({ pendingFeedback, onSubmit }: Props) {
  if (pendingFeedback.length === 0) return null;

  const item = pendingFeedback[0];

  return (
    <View style={styles.feedbackCard}>
      <Text style={styles.feedbackTitle}>✨ OASIS souhaite votre retour</Text>

      <Text style={styles.feedbackText}>
        Vous utilisez {item.product_name} depuis {item.days_used} jours.
      </Text>

      <View style={styles.feedbackButtons}>
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => onSubmit(item, "improved")}
        >
          <Text>👍 Amélioration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => onSubmit(item, "stable")}
        >
          <Text>➖ Stable</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => onSubmit(item, "worse")}
        >
          <Text>👎 Aggravation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  feedbackText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
});