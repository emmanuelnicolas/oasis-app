import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../../theme";

import type {
  JournalEntry,
  LinkedProduct,
} from "../../../types/journal";

type Props = {
  visible: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
};

function getImageUri(imageBase64?: string) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }

  return `data:image/jpeg;base64,${imageBase64}`;
}

const METRICS = [
  {
    key: "hydration",
    label: "Hydratation",
    reverse: false,
  },
  {
    key: "glow",
    label: "Glow",
    reverse: false,
  },
  {
    key: "texture",
    label: "Texture",
    reverse: false,
  },
  {
    key: "irritation",
    label: "Irritation",
    reverse: true,
  },
  {
    key: "breakouts",
    label: "Boutons",
    reverse: true,
  },
  {
    key: "redness",
    label: "Rougeurs",
    reverse: true,
  },
] as const;

export function TrackingDetailModal({
  visible,
  entry,
  onClose,
}: Props) {
  if (!entry) {
    return null;
  }

  const imageUri = getImageUri(
    entry.image_base64
  );

  const linkedProducts: LinkedProduct[] =
    entry.linked_products || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text
              maxFontSizeMultiplier={1.1}
              style={styles.eyebrow}
            >
              SUIVI PEAU
            </Text>

            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.title}
            >
              Détail du suivi
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            hitSlop={8}
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
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}

          <Text
            maxFontSizeMultiplier={1.1}
            style={styles.date}
          >
            {new Date(
              entry.created_at
            ).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>

          <View style={styles.metricsCard}>
            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.sectionTitle}
            >
              État de la peau
            </Text>

            {METRICS.map((metric) => {
              const value = Number(
                entry[metric.key] || 0
              );

              const progress = metric.reverse
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      100 - value * 10
                    )
                  )
                : Math.max(
                    0,
                    Math.min(
                      100,
                      value * 10
                    )
                  );

              return (
                <View
                  key={metric.key}
                  style={styles.metric}
                >
                  <View
                    style={styles.metricHeader}
                  >
                    <Text
                      maxFontSizeMultiplier={1.15}
                      style={styles.metricLabel}
                    >
                      {metric.label}
                    </Text>

                    <Text
                      maxFontSizeMultiplier={1.1}
                      style={styles.metricValue}
                    >
                      {value}/10
                    </Text>
                  </View>

                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.noteCard}>
            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.sectionTitle}
            >
              Note
            </Text>

            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.note}
            >
              {entry.note?.trim() ||
                "Aucune note enregistrée pour ce suivi."}
            </Text>
          </View>

          {linkedProducts.length > 0 ? (
            <View style={styles.productsCard}>
              <Text
                maxFontSizeMultiplier={1.15}
                style={styles.sectionTitle}
              >
                Produits utilisés
              </Text>

              {linkedProducts.map(
                (
                  product: LinkedProduct,
                  index: number
                ) => (
                  <View
                    key={product.analysis_id}
                    style={[
                      styles.productRow,
                      index ===
                        linkedProducts.length - 1 &&
                        styles.productRowLast,
                    ]}
                  >
                    <View
                      style={styles.productText}
                    >
                      <Text
                        maxFontSizeMultiplier={1.15}
                        style={styles.productName}
                      >
                        {product.product_name}
                      </Text>

                      {product.product_category ? (
                        <Text
                          maxFontSizeMultiplier={1.1}
                          style={
                            styles.productCategory
                          }
                        >
                          {
                            product.product_category
                          }
                        </Text>
                      ) : null}
                    </View>

                    {typeof product.score ===
                    "number" ? (
                      <Text
                        maxFontSizeMultiplier={1.1}
                        style={styles.productScore}
                      >
                        {product.score}/100
                      </Text>
                    ) : null}
                  </View>
                )
              )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#D8CEC5",
  },

  eyebrow: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7DF",
    borderWidth: 1,
    borderColor: "#D8CEC5",
  },

  closeButtonPressed: {
    opacity: 0.65,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.card,
    backgroundColor: "#E5DCD4",
    marginBottom: spacing.sm,
  },

  date: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },

  metricsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  noteCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
  },

  productsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginTop: spacing.md,
  },

  sectionTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  metric: {
    marginBottom: spacing.md,
  },

  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  metricLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  metricValue: {
    fontSize: 13,
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

  note: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DCD4",
  },

  productRowLast: {
    borderBottomWidth: 0,
  },

  productText: {
    flex: 1,
    paddingRight: spacing.md,
  },

  productName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  productCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  productScore: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "700",
  },
});