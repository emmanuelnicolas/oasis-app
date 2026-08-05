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
  firstEntry: JournalEntry | null;
  secondEntry: JournalEntry | null;
  onClose: () => void;
};

type MetricKey =
  | "hydration"
  | "glow"
  | "texture"
  | "irritation"
  | "breakouts"
  | "redness";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  reverse?: boolean;
};

const METRICS: MetricDefinition[] = [
  {
    key: "hydration",
    label: "Hydratation",
  },
  {
    key: "glow",
    label: "Glow",
  },
  {
    key: "texture",
    label: "Texture",
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
];

function getImageUri(
  imageBase64?: string
) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }

  return `data:image/jpeg;base64,${imageBase64}`;
}

function formatDate(dateValue: string) {
  return new Date(
    dateValue
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMetricEvolution(
  firstValue: number,
  secondValue: number,
  reverse = false
) {
  const difference =
    secondValue - firstValue;

  if (difference === 0) {
    return {
      label: "Stable",
      value: "0",
      icon: "remove-outline" as const,
      status: "stable" as const,
    };
  }

  const isImprovement = reverse
    ? difference < 0
    : difference > 0;

  return {
    label: isImprovement
      ? "Amélioration"
      : "À surveiller",
    value:
      difference > 0
        ? `+${difference}`
        : `${difference}`,
    icon: isImprovement
      ? ("trending-up-outline" as const)
      : ("warning-outline" as const),
    status: isImprovement
      ? ("positive" as const)
      : ("negative" as const),
  };
}

function ProductList({
  title,
  products,
}: {
  title: string;
  products: LinkedProduct[];
}) {
  return (
    <View style={styles.productSection}>
      <Text style={styles.productSectionTitle}>
        {title}
      </Text>

      {products.length === 0 ? (
        <Text style={styles.emptyProductText}>
          Aucun produit associé.
        </Text>
      ) : (
        products.map((product, index) => (
          <View
            key={`${product.analysis_id}-${index}`}
            style={[
              styles.productRow,
              index === products.length - 1 &&
                styles.productRowLast,
            ]}
          >
            <View style={styles.productText}>
              <Text style={styles.productName}>
                {product.product_name}
              </Text>

              {product.product_category ? (
                <Text
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
              <Text style={styles.productScore}>
                {product.score}/100
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

export function TrackingComparisonModal({
  visible,
  firstEntry,
  secondEntry,
  onClose,
}: Props) {
  if (!firstEntry || !secondEntry) {
    return null;
  }

  const firstImageUri = getImageUri(
    firstEntry.image_base64
  );

  const secondImageUri = getImageUri(
    secondEntry.image_base64
  );

  const firstProducts =
    firstEntry.linked_products || [];

  const secondProducts =
    secondEntry.linked_products || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              ÉVOLUTION DE LA PEAU
            </Text>

            <Text style={styles.title}>
              Comparaison
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer la comparaison"
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.photosRow}>
            <View style={styles.photoColumn}>
              {firstImageUri ? (
                <Image
                  source={{
                    uri: firstImageUri,
                  }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.photo,
                    styles.photoPlaceholder,
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={
                      colors.textSecondary
                    }
                  />
                </View>
              )}

              <Text style={styles.photoLabel}>
                Avant
              </Text>

              <Text style={styles.photoDate}>
                {formatDate(
                  firstEntry.created_at
                )}
              </Text>
            </View>

            <View style={styles.arrowWrapper}>
              <Ionicons
                name="arrow-forward"
                size={22}
                color={colors.textSecondary}
              />
            </View>

            <View style={styles.photoColumn}>
              {secondImageUri ? (
                <Image
                  source={{
                    uri: secondImageUri,
                  }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.photo,
                    styles.photoPlaceholder,
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={
                      colors.textSecondary
                    }
                  />
                </View>
              )}

              <Text style={styles.photoLabel}>
                Après
              </Text>

              <Text style={styles.photoDate}>
                {formatDate(
                  secondEntry.created_at
                )}
              </Text>
            </View>
          </View>

          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>
              Évolution des indicateurs
            </Text>

            {METRICS.map((metric) => {
              const firstValue = Number(
                firstEntry[metric.key] || 0
              );

              const secondValue = Number(
                secondEntry[metric.key] || 0
              );

              const evolution =
                getMetricEvolution(
                  firstValue,
                  secondValue,
                  metric.reverse
                );

              return (
                <View
                  key={metric.key}
                  style={styles.metricRow}
                >
                  <View style={styles.metricInfo}>
                    <Text
                      style={styles.metricLabel}
                    >
                      {metric.label}
                    </Text>

                    <Text
                      style={styles.metricValues}
                    >
                      {firstValue}/10 →{" "}
                      {secondValue}/10
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.evolutionBadge,
                      evolution.status ===
                        "positive" &&
                        styles.evolutionPositive,
                      evolution.status ===
                        "negative" &&
                        styles.evolutionNegative,
                      evolution.status ===
                        "stable" &&
                        styles.evolutionStable,
                    ]}
                  >
                    <Ionicons
                      name={evolution.icon}
                      size={15}
                      color={
                        evolution.status ===
                        "positive"
                          ? "#346B4A"
                          : evolution.status ===
                            "negative"
                          ? "#8B3B35"
                          : colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.evolutionText,
                        evolution.status ===
                          "positive" &&
                          styles.evolutionTextPositive,
                        evolution.status ===
                          "negative" &&
                          styles.evolutionTextNegative,
                      ]}
                    >
                      {evolution.value}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>
              Notes
            </Text>

            <View style={styles.noteBlock}>
              <Text style={styles.noteDate}>
                {formatDate(
                  firstEntry.created_at
                )}
              </Text>

              <Text style={styles.noteText}>
                {firstEntry.note?.trim() ||
                  "Aucune note."}
              </Text>
            </View>

            <View style={styles.noteDivider} />

            <View style={styles.noteBlock}>
              <Text style={styles.noteDate}>
                {formatDate(
                  secondEntry.created_at
                )}
              </Text>

              <Text style={styles.noteText}>
                {secondEntry.note?.trim() ||
                  "Aucune note."}
              </Text>
            </View>
          </View>

          <View style={styles.productsCard}>
            <Text style={styles.sectionTitle}>
              Produits utilisés
            </Text>

            <ProductList
              title="Avant"
              products={firstProducts}
            />

            <View
              style={styles.productsDivider}
            />

            <ProductList
              title="Après"
              products={secondProducts}
            />
          </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#D8CEC5",
  },

  headerText: {
    flex: 1,
    paddingRight: spacing.md,
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

  photosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  photoColumn: {
    flex: 1,
    alignItems: "center",
  },

  arrowWrapper: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  photo: {
    width: "100%",
    aspectRatio: 0.82,
    borderRadius: radius.card,
    backgroundColor: "#E5DCD4",
  },

  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  photoLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
    marginTop: spacing.sm,
  },

  photoDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  metricsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  notesCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  productsCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
  },

  sectionTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.md,
  },

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E5DCD4",
  },

  metricInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },

  metricLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  metricValues: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  evolutionBadge: {
    minWidth: 58,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  evolutionPositive: {
    backgroundColor: "#E4F0E8",
  },

  evolutionNegative: {
    backgroundColor: "#F4E3E1",
  },

  evolutionStable: {
    backgroundColor: "#ECE7E1",
  },

  evolutionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  evolutionTextPositive: {
    color: "#346B4A",
  },

  evolutionTextNegative: {
    color: "#8B3B35",
  },

  noteBlock: {
    paddingVertical: spacing.xs,
  },

  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },

  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },

  noteDivider: {
    height: 1,
    backgroundColor: "#E5DCD4",
    marginVertical: spacing.md,
  },

  productSection: {
    marginBottom: spacing.sm,
  },

  productSectionTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },

  emptyProductText: {
    fontSize: 13,
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

  productsDivider: {
    height: 1,
    backgroundColor: "#E5DCD4",
    marginVertical: spacing.md,
  },
});