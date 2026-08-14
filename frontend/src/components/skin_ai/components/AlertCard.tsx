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
  level?: "info" | "warning";
  title?: string;
  message?: string;
  onPress?: () => void;
};

export function AlertCard({
  level = "info",
  title = "Alerte douce",
  message = "Aucune alerte particulière détectée aujourd’hui.",
  onPress,
}: Props) {
  const isWarning =
    level === "warning";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.iconBubble}>
  <Ionicons
    name={
      isWarning
        ? "warning-outline"
        : "notifications-outline"
    }
    size={20}
    color={colors.textPrimary}
  />
</View>

      <View style={styles.textContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {isWarning
              ? "À SURVEILLER"
              : "ALERTE DOUCE"}
          </Text>

          <View
            style={[
              styles.statusDot,
              isWarning &&
                styles.statusDotWarning,
            ]}
          />
        </View>

        <Text
          numberOfLines={1}
          style={styles.title}
        >
          {title}
        </Text>

        <Text style={styles.message}>
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
    minHeight: 118,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFE6DE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D4C6BA",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  cardPressed: {
    opacity: 0.74,
  },

  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F1EC",
    marginRight: spacing.md,
  },

  textContent: {
  flex: 1,
  minWidth: 0,
},

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: spacing.sm,
    backgroundColor: "#8D9A84",
  },

  statusDotWarning: {
    backgroundColor: "#B98268",
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: 3,
  },

message: {
  fontSize: 13,
  lineHeight: 18,
  color: colors.textSecondary,
  flexShrink: 1,
},

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
    backgroundColor: "#F7F1EC",
    borderWidth: 1,
    borderColor: "#DED2C8",
  },
});