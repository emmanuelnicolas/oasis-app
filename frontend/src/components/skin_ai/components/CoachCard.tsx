import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

type Props = {
  insights: string[];
  onPress?: () => void;
};

export function CoachCard({
  insights,
  onPress,
}: Props) {
  const message =
    insights?.[0] ||
    "OASIS commence à construire votre profil peau personnalisé.";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voir le conseil OASIS"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.textContent}>
        <Text style={styles.eyebrow}>
          INSIGHT DU MOMENT
        </Text>

        <Text
          numberOfLines={3}
          style={styles.message}
        >
          {message}
        </Text>
      </View>

      <View style={styles.arrowButton}>
        <Ionicons
          name="arrow-forward"
          size={20}
          color={colors.textPrimary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  cardPressed: {
    opacity: 0.74,
  },

  textContent: {
    flex: 1,
    paddingRight: spacing.md,
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.xs,
  },

  message: {
    fontSize: 17,
    lineHeight: 23,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EAE4",
    borderWidth: 1,
    borderColor: "#DED2C8",
  },
});