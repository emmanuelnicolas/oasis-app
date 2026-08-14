import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
} from "../../../theme";

type Props = {
  learnings: any;
  onPress?: () => void;
};

type DiscoveryItem = {
  key: string;
  name: string;
  description: string;
  positive: boolean;
};

export function DiscoveriesCard({
  learnings,
  onPress,
}: Props) {
  const ingredient =
    learnings?.ingredient_intelligence || {};

  const positives =
    ingredient.positive_ingredients || [];

  const watch =
    ingredient.watch_ingredients || [];

  const items: DiscoveryItem[] = [
    ...positives
      .slice(0, 3)
      .map((item: any) => ({
        key: `positive-${item.ingredient}`,
        name: item.ingredient,
        description: "Impact positif",
        positive: true,
      })),

    ...watch
      .slice(0, 2)
      .map((item: any) => ({
        key: `watch-${item.ingredient}`,
        name: item.ingredient,
        description: "À surveiller",
        positive: false,
      })),
  ];

  const hasDiscoveries =
    items.length > 0;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voir ce qu’OASIS apprend"
        onPress={onPress}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <View style={styles.headerIdentity}>
          <View style={styles.iconBubble}>
            <Ionicons
              name="flask-outline"
              size={18}
              color={colors.textPrimary}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              DÉCOUVERTES
            </Text>

            <Text style={styles.title}>
              Ce qu’OASIS apprend
            </Text>
          </View>
        </View>

        <View style={styles.arrowButton}>
          <Ionicons
            name="arrow-forward"
            size={19}
            color={colors.textPrimary}
          />
        </View>
      </Pressable>

      {hasDiscoveries ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.itemsContent
          }
        >
          {items.map((item) => (
            <View
              key={item.key}
              style={styles.discoveryItem}
            >
              <View
                style={[
                  styles.signBubble,
                  item.positive
                    ? styles.positiveBubble
                    : styles.warningBubble,
                ]}
              >
                <Text style={styles.signText}>
                  {item.positive ? "+" : "−"}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={styles.name}
              >
                {item.name}
              </Text>

              <Text
                numberOfLines={2}
                style={styles.description}
              >
                {item.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <View style={styles.emptyTextContent}>
            <Text style={styles.emptyTitle}>
              OASIS apprend encore
            </Text>

            <Text style={styles.emptyDescription}>
  Ajoutez des suivis et des retours
  pour détecter vos ingrédients clés.
</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  headerPressed: {
    opacity: 0.7,
  },

  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
    marginRight: spacing.sm,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 2,
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1EAE4",
    borderWidth: 1,
    borderColor: "#DED2C8",
    marginLeft: spacing.md,
  },

  itemsContent: {
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },

  discoveryItem: {
    width: 128,
    minHeight: 104,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD1C7",
    backgroundColor: "#FBF7F3",
    padding: spacing.sm,
  },

  signBubble: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  positiveBubble: {
    backgroundColor: "#263B31",
  },

  warningBubble: {
    backgroundColor: "#927161",
  },

  signText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "600",
  },

  name: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  description: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },

  emptyState: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F1EAE4",
    padding: spacing.md,
  },

  emptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3EE",
    marginRight: spacing.sm,
  },

emptyTextContent: {
  flex: 1,
  minWidth: 0,
},

  emptyTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});