import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../../../theme";

type Props = {
  level?: "info" | "warning";
  title?: string;
  message?: string;
};

export function AlertCard({
  level = "info",
  title = "Alerte douce",
  message = "Aucune alerte particulière détectée aujourd’hui.",
}: Props) {
  const isWarning = level === "warning";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          {isWarning ? "À SURVEILLER" : "ALERTE DOUCE"}
        </Text>

        <View
          style={[
            styles.statusDot,
            isWarning && styles.statusDotWarning,
          ]}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EFE6DE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D4C6BA",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8D9A84",
  },

  statusDotWarning: {
    backgroundColor: "#B98268",
  },

  title: {
    fontSize: 20,
    lineHeight: 27,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});