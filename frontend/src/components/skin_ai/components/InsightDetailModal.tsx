import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
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
  insights: string[];
};

export function InsightDetailModal({
  visible,
  onClose,
  insights,
}: Props) {
  const insets = useSafeAreaInsets();

  const items =
    insights?.length > 0
      ? insights
      : [
          "OASIS commence à construire votre profil peau personnalisé.",
        ];

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
              OASIS AI
            </Text>

            <Text style={styles.title}>
              Vos insights
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                insets.bottom + spacing.xxl,
            },
          ]}
        >
          {items.map((item, index) => (
            <View
              key={`${index}-${item}`}
              style={styles.insightCard}
            >
              <View style={styles.numberBubble}>
                <Text style={styles.numberText}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>
                  {index === 0
                    ? "Insight principal"
                    : "Observation"}
                </Text>

                <Text style={styles.insightText}>
                  {item}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    gap: spacing.md,
  },

  insightCard: {
    flexDirection: "row",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
  },

  numberBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
    marginRight: spacing.md,
  },

  numberText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  insightContent: {
    flex: 1,
    minWidth: 0,
  },

  insightLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },

  insightText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },
});