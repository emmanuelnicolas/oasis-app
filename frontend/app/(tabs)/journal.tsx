import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";

type Entry = { entry_id: string; image_base64: string; note: string; created_at: string };

export default function Journal() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ skin_type: string; concerns: string[]; summary: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const e = await apiFetch(token, "/journal");
      setEntries(e || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès à vos photos est nécessaire.");
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets && res.assets[0].base64) {
      setPickedImage(res.assets[0].base64);
      setPickerOpen(true);
      setNote("");
      setAnalysis(null);
    }
  };

  const save = async () => {
    if (!pickedImage) return;
    setSaving(true);
    try {
      await apiFetch(token, "/journal", {
        method: "POST",
        body: JSON.stringify({ image_base64: pickedImage, note }),
      });
      setPickerOpen(false);
      setPickedImage(null);
      setNote("");
      setAnalysis(null);
      await load();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const analyze = async () => {
    if (!pickedImage) return;
    setAnalyzing(true);
    try {
      const result = await apiFetch(token, "/skin/analyze", {
        method: "POST",
        body: JSON.stringify({ image_base64: pickedImage }),
      });
      setAnalysis(result);
    } catch (e: any) {
      Alert.alert("Erreur d'analyse", e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeEntry = async (id: string) => {
    try {
      await apiFetch(token, `/journal/${id}`, { method: "DELETE" });
      setEntries((p) => p.filter((e) => e.entry_id !== id));
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

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
        <Text style={styles.subtitle}>Suivez votre progression au fil du temps. Vous pouvez aussi obtenir une analyse IA de votre peau.</Text>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>Aucune photo encore.</Text>
            <Text style={styles.emptyHint}>Ajoutez votre premier selfie pour commencer.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {entries.map((e) => (
              <View key={e.entry_id} style={styles.entryCard} testID={`entry-${e.entry_id}`}>
                <Image source={{ uri: `data:image/jpeg;base64,${e.image_base64}` }} style={styles.entryImage} />
                <View style={styles.entryFooter}>
                  <Text style={styles.entryDate}>{new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</Text>
                  <TouchableOpacity onPress={() => removeEntry(e.entry_id)} testID={`delete-${e.entry_id}`}>
                    <Ionicons name="trash-outline" size={16} color={colors.textDisabled} />
                  </TouchableOpacity>
                </View>
                {!!e.note && <Text style={styles.entryNote} numberOfLines={2}>{e.note}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle entrée</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} testID="close-modal-btn">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {pickedImage && (
                <Image source={{ uri: `data:image/jpeg;base64,${pickedImage}` }} style={styles.preview} />
              )}

              <Text style={styles.label}>Note (optionnel)</Text>
              <TextInput
                testID="journal-note-input"
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Comment vous sentez-vous aujourd'hui ?"
                placeholderTextColor={colors.textDisabled}
                multiline
              />

              {analysis && (
                <View style={styles.analysisCard} testID="analysis-result">
                  <Text style={styles.analysisLabel}>Analyse IA</Text>
                  <Text style={styles.analysisType}>Type: {analysis.skin_type}</Text>
                  {analysis.concerns?.length > 0 && (
                    <Text style={styles.analysisConcerns}>Préoccupations: {analysis.concerns.join(", ")}</Text>
                  )}
                  <Text style={styles.analysisSummary}>{analysis.summary}</Text>
                </View>
              )}

              <TouchableOpacity testID="analyze-btn" style={styles.secondaryBtn} onPress={analyze} disabled={analyzing}>
                {analyzing ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.secondaryBtnText}>✦ Analyser ma peau (IA)</Text>}
              </TouchableOpacity>

              <TouchableOpacity testID="save-entry-btn" style={styles.primaryBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Enregistrer</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  entryCard: { width: "47%", backgroundColor: colors.surface, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  entryImage: { width: "100%", height: 160 },
  entryFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.sm },
  entryDate: { color: colors.textSecondary, fontSize: 12, letterSpacing: 1 },
  entryNote: { fontSize: 12, color: colors.textPrimary, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 22, color: colors.textPrimary, fontFamily: fonts.heading },
  preview: { width: "100%", height: 240, borderRadius: radius.card, marginBottom: spacing.md },
  label: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: spacing.md, fontSize: 14, color: colors.textPrimary, minHeight: 70, marginBottom: spacing.md },
  analysisCard: { backgroundColor: "rgba(126,154,136,0.1)", borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: "rgba(126,154,136,0.3)" },
  analysisLabel: { fontSize: 11, color: colors.primary, letterSpacing: 2, textTransform: "uppercase", fontWeight: "500" },
  analysisType: { fontSize: 16, color: colors.textPrimary, marginTop: spacing.xs, fontWeight: "500" },
  analysisConcerns: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  analysisSummary: { fontSize: 13, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 18 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 14, alignItems: "center", marginTop: spacing.sm },
  primaryBtnText: { color: "#fff", fontWeight: "500", fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.button, paddingVertical: 12, alignItems: "center", marginBottom: spacing.sm },
  secondaryBtnText: { color: colors.primary, fontWeight: "500", fontSize: 14 },
});
