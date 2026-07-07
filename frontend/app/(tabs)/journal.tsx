import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth";
import { Ionicons } from "@expo/vector-icons";
import { useJournal } from "../../src/hooks/useJournal";
import { colors, fonts, radius, spacing } from "../../src/theme";
import { InsightsCard } from "../../src/components/journal/InsightsCard";
import { LearningsCard } from "../../src/components/journal/LearningsCard";
import { FeedbackCard } from "../../src/components/journal/FeedbackCard";
import { JournalEntryCard } from "../../src/components/journal/JournalEntryCard";
import { JournalModal } from "../../src/components/journal/JournalModal";



export default function Journal() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
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
  pendingFeedback,
  learnings,
  insights,
  pickImage,
  save,
  analyze,
  removeEntry,
  submitFeedback,
} = useJournal(token);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity testID="add-entry-btn" style={styles.addBtn} onPress={pickImage}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Suivez l'évolution de votre peau et laissez OASIS apprendre de vos routines.</Text>
<FeedbackCard
  pendingFeedback={pendingFeedback}
  onSubmit={submitFeedback}
/>
<LearningsCard learnings={learnings} />


<InsightsCard insights={insights} />
  
        {entries.length === 0 ? (
  <View style={styles.empty}>
    <Ionicons
      name="camera-outline"
      size={48}
      color={colors.textDisabled}
    />
    <Text style={styles.emptyText}>
      Aucune photo encore.
    </Text>
    <Text style={styles.emptyHint}>
      Ajoutez votre premier selfie pour commencer.
    </Text>
  </View>
) : (
  <View style={styles.grid}>
    {entries.map((entry) => (
      <JournalEntryCard
        key={entry.tracking_id}
        entry={entry}
        onDelete={removeEntry}
      />
    ))}
  </View>
)}
      </ScrollView>
	
      <JournalModal
  visible={pickerOpen}
  bottomPadding={insets.bottom + spacing.md}
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
  selectedProducts={selectedProducts}
  setSelectedProducts={setSelectedProducts}
  analysis={analysis}
  analyzing={analyzing}
  saving={saving}
  onAnalyze={analyze}
  onSave={save}
  onClose={() => setPickerOpen(false)}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  empty: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textPrimary, fontSize: 16, marginTop: spacing.md, fontWeight: "500" },
  emptyHint: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
});
