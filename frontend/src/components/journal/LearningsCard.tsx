import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../../theme";

type Props = {
  learnings: any;
};

export function LearningsCard({ learnings }: Props) {
  if (!learnings) return null;

  return (
    <>
      <View style={styles.learningCard}>
        <Text style={styles.learningTitle}>🧠 Learnings OASIS</Text>

        <Text style={styles.learningStats}>
          Feedbacks : {learnings.total_feedbacks}
        </Text>

        <View style={styles.learningStatsRow}>
          <View style={styles.learningBadge}>
            <Text style={styles.learningBadgeEmoji}>👍</Text>
            <Text style={styles.learningBadgeNumber}>
              {learnings.positive_products}
            </Text>
          </View>

          <View style={styles.learningBadge}>
            <Text style={styles.learningBadgeEmoji}>➖</Text>
            <Text style={styles.learningBadgeNumber}>
              {learnings.neutral_products}
            </Text>
          </View>

          <View style={styles.learningBadge}>
            <Text style={styles.learningBadgeEmoji}>👎</Text>
            <Text style={styles.learningBadgeNumber}>
              {learnings.negative_products}
            </Text>
          </View>
        </View>

        {(learnings.insights || []).map((item: string, index: number) => (
          <View key={index} style={styles.learningInsightBox}>
            <Text style={styles.learningInsightText}>{item}</Text>
          </View>
        ))}
      </View>

      {(learnings.top_ingredients || []).length > 0 && (
        <View style={styles.ingredientLearningBlock}>
          <Text style={styles.learningTitle}>
            Ingrédients qui semblent vous convenir
          </Text>

          {learnings.top_ingredients.map((item: any, index: number) => (
            <Text key={index} style={styles.learningText} numberOfLines={1}>
              ✓ {item.ingredient}
            </Text>
          ))}
        </View>
      )}

      {(learnings.ingredient_correlations || []).length > 0 && (
        <View style={styles.correlationCard}>
          <Text style={styles.learningTitle}>🧪 Corrélations observées</Text>

          {learnings.ingredient_correlations.map((item: any, index: number) => (
            <View key={index} style={styles.correlationItem}>
              <Text style={styles.correlationIngredient}>
                {item.ingredient}
              </Text>

              <Text style={styles.learningText}>
                💧 Hydratation : {item.avg_hydration}
              </Text>

              <Text style={styles.learningText}>
                ✨ Glow : {item.avg_glow}
              </Text>

              <Text style={styles.learningText}>
                🧴 Texture : {item.avg_texture}
              </Text>

              <Text style={styles.learningText}>
                🔥 Irritation : {item.avg_irritation}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  learningCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  learningTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  learningStats: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  learningStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  learningBadge: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  learningBadgeEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  learningBadgeNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  learningInsightBox: {
    backgroundColor: colors.bg,
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  learningInsightText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  learningText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  ingredientLearningBlock: {
    marginTop: spacing.md,
  },
  correlationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  correlationItem: {
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  correlationIngredient: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 4,
    color: colors.textPrimary,
  },
});