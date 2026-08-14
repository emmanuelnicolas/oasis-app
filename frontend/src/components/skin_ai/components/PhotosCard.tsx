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

  onAddTracking?: () => void;
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
  onAddTracking,
}: Props) {
  const [
    comparisonMode,
    setComparisonMode,
  ] = useState(false);

  const [
    selectedTrackingIds,
    setSelectedTrackingIds,
  ] = useState<string[]>([]);

  const photos = (entries || [])
    .filter((entry) =>
      Boolean(entry.image_base64)
    )
    .slice(0, 8);

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
      setSelectedTrackingIds(
        (current) =>
          current.filter(
            (trackingId) =>
              trackingId !==
              entry.tracking_id
          )
      );

      return;
    }

    const nextSelection = [
      ...selectedTrackingIds,
      entry.tracking_id,
    ];

    setSelectedTrackingIds(
      nextSelection
    );

    if (nextSelection.length === 2) {
      const selectedEntries =
        nextSelection
          .map((trackingId) =>
            photos.find(
              (photo) =>
                photo.tracking_id ===
                trackingId
            )
          )
          .filter(
            (
              selectedEntry
            ): selectedEntry is JournalEntry =>
              Boolean(selectedEntry)
          )
          .sort(
            (
              firstEntry,
              secondEntry
            ) =>
              new Date(
                firstEntry.created_at
              ).getTime() -
              new Date(
                secondEntry.created_at
              ).getTime()
          );

      if (
        selectedEntries.length === 2
      ) {
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
            void onDeleteEntry(
              trackingId
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.iconBubble}>
            <Ionicons
              name="images-outline"
              size={18}
              color={colors.textPrimary}
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              HISTORIQUE PEAU
            </Text>

            <Text
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.88}
  style={styles.title}
>
  Vos photos récentes
</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            comparisonMode
              ? "Annuler la comparaison"
              : "Comparer deux suivis"
          }
          onPress={toggleComparisonMode}
          hitSlop={8}
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
            size={19}
            color={
              comparisonMode
                ? "#FFFFFF"
                : colors.textPrimary
            }
          />
        </Pressable>
      </View>

      {comparisonMode ? (
        <View style={styles.comparisonHint}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors.textSecondary}
          />

          <Text
            numberOfLines={2}
            style={
              styles.comparisonHintText
            }
          >
            Sélectionnez deux photos
            ({selectedTrackingIds.length}/2)
          </Text>
        </View>
      ) : null}

      {photos.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter votre première photo"
          onPress={onAddTracking}
          style={({ pressed }) => [
            styles.empty,
            pressed && styles.emptyPressed,
          ]}
        >
          <View style={styles.emptyIcon}>
            <Ionicons
              name="camera-outline"
              size={21}
              color={colors.textPrimary}
            />
          </View>

          <View style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>
              Ajoutez votre première photo
            </Text>

            <Text style={styles.emptyText}>
  Suivez visuellement l’évolution de votre peau.
</Text>
          </View>

          <Ionicons
            name="add"
            size={21}
            color={colors.textPrimary}
          />
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
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
                      ? "Sélectionner cette photo"
                      : "Ouvrir ce suivi"
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
                          size={15}
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
                        size={14}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  )}
                </Pressable>

                {entry.created_at ? (
                  <Text
                    numberOfLines={1}
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter une nouvelle photo"
            onPress={onAddTracking}
            style={({ pressed }) => [
              styles.addPhotoButton,
              pressed &&
                styles.addPhotoButtonPressed,
            ]}
          >
            <Ionicons
              name="add"
              size={24}
              color={colors.textPrimary}
            />

            <Text style={styles.addPhotoText}>
              Ajouter
            </Text>
          </Pressable>
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
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
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
    minWidth: 0,
  },

  eyebrow: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.3,
    marginBottom: 2,
  },

  title: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  compareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    backgroundColor: "#F1EAE4",
  },

  compareButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  compareButtonPressed: {
    opacity: 0.68,
  },

  comparisonHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EAE4",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  comparisonHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },

  photosRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },

  photoWrapper: {
    width: 90,
  },

  imageContainer: {
    position: "relative",
    width: 88,
    height: 106,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },

  imageContainerSelected: {
    borderColor: colors.primary,
  },

  imagePressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#E5DCD4",
  },

  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      "rgba(50, 38, 33, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.92,
      },
    ],
  },

  selectionBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
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
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  date: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  addPhotoButton: {
    width: 88,
    height: 106,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BFAFA3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3ECE6",
  },

  addPhotoButtonPressed: {
    opacity: 0.68,
  },

  addPhotoText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },

  empty: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EAE4",
    borderRadius: radius.md,
    padding: spacing.md,
  },

  emptyPressed: {
    opacity: 0.7,
  },

  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3EE",
    marginRight: spacing.sm,
  },

  emptyContent: {
    flex: 1,
	minWidth: 0,
  },

  emptyTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },

  emptyText: {
  fontSize: 12,
  lineHeight: 17,
  color: colors.textSecondary,
  flexShrink: 1,
},
});