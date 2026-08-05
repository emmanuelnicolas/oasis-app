import React from "react";
import {
  ActivityIndicator,
  Pressable,
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
  generating: boolean;
  onGenerate: () => void | Promise<void>;
};

export function RoutineSetupCard({
  generating,
  onGenerate,
}: Props) {
  return (
    <View style={styles.card}>
      <Text
        maxFontSizeMultiplier={1.1}
        style={styles.eyebrow}
      >
        ROUTINES PERSONNALISÉES
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.title}
      >
        Construisez votre rituel OASIS
      </Text>

      <Text
        maxFontSizeMultiplier={1.15}
        style={styles.description}
      >
        OASIS peut créer vos routines du matin, du soir et hebdomadaire à
        partir de votre profil peau.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Générer mes routines"
        disabled={generating}
        onPress={onGenerate}
        style={({ pressed }) => [
          styles.button,
          pressed && !generating && styles.buttonPressed,
          generating && styles.buttonDisabled,
        ]}
      >
        {generating ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Génération en cours...
            </Text>
          </>
        ) : (
          <Text style={styles.buttonText}>
            Générer mes routines
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 21,
    lineHeight: 27,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  button: {
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});