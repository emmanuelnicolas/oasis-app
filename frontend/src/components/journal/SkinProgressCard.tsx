import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  learnings: any;
};

const LABELS: any = {
  hydration: "Hydratation",
  glow: "Glow",
  texture: "Texture",
  irritation: "Irritation",
  breakouts: "Boutons",
  redness: "Rougeurs",
};

export function SkinProgressCard({ learnings }: Props) {
  const skin = learnings?.skin_intelligence || {};
  const metrics = skin.metrics || {};
  const keys = Object.keys(metrics);

  if (keys.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Evolution peau</Text>
      <Text style={styles.title}>Votre progression</Text>

      {keys.map((key) => {
        const item = metrics[key];
        const delta = item?.delta || 0;
        const symbol = delta > 0 ? "+" : "";

        return (
          <View key={key} style={styles.row}>
            <Text style={styles.name}>{LABELS[key] || key}</Text>
            <Text style={styles.value}>
              {item.latest}/10 · {symbol}{delta}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  name: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});