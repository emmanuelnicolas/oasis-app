import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  learnings: any;
};

export function TodayCard({ learnings }: Props) {
  const trend = learnings?.skin_intelligence?.trend;

  let title = "Votre peau est en observation";
  let subtitle =
    "Continuez votre journal pour permettre à OASIS de détecter des tendances.";

  if (trend === "improving") {
    title = "Votre peau évolue positivement";
    subtitle =
      "Continuez votre routine actuelle, elle semble bien fonctionner.";
  }

  if (trend === "stable") {
    title = "Votre peau est stable";
    subtitle =
      "Aucun changement important détecté récemment.";
  }

  if (trend === "worsening") {
    title = "Votre peau semble plus sensible";
    subtitle =
      "Essayez de limiter les changements de routine pendant quelques jours.";
  }

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>🌞 Aujourd'hui</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
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
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  subtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});