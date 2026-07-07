import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";
import type { JournalEntry } from "../../types/journal";

type Props = {
  entry: JournalEntry;
  onDelete: (id: string) => void;
};

export function JournalEntryCard({ entry, onDelete }: Props) {
  return (
    <View style={styles.entryCard} testID={`entry-${entry.tracking_id}`}>
      <Image
        source={{ uri: `data:image/jpeg;base64,${entry.image_base64}` }}
        style={styles.entryImage}
      />

      <View style={styles.entryFooter}>
        <Text style={styles.entryDate}>
          {new Date(entry.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </Text>

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
      </View>

      {!!entry.note && (
        <Text style={styles.entryNote} numberOfLines={2}>
          {entry.note}
        </Text>
      )}

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>💧 {entry.hydration}</Text>
        <Text style={styles.metric}>✨ {entry.glow}</Text>
        <Text style={styles.metric}>🧴 {entry.texture}</Text>
      </View>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>🔥 {entry.irritation}</Text>
        <Text style={styles.metric}>🔴 {entry.breakouts}</Text>
        <Text style={styles.metric}>🌸 {entry.redness}</Text>
      </View>
    </View>
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
  entryImage: {
    width: "100%",
    height: 160,
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
  metric: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});