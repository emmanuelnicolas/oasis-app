import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../../../theme";
import { useResponsive } from "../../../hooks/useResponsive";

type Props = {
  insights: string[];
};

export function CoachCard({ insights }: Props) {
  const { isPhone } = useResponsive();
  const message =
    insights?.[0] ||
    "OASIS commence à construire votre profil peau personnalisé.";

  return (
    <View style={[styles.card, isPhone && styles.cardPhone]}>
      <Text
  maxFontSizeMultiplier={1.1}
  style={styles.eyebrow}
>
  COACH OASIS
</Text>

      <Text
  maxFontSizeMultiplier={1.15}
  style={[
    styles.message,
    isPhone && styles.messagePhone,
  ]}
>
  {message}
</Text>

      <Text
  maxFontSizeMultiplier={1.15}
  style={styles.footer}
>
        Ce conseil évoluera automatiquement avec vos suivis, vos produits et
        vos retours.
      </Text>
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
    marginBottom: spacing.md,
  },

  message: {
    fontSize: 22,
    lineHeight: 31,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  footer: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  cardPhone: {
  padding: spacing.md,
  marginBottom: spacing.md,
},

messagePhone: {
  fontSize: 18,
  lineHeight: 25,
},
});