import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../../../../theme";
import { useResponsive } from "../../../../hooks/useResponsive";

type Props = {
  learnings: any;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function TwinStatusCard({ learnings }: Props) {
  const { isPhone } = useResponsive();
  const summary = learnings?.learning_summary || {};
  const ingredient = learnings?.ingredient_intelligence || {};
  const skin = learnings?.skin_intelligence || {};

  const totalFeedbacks = Number(summary.total_feedbacks || 0);
  const skinEntries = Number(skin.entry_count || 0);

  const ingredientSignals =
    (ingredient.positive_ingredients || []).length +
    (ingredient.watch_ingredients || []).length +
    (ingredient.correlations || []).length;

  const confidence = clamp(
    Math.round(
      Number(ingredient.confidence || 0) * 0.4 +
        Number(ingredient.correlation_confidence || 0) * 0.4 +
        Math.min(skinEntries * 5, 20)
    )
  );

  let status = "OASIS commence à construire votre profil.";

  if (confidence >= 65) {
    status = "Votre profil est suffisamment riche pour des conseils précis.";
  } else if (confidence >= 35) {
    status = "OASIS comprend de mieux en mieux vos réactions.";
  } else if (confidence >= 10) {
    status = "OASIS observe vos premières tendances.";
  }

  return (
    <View style={[styles.card, isPhone && styles.cardPhone]}>
      <Text
  maxFontSizeMultiplier={1.1}
  style={styles.eyebrow}
>
  CONFIANCE IA
</Text>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
  maxFontSizeMultiplier={1.15}
  style={[
    styles.title,
    isPhone && styles.titlePhone,
  ]}
>
  Votre Digital Twin apprend
</Text>

<Text
  maxFontSizeMultiplier={1.15}
  style={styles.status}
>
  {status}
</Text>
        </View>

        <Text
  maxFontSizeMultiplier={1.1}
  style={styles.value}
>
  {confidence}%
</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(confidence, 4)}%`,
            },
          ]}
        />
      </View>

      <Text
  maxFontSizeMultiplier={1.15}
  style={styles.basis}
>
  Basé sur {skinEntries} suivi{skinEntries > 1 ? "s" : ""} ·{" "}
  {totalFeedbacks} retour{totalFeedbacks > 1 ? "s" : ""} ·{" "}
  {ingredientSignals} signal{ingredientSignals > 1 ? "s" : ""}
</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#EEE4DC",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D4C6BA",
    padding: spacing.md,
    marginTop: spacing.md,
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },

  status: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  value: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  track: {
    height: 8,
    backgroundColor: "#DDD1C7",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },

  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },

  basis: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  cardPhone: {
  padding: spacing.md,
  marginTop: spacing.sm,
},

titlePhone: {
  fontSize: 16,
  lineHeight: 21,
},
});