import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../theme";

type Props = {
  learnings: any;
};

function getLevel(confidence: number) {
  if (confidence < 10) {
    return {
      label: "Niveau 1 · Découverte",
      description:
        "OASIS commence à construire votre profil peau.",
    };
  }

  if (confidence < 35) {
    return {
      label: "Niveau 2 · Observation",
      description:
        "OASIS commence à repérer vos premières tendances.",
    };
  }

  if (confidence < 65) {
    return {
      label: "Niveau 3 · Compréhension",
      description:
        "OASIS comprend de mieux en mieux vos réactions.",
    };
  }

  return {
    label: "Niveau 4 · Personnalisation",
    description:
      "Vos recommandations deviennent plus précises.",
  };
}

function translateActiveLoad(value?: string | null) {
  const labels: Record<string, string> = {
    low: "Faible",
    light: "Faible",
    moderate: "Modérée",
    medium: "Modérée",
    high: "Élevée",
    intense: "Élevée",
  };

  if (!value) {
    return "En cours d’apprentissage";
  }

  return (
    labels[value.toLowerCase()] ||
    value
  );
}

function formatScore(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `${Math.round(value)}/100`;
}

export function OasisIntelligenceCard({
  learnings,
}: Props) {
  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const summary =
    learnings?.learning_summary || {};

  const ingredient =
    learnings?.ingredient_intelligence || {};

  const formula =
    learnings?.formula_intelligence || {};
  
  const routine =
    learnings?.routine_intelligence || {};
	
  const routineSkinImpact =
    routine.skin_impact || {};

  const skin =
    learnings?.skin_intelligence || {};

  const totalFeedbacks =
    summary.total_feedbacks || 0;

  const skinEntries =
    skin.entry_count || 0;

  const ingredientCount =
    (
      ingredient.positive_ingredients || []
    ).length +
    (
      ingredient.watch_ingredients || []
    ).length +
    (
      ingredient.correlations || []
    ).length;

  const formulaFeedbacks =
    formula.usable_feedbacks || 0;

  const formulaConfidence =
    Number(formula.confidence || 0);

  const ingredientConfidence =
    Number(ingredient.confidence || 0);

  const correlationConfidence =
    Number(
      ingredient.correlation_confidence || 0
    );

  const skinConfidence = Math.min(
    skinEntries * 5,
    20
  );
  const routineConfidence = Number(
    routine.confidence || 0
);
  const confidence = Math.min(
    100,
    Math.round(
      ingredientConfidence * 0.2 +
        correlationConfidence * 0.2 +
        formulaConfidence * 0.25 +
        routineConfidence * 0.15 +
        skinConfidence
  )
);

  const level = getLevel(confidence);

  const positiveFormula =
    formula.positive_formula_profile;

  const negativeFormula =
    formula.negative_formula_profile;

  const observedSynergies =
    formula.observed_synergies || [];

  const observedConflicts =
    formula.observed_conflicts || [];

  const formulaStatus =
    formula.status || "insufficient_data";
	
  const routineStatus =
    routine.status || "insufficient_data";

  const overallAdherence = Number(
    routine.overall_adherence || 0
);

  const currentStreak = Number(
    routine.current_streak || 0
);

  const perfectDays = Number(
    routine.perfect_days || 0
);

  const routineAdherence =
    routine.routine_adherence || {};

  const morningAdherence = Number(
    routineAdherence.matin?.adherence || 0
);

  const eveningAdherence = Number(
    routineAdherence.soir?.adherence || 0
);

  const stepPerformance =
    routine.step_performance || [];

  const weakestStep =
    stepPerformance.length > 0
    ? [...stepPerformance].sort(
        (a: any, b: any) =>
          Number(a.completion_rate || 0) -
          Number(b.completion_rate || 0)
      )[0]
    : null;

  const skinImpactStatus =
    routineSkinImpact.status ||
    "insufficient_comparison";

  const skinImpactConfidence = Number(
    routineSkinImpact.confidence || 0
);

  const matchedSkinEntries = Number(
    routineSkinImpact.matched_entries || 0
);

  const observedSkinEffects =
    routineSkinImpact.observed_effects || [];

  const skinImpactSummary =
    routineSkinImpact.summary || "";

  const skinImpactDisclaimer =
    routineSkinImpact.disclaimer || "";	

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="sparkles-outline"
            size={21}
            color={colors.primary}
          />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.label}>
            OASIS Intelligence
          </Text>

          <Text style={styles.title}>
            {level.label}
          </Text>
        </View>

        <Text style={styles.confidenceValue}>
          {confidence}%
        </Text>
      </View>

      <Text style={styles.description}>
        {level.description}
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${
                Math.max(confidence, 8)
              }%`,
            },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {totalFeedbacks}
          </Text>

          <Text style={styles.statLabel}>
            retours
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {skinEntries}
          </Text>

          <Text style={styles.statLabel}>
            suivis
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {ingredientCount}
          </Text>

          <Text style={styles.statLabel}>
            ingrédients
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {formulaFeedbacks}
          </Text>

          <Text style={styles.statLabel}>
            formules
          </Text>
        </View>
      </View>

      <View style={styles.formulaSummary}>
        <View style={styles.formulaSummaryHeader}>
          <View>
            <Text style={styles.formulaTitle}>
              Mémoire des formules
            </Text>

            <Text style={styles.formulaStatus}>
              {formulaStatus === "established"
                ? "Profil établi"
                : formulaStatus === "learning"
                  ? "Apprentissage en cours"
                  : "Données insuffisantes"}
            </Text>
          </View>

          <View style={styles.formulaConfidenceBadge}>
            <Text
              style={
                styles.formulaConfidenceText
              }
            >
              {formulaConfidence}%
            </Text>
          </View>
        </View>

        <View style={styles.preferredLoad}>
          <Ionicons
            name="flask-outline"
            size={17}
            color={colors.primary}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.preferredLoadLabel}>
              Charge d’actifs préférée
            </Text>

            <Text style={styles.preferredLoadValue}>
              {translateActiveLoad(
                formula.preferred_active_load
              )}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            setDetailsOpen(
              (current) => !current
            )
          }
          activeOpacity={0.8}
        >
          <Text style={styles.detailsButtonText}>
            {detailsOpen
              ? "Masquer les apprentissages"
              : "Voir les apprentissages"}
          </Text>

          <Ionicons
            name={
              detailsOpen
                ? "chevron-up"
                : "chevron-down"
            }
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
<View style={styles.routineSummary}>
  <View style={styles.routineHeader}>
    <View style={styles.routineIcon}>
      <Ionicons
        name="repeat-outline"
        size={19}
        color={colors.primary}
      />
    </View>

    <View style={styles.routineHeaderText}>
      <Text style={styles.routineTitle}>
        Intelligence de routine
      </Text>

      <Text style={styles.routineStatus}>
        {routineStatus === "established"
          ? "Habitudes établies"
          : routineStatus === "learning"
            ? "Apprentissage en cours"
            : routineStatus === "no_routine"
              ? "Aucune routine active"
              : "Données insuffisantes"}
      </Text>
    </View>

    <Text style={styles.routineConfidence}>
      {routineConfidence}%
    </Text>
  </View>

  <View style={styles.routineMetrics}>
    <View style={styles.routineMetric}>
      <Text style={styles.routineMetricValue}>
        {Math.round(overallAdherence)}%
      </Text>
      <Text style={styles.routineMetricLabel}>
        adhérence
      </Text>
    </View>

    <View style={styles.routineMetric}>
      <Text style={styles.routineMetricValue}>
        {currentStreak}
      </Text>
      <Text style={styles.routineMetricLabel}>
        jours de suite
      </Text>
    </View>

    <View style={styles.routineMetric}>
      <Text style={styles.routineMetricValue}>
        {perfectDays}
      </Text>
      <Text style={styles.routineMetricLabel}>
        jours complets
      </Text>
    </View>
  </View>

  <View style={styles.routinePeriods}>
    <RoutineProgressRow
      label="Matin"
      value={morningAdherence}
      icon="sunny-outline"
    />

    <RoutineProgressRow
      label="Soir"
      value={eveningAdherence}
      icon="moon-outline"
    />
  </View>

  {weakestStep &&
    Number(weakestStep.opportunities || 0) >= 3 &&
    Number(weakestStep.completion_rate || 0) < 60 && (
      <View style={styles.weakStepBox}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color="#A87938"
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.weakStepTitle}>
            Étape la moins régulière
          </Text>

          <Text style={styles.weakStepText}>
            {weakestStep.name || "Étape"} ·{" "}
            {Math.round(
              Number(
                weakestStep.completion_rate || 0
              )
            )}
            %
          </Text>
        </View>
      </View>
    )}
</View>

<View style={styles.skinImpactCard}>
  <View style={styles.skinImpactHeader}>
    <View style={styles.skinImpactIcon}>
      <Ionicons
        name="analytics-outline"
        size={19}
        color={colors.primary}
      />
    </View>

    <View style={styles.skinImpactHeaderText}>
      <Text style={styles.skinImpactTitle}>
        Impact observé sur votre peau
      </Text>

      <Text style={styles.skinImpactStatus}>
        {skinImpactStatus === "established"
          ? "Association bien documentée"
          : skinImpactStatus === "learning"
            ? "Association en cours d’analyse"
            : skinImpactStatus === "no_routine"
              ? "Aucune routine exploitable"
              : "Comparaison insuffisante"}
      </Text>
    </View>

    <Text style={styles.skinImpactConfidence}>
      {skinImpactConfidence}%
    </Text>
  </View>

  {!!skinImpactSummary && (
    <Text style={styles.skinImpactSummary}>
      {skinImpactSummary}
    </Text>
  )}

  <View style={styles.skinImpactMeta}>
    <Ionicons
      name="calendar-outline"
      size={15}
      color={colors.textSecondary}
    />

    <Text style={styles.skinImpactMetaText}>
      {matchedSkinEntries} suivi(s) comparé(s)
    </Text>
  </View>

  {observedSkinEffects.length > 0 ? (
    <View style={styles.skinEffectsList}>
      {observedSkinEffects
        .slice(0, 4)
        .map((effect: any, index: number) => (
          <SkinImpactRow
            key={`skin-impact-${index}`}
            metric={effect.metric}
            direction={effect.direction}
            difference={effect.difference}
          />
        ))}
    </View>
  ) : (
    <View style={styles.skinImpactEmpty}>
      <Ionicons
        name="leaf-outline"
        size={18}
        color={colors.textSecondary}
      />

      <Text style={styles.skinImpactEmptyText}>
        OASIS a besoin de suivis réalisés pendant
        des périodes plus et moins régulières pour
        identifier une différence fiable.
      </Text>
    </View>
  )}

  {!!skinImpactDisclaimer &&
    observedSkinEffects.length > 0 && (
      <Text style={styles.skinImpactDisclaimer}>
        {skinImpactDisclaimer}
      </Text>
    )}
</View>
      {detailsOpen && (
        <View style={styles.detailsContainer}>
          {positiveFormula && (
            <View style={styles.learningBlock}>
              <View style={styles.learningHeader}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#537A61"
                />

                <Text style={styles.learningTitle}>
                  Formules associées aux bons
                  résultats
                </Text>
              </View>

              <MetricRow
                label="Hydratation moyenne"
                value={formatScore(
                  positiveFormula
                    .average_hydration_score
                )}
              />

              <MetricRow
                label="Soutien de la barrière"
                value={formatScore(
                  positiveFormula
                    .average_barrier_support
                )}
              />

              <MetricRow
                label="Risque d’irritation"
                value={formatScore(
                  positiveFormula
                    .average_irritation_risk
                )}
              />

              <MetricRow
                label="Équilibre des actifs"
                value={formatScore(
                  positiveFormula
                    .average_active_balance_score
                )}
              />

              <Text style={styles.sampleText}>
                Basé sur{" "}
                {positiveFormula.sample_size || 0}{" "}
                retour(s) positif(s).
              </Text>
            </View>
          )}

          {negativeFormula && (
            <View style={styles.learningBlock}>
              <View style={styles.learningHeader}>
                <Ionicons
                  name="warning-outline"
                  size={19}
                  color="#A87938"
                />

                <Text style={styles.learningTitle}>
                  Formules à surveiller
                </Text>
              </View>

              <MetricRow
                label="Risque d’irritation moyen"
                value={formatScore(
                  negativeFormula
                    .average_irritation_risk
                )}
              />

              <MetricRow
                label="Risque irritant cumulé"
                value={formatScore(
                  negativeFormula
                    .average_cumulative_irritation_risk
                )}
              />

              <MetricRow
                label="Soutien de la barrière"
                value={formatScore(
                  negativeFormula
                    .average_barrier_support
                )}
              />

              <Text style={styles.sampleText}>
                Basé sur{" "}
                {negativeFormula.sample_size || 0}{" "}
                retour(s) négatif(s).
              </Text>
            </View>
          )}

          {observedSynergies.length > 0 && (
            <View style={styles.learningBlock}>
              <View style={styles.learningHeader}>
                <Ionicons
                  name="git-merge-outline"
                  size={19}
                  color="#537A61"
                />

                <Text style={styles.learningTitle}>
                  Synergies observées
                </Text>
              </View>

              {observedSynergies
                .slice(0, 3)
                .map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <SignalRow
                      key={`synergy-${index}`}
                      message={item.message}
                      occurrences={
                        item.occurrences
                      }
                      positive
                    />
                  )
                )}
            </View>
          )}

          {observedConflicts.length > 0 && (
            <View style={styles.learningBlock}>
              <View style={styles.learningHeader}>
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#984C46"
                />

                <Text style={styles.learningTitle}>
                  Associations à surveiller
                </Text>
              </View>

              {observedConflicts
                .slice(0, 3)
                .map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <SignalRow
                      key={`conflict-${index}`}
                      message={item.message}
                      occurrences={
                        item.occurrences
                      }
                    />
                  )
                )}
            </View>
          )}

          {!positiveFormula &&
            !negativeFormula &&
            observedSynergies.length === 0 &&
            observedConflicts.length === 0 && (
              <View style={styles.emptyFormula}>
                <Ionicons
                  name="leaf-outline"
                  size={22}
                  color={
                    colors.textSecondary
                  }
                />

                <Text
                  style={
                    styles.emptyFormulaText
                  }
                >
                  OASIS a besoin de plusieurs
                  retours produits pour identifier
                  les types de formules qui vous
                  conviennent le mieux.
                </Text>
              </View>
            )}
        </View>
      )}

      <Text style={styles.hint}>
        Continuez votre journal et vos retours
        produits pour améliorer vos recommandations.
      </Text>
    </View>
  );
}
function SkinImpactRow({
  metric,
  direction,
  difference,
}: {
  metric?: string;
  direction?: string;
  difference?: number;
}) {
  const metricConfig: Record<
    string,
    {
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
    }
  > = {
    hydration: {
      label: "Hydratation",
      icon: "water-outline",
    },
    glow: {
      label: "Éclat",
      icon: "sparkles-outline",
    },
    texture: {
      label: "Texture",
      icon: "hand-left-outline",
    },
    irritation: {
      label: "Irritation",
      icon: "flame-outline",
    },
    breakouts: {
      label: "Boutons",
      icon: "ellipse-outline",
    },
    redness: {
      label: "Rougeurs",
      icon: "rose-outline",
    },
  };

  const config =
    metricConfig[metric || ""] || {
      label: metric || "Indicateur",
      icon: "analytics-outline" as const,
    };

  const safeDifference = Number(
    difference || 0
  );

  const isPositiveMetric =
    direction === "improving";

  const resultText = isPositiveMetric
    ? `+${safeDifference.toFixed(1)} point(s)`
    : `-${safeDifference.toFixed(1)} point(s)`;

  return (
    <View style={styles.skinEffectRow}>
      <View style={styles.skinEffectIcon}>
        <Ionicons
          name={config.icon}
          size={17}
          color={colors.primary}
        />
      </View>

      <View style={styles.skinEffectText}>
        <Text style={styles.skinEffectLabel}>
          {config.label}
        </Text>

        <Text style={styles.skinEffectDescription}>
          {isPositiveMetric
            ? "Meilleure pendant les périodes régulières"
            : "Plus faible pendant les périodes régulières"}
        </Text>
      </View>

      <Text style={styles.skinEffectValue}>
        {resultText}
      </Text>
    </View>
  );
}
function RoutineProgressRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value || 0))
  );

  return (
    <View style={styles.routineProgressBlock}>
      <View style={styles.routineProgressHeader}>
        <View style={styles.routineProgressLabel}>
          <Ionicons
            name={icon}
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.routineProgressText}>
            {label}
          </Text>
        </View>

        <Text style={styles.routineProgressValue}>
          {Math.round(safeValue)}%
        </Text>
      </View>

      <View style={styles.routineProgressTrack}>
        <View
          style={[
            styles.routineProgressFill,
            {
              width: `${safeValue}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}
function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

function SignalRow({
  message,
  occurrences,
  positive = false,
}: {
  message?: string;
  occurrences?: number;
  positive?: boolean;
}) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.signalRow}>
      <Text
        style={[
          styles.signalDot,
          positive
            ? styles.signalDotPositive
            : styles.signalDotWarning,
        ]}
      >
        •
      </Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.signalMessage}>
          {message}
        </Text>

        <Text style={styles.signalCount}>
          Observé {occurrences || 1} fois
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(126,154,136,0.12)",
    marginRight: spacing.sm,
  },

  headerText: {
    flex: 1,
  },

  label: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },

  title: {
    fontSize: 21,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  confidenceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },

  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.md,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  statBox: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
  },

  statValue: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  formulaSummary: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  formulaSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  formulaTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  formulaStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  formulaConfidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor:
      "rgba(126,154,136,0.12)",
  },

  formulaConfidenceText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  preferredLoad: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  preferredLoadLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  preferredLoadValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },

  detailsButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },

  detailsButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  detailsContainer: {
    marginBottom: spacing.md,
  },

  learningBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  learningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  learningTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 6,
  },

  metricLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  metricValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  sampleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.sm,
  },

  signalRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  signalDot: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "700",
  },

  signalDotPositive: {
    color: "#537A61",
  },

  signalDotWarning: {
    color: "#984C46",
  },

  signalMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },

  signalCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  emptyFormula: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  emptyFormulaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  routineSummary: {
  backgroundColor: colors.bg,
  borderRadius: radius.md,
  padding: spacing.md,
  marginBottom: spacing.md,
},

routineHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
},

routineIcon: {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    "rgba(126,154,136,0.12)",
  marginRight: spacing.sm,
},

routineHeaderText: {
  flex: 1,
},

routineTitle: {
  fontSize: 15,
  color: colors.textPrimary,
  fontWeight: "700",
},

routineStatus: {
  fontSize: 11,
  color: colors.textSecondary,
  marginTop: 2,
},

routineConfidence: {
  fontSize: 14,
  color: colors.primary,
  fontWeight: "700",
},

routineMetrics: {
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.md,
},

routineMetric: {
  flex: 1,
  alignItems: "center",
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
},

routineMetricValue: {
  fontSize: 17,
  fontWeight: "700",
  color: colors.textPrimary,
},

routineMetricLabel: {
  fontSize: 9,
  color: colors.textSecondary,
  marginTop: 2,
  textAlign: "center",
},

routinePeriods: {
  gap: spacing.sm,
},

routineProgressBlock: {
  marginBottom: spacing.xs,
},

routineProgressHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 5,
},

routineProgressLabel: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
},

routineProgressText: {
  fontSize: 12,
  color: colors.textPrimary,
},

routineProgressValue: {
  fontSize: 11,
  color: colors.textSecondary,
  fontWeight: "700",
},

routineProgressTrack: {
  height: 6,
  backgroundColor: colors.border,
  borderRadius: 999,
  overflow: "hidden",
},

routineProgressFill: {
  height: "100%",
  backgroundColor: colors.primary,
  borderRadius: 999,
},

weakStepBox: {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  backgroundColor:
    "rgba(212,178,113,0.13)",
  borderRadius: radius.md,
  padding: spacing.sm,
  marginTop: spacing.md,
},

weakStepTitle: {
  fontSize: 11,
  fontWeight: "700",
  color: colors.textPrimary,
},

weakStepText: {
  fontSize: 11,
  color: colors.textSecondary,
  marginTop: 2,
},
skinImpactCard: {
  backgroundColor: colors.bg,
  borderRadius: radius.md,
  padding: spacing.md,
  marginBottom: spacing.md,
},

skinImpactHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
},

skinImpactIcon: {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    "rgba(126,154,136,0.12)",
  marginRight: spacing.sm,
},

skinImpactHeaderText: {
  flex: 1,
},

skinImpactTitle: {
  fontSize: 15,
  color: colors.textPrimary,
  fontWeight: "700",
},

skinImpactStatus: {
  fontSize: 11,
  color: colors.textSecondary,
  marginTop: 2,
},

skinImpactConfidence: {
  fontSize: 14,
  color: colors.primary,
  fontWeight: "700",
},

skinImpactSummary: {
  fontSize: 12,
  lineHeight: 18,
  color: colors.textSecondary,
  marginBottom: spacing.sm,
},

skinImpactMeta: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.md,
},

skinImpactMetaText: {
  fontSize: 11,
  color: colors.textSecondary,
},

skinEffectsList: {
  gap: spacing.sm,
},

skinEffectRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  padding: spacing.sm,
},

skinEffectIcon: {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    "rgba(126,154,136,0.10)",
  marginRight: spacing.sm,
},

skinEffectText: {
  flex: 1,
},

skinEffectLabel: {
  fontSize: 12,
  color: colors.textPrimary,
  fontWeight: "700",
},

skinEffectDescription: {
  fontSize: 10,
  lineHeight: 15,
  color: colors.textSecondary,
  marginTop: 2,
},

skinEffectValue: {
  fontSize: 12,
  color: colors.primary,
  fontWeight: "700",
},

skinImpactEmpty: {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  padding: spacing.sm,
},

skinImpactEmptyText: {
  flex: 1,
  fontSize: 11,
  lineHeight: 17,
  color: colors.textSecondary,
},

skinImpactDisclaimer: {
  fontSize: 10,
  lineHeight: 15,
  color: colors.textSecondary,
  fontStyle: "italic",
  marginTop: spacing.md,
},
});