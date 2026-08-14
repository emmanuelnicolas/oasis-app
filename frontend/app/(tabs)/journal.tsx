import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../src/auth";
import { useJournal } from "../../src/hooks/useJournal";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../src/theme";

import { JournalModal } from "../../src/components/journal/JournalModal";
import { TrackingDetailModal } from "../../src/components/skin_ai/components/TrackingDetailModal";
import { TrackingComparisonModal } from "../../src/components/skin_ai/components/TrackingComparisonModal";

import type { JournalEntry } from "../../src/types/journal";

function getImageUri(
  imageBase64?: string
) {
  if (!imageBase64) return null;

  if (imageBase64.startsWith("data:")) {
    return imageBase64;
  }

  return `data:image/jpeg;base64,${imageBase64}`;
}
export default function Journal() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const {
    entries,
    loading,

    pickerOpen,
    setPickerOpen,

    pickedImage,

    note,
    setNote,

    hydration,
    setHydration,

    glow,
    setGlow,

    texture,
    setTexture,

    irritation,
    setIrritation,

    breakouts,
    setBreakouts,

    redness,
    setRedness,

    saving,
    analyzing,
    analysis,

    recentProducts,
    selectedProducts,
    setSelectedProducts,

    pickImage,
    save,
    analyze,

    removeEntry,
  } = useJournal(token);

  const [
    selectedTracking,
    setSelectedTracking,
  ] = React.useState<JournalEntry | null>(
    null
  );

  const [
    comparisonEntries,
    setComparisonEntries,
  ] = React.useState<
    [JournalEntry, JournalEntry] | null
  >(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color={colors.primary}
          size="large"
        />
      </View>
    );
  }

  const recentEntries = (
    entries as JournalEntry[]
  ).slice(0, 3);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top + spacing.md,
            paddingBottom:
              insets.bottom + spacing.xxl,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            JOURNAL
          </Text>

          <Text style={styles.title}>
            Comment va votre peau ?
          </Text>

          <Text style={styles.subtitle}>
            Ajoutez régulièrement vos photos,
            symptômes et produits utilisés pour
            permettre à OASIS de mieux comprendre
            votre peau.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un suivi peau"
          onPress={pickImage}
          style={({ pressed }) => [
            styles.addCard,
            pressed && styles.addCardPressed,
          ]}
        >
          <View style={styles.addIcon}>
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.addContent}>
            <Text style={styles.addEyebrow}>
              AUJOURD’HUI
            </Text>

            <Text style={styles.addTitle}>
              Ajouter un suivi
            </Text>

            <Text style={styles.addDescription}>
              Photo, ressenti, symptômes et
              produits utilisés.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={21}
            color={colors.textPrimary}
          />
        </Pressable>

        <View style={styles.learningCard}>
          <View style={styles.learningIcon}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.textPrimary}
            />
          </View>

          <View style={styles.learningContent}>
            <Text style={styles.learningTitle}>
              Chaque suivi nourrit OASIS AI
            </Text>

            <Text style={styles.learningText}>
              Vos données permettent d’affiner le
              Digital Twin, les insights et les
              recommandations.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              DERNIERS SUIVIS
            </Text>

            <Text style={styles.sectionTitle}>
              Votre historique
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {entries.length}
            </Text>
          </View>
        </View>

{recentEntries.length > 0 ? (
  <View style={styles.entriesCard}>
    {recentEntries.map((entry, index) => {
      const uri = getImageUri(
        entry.image_base64
      );

      const productsCount =
        entry.linked_products?.length || 0;

      return (
        <Pressable
          key={entry.tracking_id}
          onPress={() =>
            setSelectedTracking(entry)
          }
          style={({ pressed }) => [
            styles.entryRow,
            index <
              recentEntries.length - 1 &&
              styles.entryRowBorder,
            pressed &&
              styles.entryRowPressed,
          ]}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.entryImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.entryImageFallback
              }
            >
              <Ionicons
                name="image-outline"
                size={20}
                color={
                  colors.textSecondary
                }
              />
            </View>
          )}

          <View style={styles.entryContent}>
            <View
              style={styles.entryTopRow}
            >
              <Text style={styles.entryTitle}>
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

              <Ionicons
                name="chevron-forward"
                size={17}
                color="#A99C92"
              />
            </View>

            <Text
              numberOfLines={1}
              style={styles.entryMetrics}
            >
              Hydratation {entry.hydration}/10
              {"  ·  "}
              Glow {entry.glow}/10
              {"  ·  "}
              Rougeurs {entry.redness}/10
            </Text>

            {productsCount > 0 ? (
              <Text
                style={styles.entryProducts}
              >
                {productsCount} produit
                {productsCount > 1
                  ? "s"
                  : ""}{" "}
                utilisé
                {productsCount > 1
                  ? "s"
                  : ""}
              </Text>
            ) : null}

            <Text
              numberOfLines={2}
              style={
                styles.entryDescription
              }
            >
              {entry.note?.trim()
                ? entry.note
                : "Aucune note ajoutée pour ce suivi."}
            </Text>
          </View>
        </Pressable>
      );
    })}
  </View>
) : (
  <View style={styles.emptyCard}>
    <Ionicons
      name="calendar-outline"
      size={22}
      color={colors.textSecondary}
    />

    <Text style={styles.emptyTitle}>
      Aucun suivi pour le moment
    </Text>

    <Text style={styles.emptyText}>
      Votre premier suivi apparaîtra ici.
    </Text>
  </View>
)}

        
      </ScrollView>

      <JournalModal
        visible={pickerOpen}
        bottomPadding={
          insets.bottom + spacing.md
        }
        pickedImage={pickedImage}
        note={note}
        setNote={setNote}
        hydration={hydration}
        setHydration={setHydration}
        glow={glow}
        setGlow={setGlow}
        texture={texture}
        setTexture={setTexture}
        irritation={irritation}
        setIrritation={setIrritation}
        breakouts={breakouts}
        setBreakouts={setBreakouts}
        redness={redness}
        setRedness={setRedness}
        recentProducts={recentProducts}
        selectedProducts={
          selectedProducts
        }
        setSelectedProducts={
          setSelectedProducts
        }
        analysis={analysis}
        analyzing={analyzing}
        saving={saving}
        onAnalyze={analyze}
        onSave={save}
        onClose={() =>
          setPickerOpen(false)
        }
      />

      <TrackingDetailModal
        visible={Boolean(
          selectedTracking
        )}
        entry={selectedTracking}
        onClose={() =>
          setSelectedTracking(null)
        }
      />

      <TrackingComparisonModal
        visible={Boolean(
          comparisonEntries
        )}
        firstEntry={
          comparisonEntries?.[0] ||
          null
        }
        secondEntry={
          comparisonEntries?.[1] ||
          null
        }
        onClose={() =>
          setComparisonEntries(null)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },

  content: {
    paddingHorizontal: spacing.lg,
  },

  header: {
    marginBottom: spacing.lg,
  },

  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  addCard: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  addCardPressed: {
    opacity: 0.72,
  },

  addIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },

  addContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },

  addEyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  addTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  addDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 3,
  },

  learningCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFE7E0",
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },

  learningIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3EE",
    marginRight: spacing.sm,
  },

  learningContent: {
    flex: 1,
    minWidth: 0,
  },

  learningTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },

  learningText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    color: colors.textSecondary,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
  },

  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7E0",
  },

  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  entriesCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  entryRow: {
  minHeight: 112,
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.md,
},

entryRowBorder: {
  borderBottomWidth: 1,
  borderBottomColor: "#E3DAD2",
},

entryRowPressed: {
  opacity: 0.7,
},

entryImage: {
  width: 72,
  height: 86,
  borderRadius: 14,
  backgroundColor: "#E5DCD4",
  marginRight: spacing.md,
},

entryImageFallback: {
  width: 72,
  height: 86,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#EFE7E0",
  marginRight: spacing.md,
},

entryContent: {
  flex: 1,
  minWidth: 0,
},

entryTopRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 4,
},

entryTitle: {
  fontSize: 14,
  color: colors.textPrimary,
  fontWeight: "700",
},

entryMetrics: {
  fontSize: 11,
  lineHeight: 16,
  color: colors.textSecondary,
  marginBottom: 3,
},

entryProducts: {
  fontSize: 11,
  lineHeight: 16,
  color: colors.textPrimary,
  fontWeight: "600",
  marginBottom: 3,
},

entryDescription: {
  fontSize: 12,
  lineHeight: 17,
  color: colors.textSecondary,
},

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: 3,
  },

  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

});