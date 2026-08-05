import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../theme";

import type {
  FormulaAnalysis,
  MarketingAnalysis,
  SynergyAnalysis,
} from "../../types/productIntelligence";

type Props = {
  formulaAnalysis?: FormulaAnalysis;
  marketingAnalysis?: MarketingAnalysis;
  synergyAnalysis?: SynergyAnalysis;
};

type ScoreRowProps = {
  label: string;
  value: number;
  reverse?: boolean;
};

function clamp(value: number) {
  return Math.max(
    0,
    Math.min(100, Number(value || 0))
  );
}

function ScoreRow({
  label,
  value,
  reverse = false,
}: ScoreRowProps) {
  const safeValue = clamp(value);
  const visualValue = reverse
    ? 100 - safeValue
    : safeValue;

  return (
    <View style={styles.scoreBlock}>
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreLabel}>
          {label}
        </Text>

        <Text style={styles.scoreValue}>
          {safeValue}/100
        </Text>
      </View>

      <View style={styles.scoreTrack}>
        <View
          style={[
            styles.scoreFill,
            {
              width: `${visualValue}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function IngredientIntelligenceV2({
  formulaAnalysis,
  marketingAnalysis,
  synergyAnalysis,
}: Props) {
  const [detailsOpen, setDetailsOpen] =
    useState(false);
  if (
    !formulaAnalysis &&
    !marketingAnalysis &&
    !synergyAnalysis
  ) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>
          INGREDIENT INTELLIGENCE V2
        </Text>
<View style={styles.summaryCard}>
  <View style={styles.summaryHeader}>
    <View style={styles.summaryIcon}>
      <Ionicons
        name="sparkles-outline"
        size={21}
        color={colors.primary}
      />
    </View>

    <View style={styles.summaryHeaderText}>
      <Text style={styles.summaryTitle}>
        Résumé OASIS
      </Text>

      <Text style={styles.summarySubtitle}>
        Lecture rapide de la formule
      </Text>
    </View>
  </View>

  <View style={styles.summaryScores}>
    {formulaAnalysis && (
      <View style={styles.summaryMetric}>
        <Text style={styles.summaryMetricValue}>
          {formulaAnalysis.active_balance_score}
        </Text>

        <Text style={styles.summaryMetricLabel}>
          Formule
        </Text>
      </View>
    )}

    {marketingAnalysis && (
      <View style={styles.summaryMetric}>
        <Text style={styles.summaryMetricValue}>
          {
            marketingAnalysis
              .marketing_confidence
          }
        </Text>

        <Text style={styles.summaryMetricLabel}>
          Marketing
        </Text>
      </View>
    )}

    {synergyAnalysis && (
      <View style={styles.summaryMetric}>
        <Text style={styles.summaryMetricValue}>
          {synergyAnalysis.balance_score}
        </Text>

        <Text style={styles.summaryMetricLabel}>
          Synergies
        </Text>
      </View>
    )}
  </View>

  {formulaAnalysis && (
    <Text style={styles.summaryVerdict}>
      Formule{" "}
      {formulaAnalysis.active_balance}
      {" · "}
      Risque d’irritation{" "}
      {formulaAnalysis.irritation_risk}/100
    </Text>
  )}

  {marketingAnalysis && (
    <View style={styles.summaryLine}>
      <Ionicons
        name="megaphone-outline"
        size={16}
        color={colors.textSecondary}
      />

      <Text style={styles.summaryLineText}>
        {marketingAnalysis.verdict}
      </Text>
    </View>
  )}

  {synergyAnalysis && (
    <View style={styles.summaryLine}>
      <Ionicons
        name="git-merge-outline"
        size={16}
        color={colors.textSecondary}
      />

      <Text style={styles.summaryLineText}>
        {synergyAnalysis.verdict}
      </Text>
    </View>
  )}

  <TouchableOpacity
    style={styles.detailsButton}
    onPress={() =>
      setDetailsOpen((current) => !current)
    }
    activeOpacity={0.8}
  >
    <Text style={styles.detailsButtonText}>
      {detailsOpen
        ? "Masquer les détails"
        : "Voir l’analyse complète"}
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
        <Text style={styles.title}>
          Intelligence de la formule
        </Text>

        <Text style={styles.subtitle}>
          OASIS analyse l’équilibre global, les
          promesses marketing et les associations
          d’ingrédients.
        </Text>
      </View>
{detailsOpen && (
  <>
      {formulaAnalysis ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="flask-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Qualité de la formule
              </Text>

              <Text style={styles.verdict}>
                Équilibre{" "}
                {formulaAnalysis.active_balance}
              </Text>
            </View>

            <Text style={styles.mainScore}>
              {
                formulaAnalysis
                  .active_balance_score
              }
            </Text>
          </View>

          <ScoreRow
            label="Hydratation"
            value={
              formulaAnalysis.hydration_score
            }
          />

          <ScoreRow
            label="Soutien de la barrière"
            value={
              formulaAnalysis.barrier_support
            }
          />

          <ScoreRow
            label="Risque d’irritation"
            value={
              formulaAnalysis.irritation_risk
            }
            reverse
          />

          <ScoreRow
            label="Positionnement des actifs"
            value={
              formulaAnalysis
                .active_position_quality
            }
          />

          {formulaAnalysis
            .hydration_supporters?.length >
          0 ? (
            <SignalList
              title="Soutien hydratation"
              items={
                formulaAnalysis
                  .hydration_supporters
              }
              icon="water-outline"
              positive
            />
          ) : null}

          {formulaAnalysis
            .irritation_sources?.length >
          0 ? (
            <SignalList
              title="Sources à surveiller"
              items={
                formulaAnalysis
                  .irritation_sources
              }
              icon="warning-outline"
            />
          ) : null}

          <Text style={styles.confidence}>
            Confiance de l’analyse :{" "}
            {
              formulaAnalysis
                .formula_confidence
            }
            %
          </Text>
        </View>
      ) : null}

      {marketingAnalysis ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="megaphone-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Cohérence marketing
              </Text>

              <Text style={styles.verdict}>
                {marketingAnalysis.verdict}
              </Text>
            </View>

            <Text style={styles.mainScore}>
              {
                marketingAnalysis
                  .marketing_confidence
              }
            </Text>
          </View>

          <ScoreRow
            label="Confiance marketing"
            value={
              marketingAnalysis
                .marketing_confidence
            }
          />

          <ScoreRow
            label="Intégrité des actifs"
            value={
              marketingAnalysis
                .ingredient_integrity_score
            }
          />

          {marketingAnalysis
            .supported_claims?.map(
              (claim, index) => (
                <View
                  key={`supported-${index}`}
                  style={styles.signalRow}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#537A61"
                  />

                  <View style={styles.signalText}>
                    <Text
                      style={styles.signalTitle}
                    >
                      {claim.claim}
                    </Text>

                    <Text
                      style={styles.signalDescription}
                    >
                      Promesse soutenue par la
                      formule.
                    </Text>
                  </View>
                </View>
              )
            )}

          {marketingAnalysis.weak_claims?.map(
            (claim, index) => (
              <View
                key={`weak-${index}`}
                style={styles.signalRow}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#A87938"
                />

                <View style={styles.signalText}>
                  <Text
                    style={styles.signalTitle}
                  >
                    {claim.claim}
                  </Text>

                  <Text
                    style={
                      styles.signalDescription
                    }
                  >
                    {claim.reason ||
                      "Promesse à nuancer."}
                  </Text>
                </View>
              </View>
            )
          )}

          {marketingAnalysis.marketing_flags?.map(
            (flag, index) => (
              <View
                key={`flag-${index}`}
                style={styles.warningBox}
              >
                <Text style={styles.warningText}>
                  {flag.message}
                </Text>
              </View>
            )
          )}
        </View>
      ) : null}

      {synergyAnalysis ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="git-merge-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Synergies et conflits
              </Text>

              <Text style={styles.verdict}>
                {synergyAnalysis.verdict}
              </Text>
            </View>

            <Text style={styles.mainScore}>
              {synergyAnalysis.balance_score}
            </Text>
          </View>

          <ScoreRow
            label="Équilibre des associations"
            value={
              synergyAnalysis.balance_score
            }
          />

          <ScoreRow
            label="Risque irritant cumulé"
            value={
              synergyAnalysis
                .cumulative_irritation_risk
            }
            reverse
          />

          <View style={styles.activeLoad}>
            <Text style={styles.activeLoadLabel}>
              Charge d’actifs
            </Text>

            <Text style={styles.activeLoadValue}>
              {synergyAnalysis.active_load?.level ||
                "indéterminée"}
            </Text>
          </View>

          {synergyAnalysis.synergies?.map(
            (signal, index) => (
              <SignalCard
                key={`synergy-${index}`}
                signal={signal}
                type="positive"
              />
            )
          )}

          {synergyAnalysis.conflicts?.map(
            (signal, index) => (
              <SignalCard
                key={`conflict-${index}`}
                signal={signal}
                type="negative"
              />
            )
          )}

          {synergyAnalysis.redundancies?.map(
            (signal, index) => (
              <SignalCard
                key={`redundancy-${index}`}
                signal={signal}
                type="warning"
              />
            )
          )}
        </View>
      ) : null}
    </>
  )}
</View>
  );
}

function SignalList({
  title,
  items,
  icon,
  positive = false,
}: {
  title: string;
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
  positive?: boolean;
}) {
  return (
    <View style={styles.signalList}>
      <Text style={styles.signalListTitle}>
        {title}
      </Text>

      {items.slice(0, 5).map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={styles.signalRow}
        >
          <Ionicons
            name={icon}
            size={17}
            color={
              positive ? "#537A61" : "#A87938"
            }
          />

          <Text style={styles.signalDescription}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SignalCard({
  signal,
  type,
}: {
  signal: {
    message: string;
    recommendation: string;
  };
  type: "positive" | "warning" | "negative";
}) {
  const icon =
    type === "positive"
      ? "checkmark-circle-outline"
      : type === "negative"
        ? "warning-outline"
        : "information-circle-outline";

  return (
    <View
      style={[
        styles.signalCard,
        type === "positive" &&
          styles.signalCardPositive,
        type === "warning" &&
          styles.signalCardWarning,
        type === "negative" &&
          styles.signalCardNegative,
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={
          type === "positive"
            ? "#537A61"
            : type === "negative"
              ? "#984C46"
              : "#A87938"
        }
      />

      <View style={styles.signalText}>
        <Text style={styles.signalTitle}>
          {signal.message}
        </Text>

        {!!signal.recommendation && (
          <Text style={styles.signalDescription}>
            {signal.recommendation}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
  },

  intro: {
    marginBottom: spacing.md,
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
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

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  verdict: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },

  mainScore: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },

  scoreBlock: {
    marginBottom: spacing.md,
  },

  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  scoreLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },

  scoreValue: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  scoreTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },

  scoreFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  confidence: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },

  signalList: {
    marginTop: spacing.sm,
  },

  signalListTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  signalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  signalText: {
    flex: 1,
  },

  signalTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  signalDescription: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  warningBox: {
    backgroundColor:
      "rgba(212,178,113,0.15)",
    borderRadius: radius.input,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },

  warningText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },

  activeLoad: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  activeLoadLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },

  activeLoadValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "capitalize",
  },

  signalCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.input,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  signalCardPositive: {
    backgroundColor:
      "rgba(126,154,136,0.12)",
  },

  signalCardWarning: {
    backgroundColor:
      "rgba(212,178,113,0.15)",
  },

  signalCardNegative: {
    backgroundColor:
      "rgba(184,107,107,0.13)",
  },
summaryCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,
  marginBottom: spacing.md,
},

summaryHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.lg,
},

summaryIcon: {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    "rgba(126,154,136,0.12)",
  marginRight: spacing.sm,
},

summaryHeaderText: {
  flex: 1,
},

summaryTitle: {
  fontSize: 17,
  fontWeight: "700",
  color: colors.textPrimary,
},

summarySubtitle: {
  fontSize: 12,
  color: colors.textSecondary,
  marginTop: 2,
},

summaryScores: {
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.md,
},

summaryMetric: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.bg,
  borderRadius: radius.input,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xs,
},

summaryMetricValue: {
  fontSize: 22,
  fontWeight: "800",
  color: colors.primary,
},

summaryMetricLabel: {
  fontSize: 11,
  color: colors.textSecondary,
  marginTop: 3,
},

summaryVerdict: {
  fontSize: 13,
  lineHeight: 19,
  fontWeight: "600",
  color: colors.textPrimary,
  marginBottom: spacing.sm,
  textTransform: "capitalize",
},

summaryLine: {
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  marginBottom: spacing.sm,
},

summaryLineText: {
  flex: 1,
  fontSize: 12,
  lineHeight: 18,
  color: colors.textSecondary,
},

detailsButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  paddingTop: spacing.md,
  marginTop: spacing.sm,
},

detailsButtonText: {
  fontSize: 13,
  fontWeight: "700",
  color: colors.primary,
},
});