import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { radius, spacing } from "../../theme";

export function HeroCard() {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroTitle}>Votre peau évolue chaque jour ✨</Text>

      <Text style={styles.heroText}>
        OASIS analyse vos produits, suit votre routine et personnalise vos recommandations skincare.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 22,
    marginBottom: spacing.lg,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },

  heroText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 22,
  },
});