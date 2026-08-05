import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../theme";


type Props = {
  entries: any[];
};


export function TimelineCard({
  entries,
}: Props) {
  if (
    !entries ||
    entries.length === 0
  ) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        Historique peau
      </Text>

      <Text style={styles.title}>
        Vos derniers suivis
      </Text>

      <Text style={styles.subtitle}>
        {entries.length} suivi
        {entries.length > 1
          ? "s"
          : ""}{" "}
        enregistré
        {entries.length > 1
          ? "s"
          : ""}
        .
      </Text>
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
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});