import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../../theme";

type Props = {
  learnings: any;
};

export function DiscoveriesCard({ learnings }: Props) {
  const ingredient = learnings?.ingredient_intelligence || {};

  const positives = ingredient.positive_ingredients || [];
  const watch = ingredient.watch_ingredients || [];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>DÉCOUVERTES</Text>

      <Text style={styles.title}>
        Ce qu'OASIS apprend
      </Text>

      {positives.slice(0, 3).map((item: any) => (
        <View key={item.ingredient} style={styles.row}>
          <Text style={styles.icon}>✓</Text>

          <View style={styles.content}>
            <Text style={styles.name}>{item.ingredient}</Text>
            <Text style={styles.description}>
              Semble bénéfique pour votre peau.
            </Text>
          </View>
        </View>
      ))}

      {watch.slice(0, 2).map((item: any) => (
        <View key={item.ingredient} style={styles.row}>
          <Text style={styles.warning}>⚠</Text>

          <View style={styles.content}>
            <Text style={styles.name}>{item.ingredient}</Text>
            <Text style={styles.description}>
              À surveiller selon vos retours.
            </Text>
          </View>
        </View>
      ))}

      {positives.length === 0 && watch.length === 0 && (
        <Text style={styles.empty}>
          Continuez votre journal pour permettre à OASIS de détecter vos premiers ingrédients clés.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },

  icon: {
    fontSize: 18,
    color: "#4E7A58",
    marginRight: spacing.md,
  },

  warning: {
    fontSize: 18,
    marginRight: spacing.md,
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },

  description: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  empty: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});