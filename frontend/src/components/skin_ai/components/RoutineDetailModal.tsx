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
  spacing,
} from "../../../theme";

import {
  RoutineCard,
  RoutineItem,
  RoutinePeriod,
} from "./RoutineCard";

type Props = {
  visible: boolean;
  onClose: () => void;

  morningItems?: RoutineItem[];
  eveningItems?: RoutineItem[];
  weeklyItems?: RoutineItem[];

  onToggleStep?: (
    period: RoutinePeriod,
    order: number
  ) => void | Promise<void>;
};

export function RoutineDetailModal({
  visible,
  onClose,
  morningItems = [],
  eveningItems = [],
  weeklyItems = [],
  onToggleStep,
}: Props) {
  const insets = useSafeAreaInsets();

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
              ROUTINE
            </Text>

            <Text style={styles.title}>
              Vos soins
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
          {morningItems.length > 0 ? (
            <RoutineCard
              period="matin"
              items={morningItems}
              onToggleStep={onToggleStep}
            />
          ) : null}

          {eveningItems.length > 0 ? (
            <RoutineCard
              period="soir"
              items={eveningItems}
              onToggleStep={onToggleStep}
            />
          ) : null}

          {weeklyItems.length > 0 ? (
            <RoutineCard
              period="hebdo"
              items={weeklyItems}
              onToggleStep={onToggleStep}
            />
          ) : null}
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
  },
});