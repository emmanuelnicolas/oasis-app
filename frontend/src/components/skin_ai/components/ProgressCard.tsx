import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

type Props = {
  learnings: any;
  streak: number;
  totalDays: number;
  todayProgress: number;
};

const LABELS: Record<string, string> = {
  hydration: "Hydratation",
  glow: "Glow",
  texture: "Texture",
  irritation: "Irritation",
  breakouts: "Boutons",
  redness: "Rougeurs",
};

export function ProgressCard({
  learnings,
  streak,
  totalDays,
  todayProgress,
}: Props) {
  const metrics =
    learnings?.skin_intelligence?.metrics || {};

  const entries = Object.entries(metrics);

  const routineMessage =
    todayProgress === 100
      ? "Votre routine du jour est terminée."
      : todayProgress > 0
        ? "Votre routine du jour est en cours."
        : "Commencez votre routine pour maintenir votre régularité.";

  return (
    <View style={styles.card}>
      <Text
        maxFontSizeMultiplier={1.1}
        style={styles.eyebrow}
      >
        PROGRESSION
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.title}
      >
        Votre régularité OASIS
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {streak}
          </Text>

          <Text style={styles.statLabel}>
            jours de série
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
            {todayProgress}%
          </Text>

          <Text style={styles.statLabel}>
            aujourd’hui
          </Text>
        </View>
      </View>

      <View style={styles.todayTrack}>
        <View
          style={[
            styles.todayFill,
            {
              width: `${todayProgress}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.routineMessage}>
        {routineMessage}
      </Text>

      {entries.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>
            Évolution de la peau
          </Text>

          {entries.map(([key, value]: any) => {
            const latest = Number(
              value?.latest || 0
            );

            const reverseMetric =
              key === "irritation" ||
              key === "breakouts" ||
              key === "redness";

            const displayedProgress =
              reverseMetric
                ? Math.max(
                    0,
                    Math.min(100, 100 - latest * 10)
                  )
                : Math.max(
                    0,
                    Math.min(100, latest * 10)
                  );

            return (
              <View
                key={key}
                style={styles.metric}
              >
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {LABELS[key] || key}
                  </Text>

                  <Text style={styles.percent}>
                    {latest}/10
                  </Text>
                </View>

                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${displayedProgress}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 21,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#D8CEC5",
  },

  todayTrack: {
    height: 8,
    backgroundColor: "#E5DCD4",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },

  todayFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  routineMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },

  metric: {
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  name: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  percent: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  track: {
    height: 8,
    backgroundColor: "#E5DCD4",
    borderRadius: 999,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});