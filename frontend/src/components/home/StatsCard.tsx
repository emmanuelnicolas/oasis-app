import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";
import type { TrackingStats } from "../../types/routine";

type Props = {
  stats: TrackingStats | null;
};

export function StatsCard({ stats }: Props) {
  if (!stats) return null;

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.streak}</Text>
        <Text style={styles.statLabel}>Jours d'affilée</Text>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.total_days}</Text>
        <Text style={styles.statLabel}>Jours suivis</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statValue: {
    fontSize: 26,
    color: colors.primary,
    fontFamily: fonts.heading,
    fontWeight: "500",
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
});