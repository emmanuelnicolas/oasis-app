import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  level?: "info" | "warning";
  title?: string;
  message?: string;
};

export function AlertDetailModal({
  visible,
  onClose,
  level = "info",
  title = "Alerte douce",
  message = "Aucune alerte particulière détectée aujourd’hui.",
}: Props) {
  const insets = useSafeAreaInsets();

  const isWarning =
    level === "warning";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View
          style={[
            styles.header,
            {
              paddingTop:
                insets.top + spacing.sm,
            },
          ]}
        >
          <View>
            <Text style={styles.eyebrow}>
              {isWarning
                ? "À SURVEILLER"
                : "ALERTE DOUCE"}
            </Text>

            <Text style={styles.title}>
              Votre état aujourd’hui
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed &&
                styles.closeButtonPressed,
            ]}
          >
            <Ionicons
              name="close"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.alertCard}>
            <View style={styles.iconBubble}>
              <Ionicons
                name={
                  isWarning
                    ? "warning-outline"
                    : "notifications-outline"
                }
                size={22}
                color={colors.textPrimary}
              />
            </View>

            <Text style={styles.alertTitle}>
              {title}
            </Text>

            <Text style={styles.message}>
              {message}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4EEE8",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
    borderWidth: 1,
    borderColor: "#D8CEC5",
  },

  closeButtonPressed: {
    opacity: 0.7,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  alertCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    alignItems: "flex-start",
  },

  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
    marginBottom: spacing.md,
  },

  alertTitle: {
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },

  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});