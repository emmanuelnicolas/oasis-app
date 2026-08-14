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
  learnings: any;
};

export function DiscoveriesDetailModal({
  visible,
  onClose,
  learnings,
}: Props) {
  const insets = useSafeAreaInsets();

  const ingredient =
    learnings?.ingredient_intelligence || {};

  const positives =
    ingredient.positive_ingredients || [];

  const watch =
    ingredient.watch_ingredients || [];

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
              DÉCOUVERTES
            </Text>

            <Text style={styles.title}>
              Ce qu’OASIS apprend
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
          {positives.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                INGRÉDIENTS POSITIFS
              </Text>

              <View style={styles.sectionCard}>
                {positives.map(
                  (item: any, index: number) => (
                    <View
                      key={`positive-${item.ingredient}-${index}`}
                      style={[
                        styles.row,
                        index <
                          positives.length - 1 &&
                          styles.rowBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusBubble,
                          styles.positiveBubble,
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={styles.rowContent}>
                        <Text style={styles.name}>
                          {item.ingredient}
                        </Text>

                        <Text
                          style={styles.description}
                        >
                          Cet ingrédient semble bien
                          fonctionner avec votre peau
                          selon vos retours.
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </>
          ) : null}

          {watch.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>
                À SURVEILLER
              </Text>

              <View style={styles.sectionCard}>
                {watch.map(
                  (item: any, index: number) => (
                    <View
                      key={`watch-${item.ingredient}-${index}`}
                      style={[
                        styles.row,
                        index <
                          watch.length - 1 &&
                          styles.rowBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusBubble,
                          styles.warningBubble,
                        ]}
                      >
                        <Ionicons
                          name="alert-outline"
                          size={15}
                          color="#FFFFFF"
                        />
                      </View>

                      <View style={styles.rowContent}>
                        <Text style={styles.name}>
                          {item.ingredient}
                        </Text>

                        <Text
                          style={styles.description}
                        >
                          OASIS recommande de continuer
                          à observer votre réaction à cet
                          ingrédient.
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </>
          ) : null}

          {positives.length === 0 &&
          watch.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="flask-outline"
                size={24}
                color={colors.textSecondary}
              />

              <Text style={styles.emptyTitle}>
                OASIS apprend encore
              </Text>

              <Text style={styles.emptyText}>
                Continuez à ajouter des suivis et des
                retours produits pour permettre à OASIS
                d’identifier vos ingrédients clés.
              </Text>
            </View>
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
    fontSize: 25,
    lineHeight: 31,
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

  sectionLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  sectionCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    paddingVertical: spacing.md,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E3DAD2",
  },

  statusBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  positiveBubble: {
    backgroundColor: "#263B31",
  },

  warningBubble: {
    backgroundColor: "#927161",
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: 4,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.xl,
    marginTop: spacing.md,
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