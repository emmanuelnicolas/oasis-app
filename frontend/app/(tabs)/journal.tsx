import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";

type Entry = {
  tracking_id: string;
  image_base64?: string;
  note?: string;
  hydration: number;
  glow: number;
  texture: number;
  irritation: number;
  breakouts: number;
  redness: number;
  created_at: string;
};

export default function Journal() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [hydration, setHydration] = useState(5);
  const [glow, setGlow] = useState(5);
  const [texture, setTexture] = useState(5);
  const [irritation, setIrritation] = useState(1);
  const [breakouts, setBreakouts] = useState(1);
  const [redness, setRedness] = useState(1);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ skin_type: string; concerns: string[]; summary: string } | null>(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<any[]>([]);
  const [learnings, setLearnings] = useState<any>(null);
  const sortedEntries = [...entries].sort(
  (a, b) =>
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime()
);

const latest = sortedEntries[0];
const previous = sortedEntries[1];

const getTrend = (key: keyof Entry, label: string, emoji: string, reverse = false) => {
  if (!latest || !previous) return null;

  const diff = Number(latest[key]) - Number(previous[key]);

  if (diff === 0) {
    return `${emoji} ${label} est stable.`;
  }

  const isPositive = reverse ? diff < 0 : diff > 0;

  if (isPositive) {
    return `${emoji} ${label} s'améliore.`;
  }

  return `${emoji} ${label} est à surveiller.`;
};


const insights = [
  getTrend("hydration", "Votre hydratation", "💧"),
  getTrend("glow", "Votre glow", "✨"),
  getTrend("texture", "Votre texture", "🧴"),
  getTrend("irritation", "Votre irritation", "🔥", true),
  getTrend("breakouts", "Vos boutons", "🔴", true),
  getTrend("redness", "Vos rougeurs", "🌸", true),
].filter(Boolean);

const load = useCallback(async () => {
  try {
    const e = await apiFetch(token, "/skin/tracking");
	setEntries(e || []);
	
	const products = await apiFetch(
  token,
  "/products/recent"
);

setRecentProducts(products || []);
try {
  const feedback = await apiFetch(
    token,
    "/product-feedback/pending"
  );

  setPendingFeedback(feedback || []);
} catch {
  setPendingFeedback([]);
}

try {
  const learningData = await apiFetch(
    token,
    "/oasis-learnings"
  );

  setLearnings(learningData);
} catch {
  setLearnings(null);
}
} finally {
    setLoading(false);}
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
  setSaving(true);

  try {
    await apiFetch(token, "/skin/tracking", {
      method: "POST",
      body: JSON.stringify({
        image_base64: pickedImage || "",
        note,
        hydration,
        glow,
        texture,
        irritation,
        breakouts,
        redness,
		linked_products: selectedProducts,
      }),
    });

    setPickerOpen(false);
    setPickedImage(null);
    setNote("");
    setHydration(5);
    setGlow(5);
    setTexture(5);
    setIrritation(1);
    setBreakouts(1);
    setRedness(1);
    setAnalysis(null);
	setSelectedProducts([]);

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
      await apiFetch(token, `/skin/tracking/${id}`, { method: "DELETE" });
      setEntries((p) => p.filter((e) => e.tracking_id !== id));
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };
const submitFeedback = async (
  item: any,
  result: string
) => {

  try {

    await apiFetch(
      token,
      "/product-feedback",
      {
        method: "POST",
        body: JSON.stringify({
          analysis_id: item.analysis_id,
          product_name: item.product_name,
          overall_result: result,
        }),
      }
    );

    setPendingFeedback(
      pendingFeedback.filter(
        p => p.analysis_id !== item.analysis_id
      )
    );

    Alert.alert(
      "Merci",
      "Votre retour a été enregistré."
    );

  } catch (e: any) {
    Alert.alert(
      "Erreur",
      e.message
    );
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
        <Text style={styles.subtitle}>Suivez l'évolution de votre peau et laissez OASIS apprendre de vos routines.</Text>
		{pendingFeedback.length > 0 && (
  <View style={styles.feedbackCard}>
    <Text style={styles.feedbackTitle}>
      ✨ OASIS souhaite votre retour
    </Text>

    <Text style={styles.feedbackText}>
      Vous utilisez
      {" "}
      {pendingFeedback[0].product_name}
      {" "}
      depuis
      {" "}
      {pendingFeedback[0].days_used}
      jours.
    </Text>

    <View style={styles.feedbackButtons}>
	<TouchableOpacity
  style={styles.feedbackButton}
  onPress={() =>
    submitFeedback(
      pendingFeedback[0],
      "improved"
    )
  }
>
  <Text>👍 Amélioration</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.feedbackButton}
  onPress={() =>
    submitFeedback(
      pendingFeedback[0],
      "stable"
    )
  }
>
  <Text>➖ Stable</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.feedbackButton}
  onPress={() =>
    submitFeedback(
      pendingFeedback[0],
      "worse"
    )
  }
>
  <Text>👎 Aggravation</Text>
</TouchableOpacity>
    </View>
  </View>
)}
{learnings && (
  <>
    <View style={styles.learningCard}>
      <Text style={styles.learningTitle}>
        🧠 Learnings OASIS
      </Text>

      <Text style={styles.learningStats}>
        Feedbacks : {learnings.total_feedbacks}
      </Text>

      <View style={styles.learningStatsRow}>
  <View style={styles.learningBadge}>
    <Text style={styles.learningBadgeEmoji}>👍</Text>
    <Text style={styles.learningBadgeNumber}>
      {learnings.positive_products}
    </Text>
  </View>

  <View style={styles.learningBadge}>
    <Text style={styles.learningBadgeEmoji}>➖</Text>
    <Text style={styles.learningBadgeNumber}>
      {learnings.neutral_products}
    </Text>
  </View>

  <View style={styles.learningBadge}>
    <Text style={styles.learningBadgeEmoji}>👎</Text>
    <Text style={styles.learningBadgeNumber}>
      {learnings.negative_products}
    </Text>
  </View>
</View>

      {(learnings.insights || []).map(
        (item: string, index: number) => (
          <View
  key={index}
  style={styles.learningInsightBox}
>
  <Text
    style={styles.learningInsightText}
  >
    {item}
  </Text>
</View>
        )
      )}
    </View>

    {(learnings.top_ingredients || []).length > 0 && (
      <View style={styles.ingredientLearningBlock}>
        <Text style={styles.learningTitle}>
          Ingrédients qui semblent vous convenir
        </Text>

        {learnings.top_ingredients.map(
			(item: any, index: number) => (
				<Text
				 key={index}
				 style={styles.learningText}
				 numberOfLines={1}
				>
				✓ {item.ingredient}
			</Text>
		   )
		 )}
      </View>
    )}
	{(learnings.ingredient_correlations || []).length > 0 && (
  <View style={styles.correlationCard}>
    <Text style={styles.learningTitle}>
      🧪 Corrélations observées
    </Text>

    {learnings.ingredient_correlations.map(
      (item: any, index: number) => (
        <View
          key={index}
          style={styles.correlationItem}
        >
          <Text style={styles.correlationIngredient}>
            {item.ingredient}
          </Text>

          <Text style={styles.learningText}>
            💧 Hydratation : {item.avg_hydration}
          </Text>

          <Text style={styles.learningText}>
            ✨ Glow : {item.avg_glow}
          </Text>

          <Text style={styles.learningText}>
            🧴 Texture : {item.avg_texture}
          </Text>

          <Text style={styles.learningText}>
            🔥 Irritation : {item.avg_irritation}
          </Text>
        </View>
      )
    )}
  </View>
)}
  </>
)}

{insights.length > 0 && (
  <View style={styles.insightsCard}>
    <Text style={styles.insightsTitle}>
      ✨ Observations OASIS
    </Text>

    {insights.slice(0, 3).map((item, index) => (
      <Text key={index} style={styles.insightText}>
        {item}
      </Text>
    ))}
  </View>
)}
  
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>Aucune photo encore.</Text>
            <Text style={styles.emptyHint}>Ajoutez votre premier selfie pour commencer.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {entries.map((e) => (
              <View key={e.tracking_id} style={styles.entryCard} testID={`entry-${e.tracking_id}`}>
                <Image source={{ uri: `data:image/jpeg;base64,${e.image_base64}` }} style={styles.entryImage} />
                <View style={styles.entryFooter}>
                  <Text style={styles.entryDate}>{new Date(e.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</Text>
                  <TouchableOpacity onPress={() => removeEntry(e.tracking_id)} testID={`delete-${e.tracking_id}`}>
                    <Ionicons name="trash-outline" size={16} color={colors.textDisabled} />
                  </TouchableOpacity>
                </View>
                {!!e.note && <Text style={styles.entryNote} numberOfLines={2}>{e.note}</Text>}
                <View style={styles.metricsRow}>
  <Text style={styles.metric}>💧 {e.hydration}</Text>
  <Text style={styles.metric}>✨ {e.glow}</Text>
  <Text style={styles.metric}>🧴 {e.texture}</Text>
</View>

<View style={styles.metricsRow}>
  <Text style={styles.metric}>🔥 {e.irritation}</Text>
  <Text style={styles.metric}>🔴 {e.breakouts}</Text>
  <Text style={styles.metric}>🌸 {e.redness}</Text>
</View>

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
			  <Text style={styles.label}>Hydratation : {hydration}/10</Text>
			  <Text style={styles.label}>
			   Produits utilisés récemment
			   </Text>
			   {recentProducts.map((p: any) => (
  <TouchableOpacity
  key={p.analysis_id}
  style={[
    styles.productChip,
    selectedProducts.some(
      x => x.analysis_id === p.analysis_id
    ) && styles.productChipActive
  ]}
  onPress={() => {

    const exists =
      selectedProducts.some(
        x => x.analysis_id === p.analysis_id
      );

    if (exists) {
      setSelectedProducts(
        selectedProducts.filter(
          x => x.analysis_id !== p.analysis_id
        )
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        p
      ]);
    }
  }}
>
  <Text
    style={{
      color: selectedProducts.some(
        x => x.analysis_id === p.analysis_id
      )
        ? "#fff"
        : colors.textPrimary,
    }}
  >
    {p.product_name}
  </Text>
</TouchableOpacity>
))}

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        hydration === n && styles.scaleBtnActive
      ]}
      onPress={() => setHydration(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>
<Text style={styles.label}>glow : {glow}/10</Text>

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        glow === n && styles.scaleBtnActive
      ]}
      onPress={() => setGlow(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>
<Text style={styles.label}>texture : {texture}/10</Text>

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        texture === n && styles.scaleBtnActive
      ]}
      onPress={() => setTexture(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>
<Text style={styles.label}>irritation : {irritation}/10</Text>

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        irritation === n && styles.scaleBtnActive
      ]}
      onPress={() => setIrritation(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>
<Text style={styles.label}>breakouts : {breakouts}/10</Text>

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        breakouts === n && styles.scaleBtnActive
      ]}
      onPress={() => setBreakouts(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>
<Text style={styles.label}>redness : {redness}/10</Text>

<View style={styles.scaleRow}>
  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
    <TouchableOpacity
      key={n}
      style={[
        styles.scaleBtn,
        redness === n && styles.scaleBtnActive
      ]}
      onPress={() => setRedness(n)}
    >
      <Text>{n}</Text>
    </TouchableOpacity>
  ))}
</View>

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
  scaleRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: spacing.md,
},

scaleBtn: {
  width: 30,
  height: 30,
  borderRadius: 15,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface,
},

scaleBtnActive: {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
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
productChip: {
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  marginBottom: 8,
},

productChipActive: {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
},
insightsCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
},

insightsTitle: {
  fontSize: 17,
  color: colors.textPrimary,
  fontWeight: "600",
  marginBottom: spacing.sm,
},

insightText: {
  fontSize: 14,
  color: colors.textSecondary,
  lineHeight: 20,
  marginBottom: 6,
},
feedbackCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
},

feedbackTitle: {
  fontSize: 17,
  fontWeight: "600",
  marginBottom: spacing.sm,
},

feedbackText: {
  color: colors.textSecondary,
  marginBottom: spacing.md,
},

feedbackButtons: {
  flexDirection: "row",
  gap: 8,
},

feedbackButton: {
  flex: 1,
  padding: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: "center",
},
learningCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
},

learningTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: colors.textPrimary,
  marginBottom: spacing.md,
  lineHeight: 28,
},

learningStats: {
  color: colors.textSecondary,
  fontSize: 15,
  marginBottom: spacing.sm,
},

learningStatsRow: {
  flexDirection: "row",
  gap: 10,
  marginBottom: spacing.md,
},

learningBadge: {
  flex: 1,
  backgroundColor: colors.bg,
  borderRadius: 18,
  paddingVertical: 10,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
},

learningBadgeEmoji: {
  fontSize: 20,
  marginBottom: 2,
},

learningBadgeNumber: {
  fontSize: 16,
  fontWeight: "700",
  color: colors.textPrimary,
},

learningInsightBox: {
  backgroundColor: colors.bg,
  borderRadius: 18,
  padding: spacing.md,
  marginTop: spacing.sm,
},

learningInsightText: {
  color: colors.textPrimary,
  fontSize: 15,
  lineHeight: 22,
},

learningText: {
  color: colors.textPrimary,
  fontSize: 14,
  lineHeight: 20,
  marginTop: 6,
},
ingredientLearningBlock: {
  marginTop: spacing.md,
},

correlationCard: {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.md,
  marginTop: spacing.md,
},

correlationItem: {
  marginTop: spacing.sm,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},

correlationIngredient: {
  fontWeight: "600",
  fontSize: 15,
  marginBottom: 4,
  color: colors.textPrimary,
},
});
