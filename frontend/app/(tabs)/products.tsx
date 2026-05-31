import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Platform, Modal, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";
import LiveCamera from "../../src/LiveCamera";
import Compare from "../../src/Compare";

type Ingredient = { name: string; role: string; flag: "green" | "orange" | "red"; note: string };

type Decision = { label: string; color: "green" | "orange" | "red"; justification: string };
type Alternative = { criterion: string; why: string };
type Compatibility = { verdict: string; reasons: string[] };

type Analysis = {
  analysis_id: string;
  product_name: string;
  score: number;
  input_type?: string;
  ingredients: Ingredient[];
  risks: Risk[];
  compatibility: Compatibility;
  decision: Decision;
  alternatives: Alternative[];
  disclaimer?: string;
  created_at: string;
};

const flagColor = (f: string) =>
  f === "green" ? "#7E9A88" : f === "orange" ? "#D4B271" : "#B86B6B";

const flagBg = (f: string) =>
  f === "green" ? "rgba(126,154,136,0.12)" : f === "orange" ? "rgba(212,178,113,0.18)" : "rgba(184,107,107,0.15)";

export default function Products() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string }>();

  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewer, setViewer] = useState<Analysis | null>(null);

  const [name, setName] = useState("");
  const [inci, setInci] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [unreadable, setUnreadable] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const load = useCallback(async () => {
	try {
		if (!token) return;

		const items = await apiFetch(token, "/products");
		setHistory(items || []);
	} 	finally {
		setLoading(false);
	}
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (params.open === "1") {
      setComposerOpen(true);
      router.setParams({ open: undefined as any });
    }
  }, [params.open, router]);

  const resetComposer = () => {
    setName(""); setInci(""); setImage(null); setUnreadable(null);
  };

  const pickPhoto = async () => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès aux photos est nécessaire.");
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, quality: 0.6, allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]?.base64) {
      setImage(res.assets[0].base64);
      setUnreadable(null);
    }
  };

  const openCamera = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("La caméra live est disponible sur mobile. Utilisez la galerie sur le web.");
      } else {
        Alert.alert("Caméra", "La caméra live est disponible sur mobile. Utilisez la galerie sur le web.");
      }
      return;
    }
    setCameraOpen(true);
  };

  const runAnalysis = async () => {
    if (!image && !inci.trim()) {
      Alert.alert("Info", "Ajoutez une photo ou collez la liste INCI.");
      return;
    }
    setAnalyzing(true);
    setUnreadable(null);
    try {
      const result = await apiFetch(token, "/products/analyze", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          image_base64: image || "",
          ingredients_text: inci.trim(),
        }),
      });
      if (result && result.unreadable) {
        setUnreadable(result.message || "Liste illisible. Collez le texte INCI.");
        return;
      }
      setComposerOpen(false);
      resetComposer();
      setViewer(result);
      load();
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Analyse impossible");
    } finally {
      setAnalyzing(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      await apiFetch(token, `/products/${id}`, { method: "DELETE" });
      setHistory((p) => p.filter((x) => x.analysis_id !== id));
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
        <View>
          <Text style={styles.title}>Produits</Text>
          <Text style={styles.subtitle}>Analyse & décision personnalisée</Text>
        </View>
        <TouchableOpacity
          testID="new-analysis-btn"
          style={styles.addBtn}
          onPress={() => { resetComposer(); setComposerOpen(true); }}
        >
          <Ionicons name="scan-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          testID="quick-scan-card"
          style={styles.ctaCard}
          onPress={() => { resetComposer(); setComposerOpen(true); }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Analyser un produit</Text>
            <Text style={styles.ctaDesc}>Photo de l'étiquette ou liste INCI → décision adaptée à votre peau.</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {history.length >= 2 && (
          <TouchableOpacity
            testID="compare-btn"
            style={styles.compareCta}
            onPress={() => setCompareOpen(true)}
          >
            <Ionicons name="git-compare-outline" size={20} color={colors.secondary} />
            <Text style={styles.compareCtaText}>Comparer 2 produits</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
          </TouchableOpacity>
        )}

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>Aucune analyse encore.</Text>
            <Text style={styles.emptyHint}>Scannez votre premier produit pour commencer.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionLabel}>Historique</Text>
            {history.map((a) => (
              <TouchableOpacity
                key={a.analysis_id}
                testID={`history-${a.analysis_id}`}
                style={styles.histCard}
                onPress={() => setViewer(a)}
              >
                <View style={[styles.scoreCircle, { borderColor: flagColor(a.decision?.color || "green") }]}>
                  <Text style={[styles.scoreNum, { color: flagColor(a.decision?.color || "green") }]}>{a.score}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histName} numberOfLines={1}>{a.product_name}</Text>
                  <View style={[styles.badge, { backgroundColor: flagBg(a.decision?.color || "green") }]}>
                    <Text style={[styles.badgeText, { color: flagColor(a.decision?.color || "green") }]}>
                      {a.decision?.label || "—"}
                    </Text>
                  </View>
                  <Text style={styles.histDate}>
                    {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(a.analysis_id)} testID={`delete-${a.analysis_id}`}>
                  <Ionicons name="trash-outline" size={18} color={colors.textDisabled} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Composer modal */}
      <Modal visible={composerOpen} animationType="slide" transparent onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle analyse</Text>
              <TouchableOpacity onPress={() => setComposerOpen(false)} testID="close-composer-btn">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nom du produit (optionnel)</Text>
              <TextInput
                testID="product-name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="ex: Crème hydratante jour"
                placeholderTextColor={colors.textDisabled}
              />

              <Text style={styles.label}>Photo de l'étiquette</Text>
              {image ? (
                <View style={styles.imageRow}>
                  <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={styles.thumb} />
                  <TouchableOpacity onPress={() => setImage(null)} testID="remove-image-btn">
                    <Text style={styles.removeLink}>Retirer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoRow}>
                  <TouchableOpacity testID="open-camera-btn" style={styles.photoBtnHalf} onPress={openCamera}>
                    <Ionicons name="camera-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Caméra</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="pick-photo-btn" style={styles.photoBtnHalf} onPress={pickPhoto}>
                    <Ionicons name="images-outline" size={20} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.label, { marginTop: spacing.md }]}>Liste d'ingrédients (INCI)</Text>
              <TextInput
                testID="inci-input"
                style={[styles.input, { minHeight: 110 }]}
                value={inci}
                onChangeText={setInci}
                placeholder="Aqua, Glycerin, Niacinamide, Parfum..."
                placeholderTextColor={colors.textDisabled}
                multiline
              />

              {unreadable && (
                <View style={styles.warnBox} testID="unreadable-warn">
                  <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                  <Text style={styles.warnText}>{unreadable}</Text>
                </View>
              )}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  Analyse indicative, ne remplace pas un avis dermatologique.
                </Text>
              </View>

              <TouchableOpacity
                testID="run-analysis-btn"
                style={[styles.primaryBtn, analyzing && { opacity: 0.6 }]}
                onPress={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Analyser ✦</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Result viewer modal */}
      <Modal visible={!!viewer} animationType="slide" onRequestClose={() => setViewer(null)}>
        {viewer && (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
              <Text style={styles.modalTitle} numberOfLines={1}>{viewer.product_name}</Text>
              <TouchableOpacity onPress={() => setViewer(null)} testID="close-viewer-btn">
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.viewer, { paddingBottom: insets.bottom + spacing.xxl }]}>
              {/* Premium score + decision */}
<View style={styles.premiumDecisionCard}>
  <View style={styles.scoreHeader}>
    <Text style={styles.scoreTitle}>Compatibilité avec votre peau</Text>
    <Text style={styles.scoreSubtitle}>Analyse personnalisée OASIS</Text>
  </View>

  <View style={styles.scoreRow}>
    <View
      style={[
        styles.premiumScoreCircle,
        {
          borderColor: flagColor(viewer.decision?.color || "green"),
          shadowColor: flagColor(viewer.decision?.color || "green"),
        },
      ]}
    >
      <Text
        style={[
          styles.scoreNumber,
          { color: flagColor(viewer.decision?.color || "green") },
        ]}
      >
        {viewer.score}
      </Text>
      <Text style={styles.scoreOutOf}>/100</Text>
    </View>

    <View style={styles.scoreTextBlock}>
      <View
        style={[
          styles.premiumBadge,
          { backgroundColor: flagBg(viewer.decision?.color || "green") },
        ]}
      >
        <Text
          style={[
            styles.premiumBadgeText,
            { color: flagColor(viewer.decision?.color || "green") },
          ]}
        >
          {viewer.decision?.label || "Analyse"}
        </Text>
      </View>

      <Text style={styles.scoreExplanation}>
        {viewer.decision?.justification ||
          "Ce score est calculé selon votre profil peau, les ingrédients détectés et les risques potentiels."}
      </Text>
    </View>
  </View>
</View>

              {/* Compatibility */}
              {viewer.compatibility && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Compatibilité avec votre profil</Text>
                  <View style={styles.compatRow}>
                    <Text style={styles.compatVerdict}>{viewer.compatibility.verdict}</Text>
                  </View>
                  {(viewer.compatibility.reasons || []).map((r, i) => (
                    <View key={i} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Risks */}
              {viewer.risks && viewer.risks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Risques identifiés</Text>
                  {viewer.risks.map((r, i) => (
                    <View key={i} style={styles.riskCard} testID={`risk-${i}`}>
                      <View style={styles.riskHeader}>
                        <Text style={styles.riskType}>{r.type}</Text>
                        <Text style={[styles.riskSeverity,
                          r.severity === "fort" && { color: colors.error },
                          r.severity === "moyen" && { color: colors.warning },
                        ]}>{r.severity}</Text>
                      </View>
                      <Text style={styles.riskDesc}>{r.description}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Ingredients */}
              {viewer.ingredients && viewer.ingredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Ingrédients</Text>
                  {viewer.ingredients.map((ing, i) => (
                    <View key={i} style={styles.ingRow} testID={`ing-${i}`}>
                      <View style={[styles.ingDot, { backgroundColor: flagColor(ing.flag) }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingRole}>{ing.role}</Text>
                        {!!ing.note && <Text style={styles.ingNote}>{ing.note}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Votre retour</Text>

  <Text style={styles.bulletText}>Cette analyse vous semble utile ?</Text>

  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={() =>
        apiFetch(token, "/products/feedback", {
          method: "POST",
          body: JSON.stringify({
            analysis_id: viewer.analysis_id,
            useful: true,
          }),
        }).then(() => Alert.alert("Merci", "Votre retour est enregistré."))
      }
    >
      <Text style={styles.primaryBtnText}>Oui 👍</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={() =>
        apiFetch(token, "/products/feedback", {
          method: "POST",
          body: JSON.stringify({
            analysis_id: viewer.analysis_id,
            useful: false,
          }),
        }).then(() => Alert.alert("Merci", "Votre retour est enregistré."))
      }
    >
      <Text style={styles.primaryBtnText}>Non 👎</Text>
    </TouchableOpacity>
  </View>

  <Text style={[styles.bulletText, { marginTop: 16 }]}>
    Ce produit vous a déjà irrité ?
  </Text>

  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={() =>
        apiFetch(token, "/products/feedback", {
          method: "POST",
          body: JSON.stringify({
            analysis_id: viewer.analysis_id,
            irritation: true,
          }),
        }).then(() => Alert.alert("Merci", "Information enregistrée."))
      }
    >
      <Text style={styles.primaryBtnText}>Oui</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.primaryBtn}
      onPress={() =>
        apiFetch(token, "/products/feedback", {
          method: "POST",
          body: JSON.stringify({
            analysis_id: viewer.analysis_id,
            irritation: false,
          }),
        }).then(() => Alert.alert("Merci", "Information enregistrée."))
      }
    >
      <Text style={styles.primaryBtnText}>Non</Text>
    </TouchableOpacity>
  </View>
</View>
              {/* Alternatives */}
              {viewer.alternatives && viewer.alternatives.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Critères d'alternatives</Text>
                  {viewer.alternatives.map((alt, i) => (
                    <View key={i} style={styles.altCard} testID={`alt-${i}`}>
                      <Text style={styles.altName}>✦ {alt.criterion}</Text>
                      <Text style={styles.altWhy}>{alt.why}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                  {viewer.disclaimer || "Analyse indicative, ne remplace pas un avis dermatologique."}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Live camera modal */}
      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <LiveCamera
          onClose={() => setCameraOpen(false)}
          onCapture={(b64) => {
            setImage(b64);
            setUnreadable(null);
            setCameraOpen(false);
          }}
        />
      </Modal>

      {/* Comparison modal */}
      <Compare visible={compareOpen} onClose={() => setCompareOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  ctaCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
  },
  ctaTitle: { fontSize: 18, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  ctaDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },

  sectionLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", fontWeight: "500", marginBottom: spacing.sm, marginTop: spacing.md },
  empty: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  emptyText: { color: colors.textPrimary, fontSize: 16, marginTop: spacing.md, fontWeight: "500" },
  emptyHint: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs, textAlign: "center" },

  histCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  scoreCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 18, fontWeight: "600" },
  histName: { fontSize: 15, color: colors.textPrimary, fontWeight: "500" },
  badge: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  histDate: { color: colors.textDisabled, fontSize: 11, marginTop: 4 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, gap: spacing.md },
  modalTitle: { flex: 1, fontSize: 22, color: colors.textPrimary, fontFamily: fonts.heading },

  label: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: spacing.md, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md, backgroundColor: colors.surface },

  photoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, marginBottom: spacing.md, borderStyle: "dashed" },
  photoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  photoBtnHalf: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, borderStyle: "dashed" },
  photoBtnText: { color: colors.primary, fontWeight: "500" },
  compareCta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "rgba(194,141,117,0.10)", borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: "rgba(194,141,117,0.3)", marginBottom: spacing.md },
  compareCtaText: { flex: 1, color: colors.secondary, fontWeight: "500", fontSize: 14 },
  imageRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.input },
  removeLink: { color: colors.error, fontSize: 13, textDecorationLine: "underline" },

  warnBox: { flexDirection: "row", gap: spacing.sm, backgroundColor: "rgba(212,178,113,0.15)", padding: spacing.md, borderRadius: radius.input, marginBottom: spacing.md, alignItems: "flex-start" },
  warnText: { flex: 1, color: colors.textPrimary, fontSize: 13 },

  disclaimerBox: { backgroundColor: "rgba(163,172,166,0.15)", borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.md, marginTop: spacing.sm },
  disclaimerText: { fontSize: 12, color: colors.textSecondary, fontStyle: "italic", textAlign: "center", lineHeight: 17 },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  primaryBtnText: { color: "#fff", fontWeight: "500", fontSize: 15 },

  viewer: { padding: spacing.lg },
  decisionCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  bigScore: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  bigScoreNum: { fontSize: 40, fontWeight: "600", fontFamily: fonts.heading },
  bigScoreLabel: { fontSize: 12, color: colors.textSecondary, letterSpacing: 1 },
  decisionBadge: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: 999, marginBottom: spacing.md },
  decisionLabel: { fontSize: 14, fontWeight: "600", letterSpacing: 1 },
  decisionJustif: { textAlign: "center", color: colors.textPrimary, fontSize: 14, lineHeight: 21 },

  section: { marginTop: spacing.lg },
  compatRow: { marginBottom: spacing.xs },
  compatVerdict: { fontSize: 16, color: colors.textPrimary, fontWeight: "500", textTransform: "capitalize" },
  bullet: { flexDirection: "row", gap: spacing.sm, marginBottom: 4 },
  bulletDot: { color: colors.primary, fontWeight: "700" },
  bulletText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  riskCard: { backgroundColor: colors.surface, borderRadius: radius.input, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  riskType: { color: colors.textPrimary, fontWeight: "600", fontSize: 14, textTransform: "capitalize" },
  riskSeverity: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.textSecondary, fontWeight: "500" },
  riskDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

  ingRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  ingDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  ingName: { color: colors.textPrimary, fontWeight: "500", fontSize: 14 },
  ingRole: { color: colors.secondary, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 1 },
  ingNote: { color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 },

  altCard: { backgroundColor: colors.surface, borderRadius: radius.input, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  altName: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  altWhy: { color: colors.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 },
  premiumDecisionCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
},

scoreHeader: {
  marginBottom: 18,
},

scoreTitle: {
  fontSize: 20,
  fontWeight: "800",
  color: "#111827",
},

scoreSubtitle: {
  marginTop: 4,
  fontSize: 13,
  color: "#6B7280",
},

scoreRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 18,
},

premiumScoreCircle: {
  width: 112,
  height: 112,
  borderRadius: 56,
  borderWidth: 8,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FAFAFA",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 14,
  elevation: 5,
},

scoreNumber: {
  fontSize: 34,
  fontWeight: "900",
},

scoreOutOf: {
  fontSize: 13,
  color: "#6B7280",
  fontWeight: "700",
},

scoreTextBlock: {
  flex: 1,
},

premiumBadge: {
  alignSelf: "flex-start",
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 999,
  marginBottom: 10,
},

premiumBadgeText: {
  fontSize: 13,
  fontWeight: "800",
},

scoreExplanation: {
  fontSize: 14,
  lineHeight: 21,
  color: "#374151",
},
});
