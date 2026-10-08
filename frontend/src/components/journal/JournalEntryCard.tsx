import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  spacing,
} from "../../theme";

import type {
  JournalEntry,
} from "../../types/journal";

type Props = {
  entry: JournalEntry;
  onDelete: (id: string) => void;
  selected?: boolean;
  selectionEnabled?: boolean;
  onSelect?: (entry: JournalEntry) => void;
};

function getImageUri(entry: JournalEntry) {
  if (entry.image_url) {
    return entry.image_url;
  }

  const imageBase64 = entry.image_base64;

  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }

  return `data:image/jpeg;base64,${imageBase64}`;
}

export function JournalEntryCard({
  entry,
  onDelete,
  selected = false,
  selectionEnabled = false,
  onSelect,
}: Props) {
  const handlePress = () => {
    if (selectionEnabled && onSelect) {
      onSelect(entry);
    }
  };

  const imageUri = getImageUri(entry);

  return (
    <TouchableOpacity
      activeOpacity={selectionEnabled ? 0.8 : 1}
      onPress={handlePress}
      disabled={!selectionEnabled}
      style={[
        styles.entryCard,
        selected && styles.entryCardSelected,
      ]}
      testID={`entry-${entry.tracking_id}`}
    >
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.entryImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={26}
              color={colors.textDisabled}
            />
          </View>
        )}

        {selectionEnabled && (
          <View
            style={[
              styles.selectionBadge,
              selected && styles.selectionBadgeSelected,
            ]}
          >
            <Ionicons
              name={selected ? "checkmark" : "add"}
              size={15}
              color={selected ? "#FFFFFF" : colors.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.entryFooter}>
        <Text style={styles.entryDate}>
          {new Date(entry.created_at).toLocaleDateString(
            "fr-FR",
            {
              day: "numeric",
              month: "short",
            }
          )}
        </Text>

        {!selectionEnabled && (
          <TouchableOpacity
            onPress={() => onDelete(entry.tracking_id)}
            testID={`delete-${entry.tracking_id}`}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.textDisabled}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!entry.note && (
        <Text
          style={styles.entryNote}
          numberOfLines={2}
        >
          {entry.note}
        </Text>
      )}

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>
          💧 {entry.hydration}
        </Text>

        <Text style={styles.metric}>
          ✨ {entry.glow}
        </Text>

        <Text style={styles.metric}>
          🧴 {entry.texture}
        </Text>
      </View>

      <View
        style={[
          styles.metricsRow,
          styles.lastMetricsRow,
        ]}
      >
        <Text style={styles.metric}>
          🔥 {entry.irritation}
        </Text>

        <Text style={styles.metric}>
          🔴 {entry.breakouts}
        </Text>

        <Text style={styles.metric}>
          🌸 {entry.redness}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },

  entryCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  imageContainer: {
    position: "relative",
  },

  entryImage: {
    width: "100%",
    height: 160,
  },

  imagePlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },

  selectionBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  selectionBadgeSelected: {
    backgroundColor: colors.primary,
  },

  entryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
  },

  entryDate: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
  },

  entryNote: {
    fontSize: 12,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: spacing.sm,
  },

  lastMetricsRow: {
    paddingBottom: spacing.sm,
  },

  metric: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});