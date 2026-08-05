import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  entries: any[];
};

export function SkinChartsCard({ entries }: Props) {
  if (!entries || entries.length < 2) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Graphiques</Text>
      <Text style={styles.title}>Evolution des derniers suivis</Text>
      <Text style={styles.subtitle}>
        Les courbes détaillées arrivent bientôt. Pour l’instant, OASIS analyse déjà vos tendances.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 20, color: colors.textPrimary, fontFamily: fonts.heading, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});