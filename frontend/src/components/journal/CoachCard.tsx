import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  insights: string[];
};

export function CoachCard({ insights }: Props) {
  const hasInsight = insights?.length > 0;

  const message = hasInsight
    ? insights[0]
    : "Bienvenue dans votre suivi personnalisé.";

  const description = hasInsight
    ? "OASIS ajuste ses conseils à partir de votre journal, de vos produits et de vos retours."
    : "Ajoutez quelques suivis peau et retours produits. OASIS commencera ensuite à détecter ce qui fonctionne vraiment pour vous.";

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>🧠 Coach OASIS</Text>

      <Text style={styles.message}>{message}</Text>

      <Text style={styles.description}>{description}</Text>
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
  badge: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 22,
    lineHeight: 32,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});