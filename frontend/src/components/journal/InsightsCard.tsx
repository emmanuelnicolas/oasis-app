import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../theme";

type Props = {
  insights: (string | null)[];
};

export function InsightsCard({ insights }: Props) {
  const visibleInsights = insights.filter(Boolean).slice(0, 3);

  if (visibleInsights.length === 0) return null;

  return (
    <View style={styles.insightsCard}>
      <Text style={styles.insightsTitle}>✨ Observations OASIS</Text>

      {visibleInsights.map((item, index) => (
        <Text key={index} style={styles.insightText}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  insightsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightsTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  insightText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
});