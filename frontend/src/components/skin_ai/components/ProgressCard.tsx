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
  radius,
  spacing,
} from "../../../theme";

type Props = {
  learnings: any;
  streak: number;
  totalDays: number;
  todayProgress: number;
  onPress?: () => void;
};

export function ProgressCard({
  streak,
  totalDays,
  todayProgress,
  onPress,
}: Props) {
  const safeProgress = Math.max(
    0,
    Math.min(100, todayProgress)
  );

  const routineMessage =
    safeProgress === 100
      ? "Routine terminée aujourd’hui"
      : safeProgress > 0
        ? "Routine en cours aujourd’hui"
        : "Commencez votre routine aujourd’hui";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voir votre progression OASIS"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBubble}>
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={colors.textPrimary}
            />
          </View>

          <View style={styles.titleContent}>
            <Text style={styles.eyebrow}>
              PROGRESSION
            </Text>

            <Text style={styles.title}>
              Votre régularité
            </Text>
          </View>
        </View>

        <View style={styles.arrowButton}>
          <Ionicons
            name="arrow-forward"
            size={19}
            color={colors.textPrimary}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {streak}
          </Text>

          <Text style={styles.statLabel}>
            série
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {totalDays}
          </Text>

          <Text style={styles.statLabel}>
            jours suivis
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {safeProgress}%
          </Text>

          <Text style={styles.statLabel}>
            aujourd’hui
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${safeProgress}%`,
            },
          ]}
        />
      </View>

      <Text
        numberOfLines={1}
        style={styles.message}
      >
        {routineMessage}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  cardPressed: {
    opacity: 0.74,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
    marginRight: spacing.sm,
  },

  titleContent: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 2,
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EAE4",
    borderWidth: 1,
    borderColor: "#DED2C8",
    marginLeft: spacing.md,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#D8CEC5",
  },

  progressTrack: {
    height: 6,
    backgroundColor: "#E5DCD4",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  message: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});