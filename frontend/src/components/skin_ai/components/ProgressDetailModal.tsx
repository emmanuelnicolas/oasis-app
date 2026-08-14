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

  streak: number;
  totalDays: number;
  todayProgress: number;
  learnings: any;
};

const LABELS: Record<string, string> = {
  hydration: "Hydratation",
  glow: "Éclat",
  texture: "Texture",
  irritation: "Irritation",
  breakouts: "Boutons",
  redness: "Rougeurs",
};

export function ProgressDetailModal({
  visible,
  onClose,
  streak,
  totalDays,
  todayProgress,
  learnings,
}: Props) {
  const insets = useSafeAreaInsets();

  const metrics =
    learnings?.skin_intelligence?.metrics || {};

  const metricEntries =
    Object.entries(metrics);

  const safeProgress = Math.max(
    0,
    Math.min(100, todayProgress)
  );

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
              PROGRESSION
            </Text>

            <Text style={styles.title}>
              Votre évolution
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
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {streak}
                </Text>

                <Text style={styles.statLabel}>
                  jours de série
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {totalDays}
                </Text>

                <Text style={styles.statLabel}>
                  jours suivis
                </Text>
              </View>

              <View style={styles.divider} />

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
          </View>

          <Text style={styles.sectionEyebrow}>
            ÉVOLUTION DE LA PEAU
          </Text>

          <Text style={styles.sectionTitle}>
            Vos indicateurs
          </Text>

          {metricEntries.length > 0 ? (
            <View style={styles.metricsCard}>
              {metricEntries.map(
                ([key, value]: any, index) => {
                  const latest = Number(
                    value?.latest || 0
                  );

                  const reverseMetric =
                    key === "irritation" ||
                    key === "breakouts" ||
                    key === "redness";

                  const progress =
                    reverseMetric
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            100 - latest * 10
                          )
                        )
                      : Math.max(
                          0,
                          Math.min(
                            100,
                            latest * 10
                          )
                        );

                  return (
                    <View
                      key={key}
                      style={[
                        styles.metricRow,
                        index <
                          metricEntries.length -
                            1 &&
                          styles.metricRowBorder,
                      ]}
                    >
                      <View style={styles.metricHeader}>
                        <Text
                          style={styles.metricName}
                        >
                          {LABELS[key] || key}
                        </Text>

                        <Text
                          style={styles.metricValue}
                        >
                          {latest}/10
                        </Text>
                      </View>

                      <View
                        style={
                          styles.metricTrack
                        }
                      >
                        <View
                          style={[
                            styles.metricFill,
                            {
                              width: `${progress}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="analytics-outline"
                size={22}
                color={colors.textSecondary}
              />

              <Text style={styles.emptyTitle}>
                Pas encore assez de données
              </Text>

              <Text style={styles.emptyText}>
                Continuez à ajouter des suivis
                pour visualiser l’évolution de
                votre peau.
              </Text>
            </View>
          )}
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

  statsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: "center",
  },

  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#D8CEC5",
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5DCD4",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  sectionEyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 21,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  metricsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    paddingHorizontal: spacing.md,
  },

  metricRow: {
    paddingVertical: spacing.md,
  },

  metricRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E3DAD2",
  },

  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  metricName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  metricValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  metricTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5DCD4",
  },

  metricFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.xl,
  },

  emptyTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    marginTop: spacing.sm,
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: "center",
  },
});