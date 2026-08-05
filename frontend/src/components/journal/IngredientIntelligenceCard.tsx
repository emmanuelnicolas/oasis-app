import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  learnings: any;
};

export function IngredientIntelligenceCard({ learnings }: Props) {
  const ingredient = learnings?.ingredient_intelligence || {};

  const positive = ingredient.positive_ingredients || [];
  const watch = ingredient.watch_ingredients || [];
  const correlations = ingredient.correlations || [];

  if (positive.length === 0 && watch.length === 0 && correlations.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ingredient Intelligence</Text>
      <Text style={styles.title}>Ce qu’OASIS apprend</Text>

      {positive.slice(0, 3).map((item: any) => (
        <View key={`positive-${item.ingredient}`} style={styles.row}>
          <Text style={styles.icon}>✔</Text>
          <View style={styles.content}>
            <Text style={styles.name}>{item.ingredient}</Text>
            <Text style={styles.description}>
              Semble bien fonctionner pour votre peau.
            </Text>
          </View>
        </View>
      ))}

      {watch.slice(0, 3).map((item: any) => (
        <View key={`watch-${item.ingredient}`} style={styles.row}>
          <Text style={styles.icon}>⚠</Text>
          <View style={styles.content}>
            <Text style={styles.name}>{item.ingredient}</Text>
            <Text style={styles.description}>
              À surveiller selon vos retours.
            </Text>
          </View>
        </View>
      ))}

      {correlations.slice(0, 3).map((item: any) => (
        <View key={`correlation-${item.ingredient}`} style={styles.row}>
          <Text style={styles.icon}>🧪</Text>
          <View style={styles.content}>
            <Text style={styles.name}>{item.ingredient}</Text>
            <Text style={styles.description}>
              Corrélation détectée dans votre journal.
            </Text>
          </View>
        </View>
      ))}
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
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  icon: {
    fontSize: 16,
    width: 24,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});