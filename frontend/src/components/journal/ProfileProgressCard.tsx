import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  learnings: any;
};

export function ProfileProgressCard({ learnings }: Props) {
  const summary = learnings?.learning_summary || {};
  const skin = learnings?.skin_intelligence || {};
  const ingredient = learnings?.ingredient_intelligence || {};

  const totalFeedbacks = summary.total_feedbacks || 0;
  const skinEntries = skin.entry_count || 0;
  const signals =
    (ingredient.positive_ingredients || []).length +
    (ingredient.watch_ingredients || []).length +
    (ingredient.correlations || []).length;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Profil OASIS</Text>
      <Text style={styles.title}>Votre modèle personnalisé</Text>

      <Text style={styles.item}>✓ {skinEntries}/7 suivis peau</Text>
      <Text style={styles.item}>✓ {totalFeedbacks}/5 retours produits</Text>
      <Text style={styles.item}>✓ {signals} signaux ingrédients</Text>

      <Text style={styles.hint}>
        Ces données permettent à OASIS d’affiner votre profil progressivement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 20, color: colors.textPrimary, fontFamily: fonts.heading, marginBottom: spacing.md },
  item: { fontSize: 14, color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: spacing.sm },
});