import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";
import type { SeasonalTip } from "../../types/routine";

type Props = {
  tip: SeasonalTip | null;
};

export function TipCard({ tip }: Props) {
  if (!tip) return null;

  return (
    <View style={styles.tipCard} testID="seasonal-tip">
      <View style={styles.tipHeader}>
        <Ionicons name="sparkles" size={16} color={colors.secondary} />
        <Text style={styles.tipLabel}>Conseil · {tip.season}</Text>
      </View>

      <Text style={styles.tipText}>{tip.tip_of_day}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tipCard: {
    backgroundColor: "rgba(194,141,117,0.1)",
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(194,141,117,0.3)",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: 6,
  },
  tipLabel: {
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  tipText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});