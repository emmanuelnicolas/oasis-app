import React, { useState } from "react";
import {
  Alert,
  Image,
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

import type { JournalEntry } from "../../../types/journal";

type Props = {
  entries: JournalEntry[];

  onDeleteEntry: (
    trackingId: string
  ) => void | Promise<void>;

  onOpenEntry: (
    entry: JournalEntry
  ) => void;

  onCompareEntries: (
    firstEntry: JournalEntry,
    secondEntry: JournalEntry
  ) => void;
};

function getImageUri(
  imageBase64?: string | null
) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }

  return `data:image/jpeg;base64,${imageBase64}`;
}

export function PhotosCard({
  entries,
  onDeleteEntry,
  onOpenEntry,
  onCompareEntries,
}: Props) {
  const [comparisonMode, setComparisonMode] =
    useState(false);

  const [
    selectedTrackingIds,
    setSelectedTrackingIds,
  ] = useState<string[]>([]);

  const photos = (entries || [])
    .filter((entry) =>
      Boolean(entry.image_base64)
    )
    .slice(0, 6);

  const resetComparison = () => {
    setComparisonMode(false);
    setSelectedTrackingIds([]);
  };

  const toggleComparisonMode = () => {
    if (comparisonMode) {
      resetComparison();
      return;
    }

    if (photos.length < 2) {
      Alert.alert(
        "Comparaison indisponible",
        "Ajoutez au moins deux suivis avec photo pour comparer votre évolution."
      );
      return;
    }

    setComparisonMode(true);
    setSelectedTrackingIds([]);
  };

  const selectForComparison = (
    entry: JournalEntry
  ) => {
    const alreadySelected =
      selectedTrackingIds.includes(
        entry.tracking_id
      );

    if (alreadySelected) {
      setSelectedTrackingIds((current) =>
        current.filter(
          (trackingId) =>
            trackingId !== entry.tracking_id
        )
      );

      return;
    }

    const nextSelection = [
      ...selectedTrackingIds,
      entry.tracking_id,
    ];

    setSelectedTrackingIds(nextSelection);

    if (nextSelection.length === 2) {
      const selectedEntries = nextSelection
        .map((trackingId) =>
          photos.find(
            (photo) =>
              photo.tracking_id === trackingId
          )
        )
        .filter(
          (
            selectedEntry
          ): selectedEntry is JournalEntry =>
            Boolean(selectedEntry)
        )
        .sort(
          (firstEntry, secondEntry) =>
            new Date(
              firstEntry.created_at
            ).getTime() -
            new Date(
              secondEntry.created_at
            ).getTime()
        );

      if (selectedEntries.length === 2) {
        onCompareEntries(
          selectedEntries[0],
          selectedEntries[1]
        );
      }

      resetComparison();
    }
  };

  const handlePhotoPress = (
    entry: JournalEntry
  ) => {
    if (comparisonMode) {
      selectForComparison(entry);
      return;
    }

    onOpenEntry(entry);
  };

  const confirmDelete = (
    trackingId: string
  ) => {
    Alert.alert(
      "Supprimer ce suivi ?",
      "La photo et les données associées seront supprimées définitivement.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            void onDeleteEntry(trackingId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={styles.eyebrow}
          >
            HISTORIQUE PEAU
          </Text>

          <Text
            maxFontSizeMultiplier={1.15}
            style={styles.title}
          >
            Vos photos récentes
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              comparisonMode
                ? "Annuler la comparaison"
                : "Comparer deux suivis"
            }
            onPress={toggleComparisonMode}
            style={({ pressed }) => [
              styles.compareButton,
              comparisonMode &&
                styles.compareButtonActive,
              pressed &&
                styles.compareButtonPressed,
            ]}
          >
            <Ionicons
              name={
                comparisonMode
                  ? "close-outline"
                  : "git-compare-outline"
              }
              size={16}
              color={
                comparisonMode
                  ? "#FFFFFF"
                  : colors.textPrimary
              }
            />

            <Text
              style={[
                styles.compareButtonText,
                comparisonMode &&
                  styles.compareButtonTextActive,
              ]}
            >
              {comparisonMode
                ? "Annuler"
                : "Comparer"}
            </Text>
          </Pressable>

          <Text
            maxFontSizeMultiplier={1.1}
            style={styles.count}
          >
            {photos.length}
          </Text>
        </View>
      </View>

      {comparisonMode ? (
        <View style={styles.comparisonHint}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textSecondary}
          />

          <Text style={styles.comparisonHintText}>
            Sélectionnez deux photos à comparer
            ({selectedTrackingIds.length}/2).
          </Text>
        </View>
      ) : null}

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text
            maxFontSizeMultiplier={1.15}
            style={styles.emptyTitle}
          >
            Votre évolution apparaîtra ici
          </Text>

          <Text
            maxFontSizeMultiplier={1.15}
            style={styles.emptyText}
          >
            Ajoutez régulièrement un selfie pour
            comparer visuellement votre peau dans
            le temps.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.photosRow
          }
        >
          {photos.map((entry) => {
            const uri = getImageUri(
              entry.image_base64
            );

            const selected =
              selectedTrackingIds.includes(
                entry.tracking_id
              );

            if (!uri) return null;

            return (
              <View
                key={entry.tracking_id}
                style={styles.photoWrapper}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    comparisonMode
                      ? "Sélectionner ce suivi pour la comparaison"
                      : "Ouvrir le détail du suivi"
                  }
                  onPress={() =>
                    handlePhotoPress(entry)
                  }
                  style={({ pressed }) => [
                    styles.imageContainer,
                    selected &&
                      styles.imageContainerSelected,
                    pressed &&
                      styles.imagePressed,
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />

                  {comparisonMode ? (
                    <View
                      style={[
                        styles.selectionBadge,
                        selected &&
                          styles.selectionBadgeSelected,
                      ]}
                    >
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#FFFFFF"
                        />
                      ) : (
                        <Text
                          style={
                            styles.selectionNumber
                          }
                        >
                          +
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Supprimer ce suivi"
                      onPress={(event) => {
                        event.stopPropagation();

                        confirmDelete(
                          entry.tracking_id
                        );
                      }}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed &&
                          styles.deleteButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  )}
                </Pressable>

                {entry.created_at ? (
                  <Text
                    maxFontSizeMultiplier={1.1}
                    style={styles.date}
                  >
                    {new Date(
                      entry.created_at
                    ).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "short",
                      }
                    )}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },

  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  compareButton: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    backgroundColor: "#EFE7DF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  compareButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  compareButtonPressed: {
    opacity: 0.7,
  },

  compareButtonText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  compareButtonTextActive: {
    color: "#FFFFFF",
  },

  count: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFE7DF",
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 34,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  comparisonHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#F1EAE4",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  comparisonHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  photosRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },

  photoWrapper: {
    width: 112,
  },

  imageContainer: {
    position: "relative",
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },

  imageContainerSelected: {
    borderColor: colors.primary,
  },

  imagePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  photo: {
    width: 108,
    height: 134,
    borderRadius: radius.md,
    backgroundColor: "#E5DCD4",
  },

  deleteButton: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      "rgba(50, 38, 33, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.92 }],
  },

  selectionBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      "rgba(248, 243, 238, 0.92)",
    borderWidth: 1,
    borderColor: "#B9A99C",
    alignItems: "center",
    justifyContent: "center",
  },

  selectionBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  selectionNumber: {
    fontSize: 19,
    lineHeight: 21,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  empty: {
    backgroundColor: "#F1EAE4",
    borderRadius: radius.md,
    padding: spacing.lg,
  },

  emptyTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});