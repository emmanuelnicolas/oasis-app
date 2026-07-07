import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";

type Props = {
  onPress: () => void;
};

export function ScanCard({ onPress }: Props) {
  return (
    <TouchableOpacity
      testID="home-scan-product-btn"
      style={styles.scanCard}
      onPress={onPress}
    >
      <View style={styles.scanIcon}>
        <Ionicons name="scan-outline" size={22} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.scanTitle}>Scanner un produit ✨</Text>
        <Text style={styles.scanDesc}>
          Analyse IA des ingrédients selon votre profil peau.
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  scanDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
});