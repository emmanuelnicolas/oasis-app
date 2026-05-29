import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";

type Step = { order: number; name: string; product_type: string; instructions: string; benefits: string };
type Routine = { type: string; title: string; description: string; steps: Step[] };

const TYPES = [
  { id: "matin", label: "Matin" },
  { id: "soir", label: "Soir" },
  { id: "hebdo", label: "Hebdo" },
];

export default function Routines() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [routines, setRoutines] = useState<{ [k: string]: Routine }>({});
  const [active, setActive] = useState("matin");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
	try {
		if (!token) return;

		const r = await apiFetch(token, "/routines");
		setRoutines(r || {});
	} 	finally {
		setLoading(false);
	}
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const regenerate = async () => {
	if (!token){
     Alert.alert("Session expirée", "Reconnecte-toi.");
	 return;
	}

  setGenerating(true);
  try {
    const r = await apiFetch(token, "/routines/generate", { method: "POST" });
    setRoutines(r || {});
    Alert.alert("✨", "Nouvelles routines créées !");
  } catch (e: any) {
    Alert.alert("Erreur", e.message || "Impossible de regénérer");
  } finally {
    setGenerating(false);
  }
};

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const current = routines[active];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Vos Rituels</Text>
        <TouchableOpacity testID="regenerate-btn" onPress={regenerate} disabled={generating}>
          <Text style={styles.regenText}>{generating ? "..." : "Regénérer"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.id}
            testID={`tab-${t.id}`}
            style={[styles.tab, active === t.id && styles.tabActive]}
            onPress={() => setActive(t.id)}
          >
            <Text style={[styles.tabText, active === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {generating ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Génération de vos routines avec l'IA...</Text>
          </View>
        ) : current ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{current.title}</Text>
            <Text style={styles.cardDesc}>{current.description}</Text>
            {current.steps.map((s) => (
              <View key={s.order} style={styles.step} testID={`routine-step-${active}-${s.order}`}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{s.order}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepName}>{s.name}</Text>
                  <Text style={styles.stepType}>{s.product_type}</Text>
                  <Text style={styles.stepInstr}>{s.instructions}</Text>
                  {!!s.benefits && <Text style={styles.stepBenefits}>✦ {s.benefits}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune routine pour l'instant.</Text>
            <TouchableOpacity style={styles.btn} onPress={regenerate}>
              <Text style={styles.btnText}>Générer mes routines</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  regenText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  tabBar: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textPrimary, fontSize: 14 },
  tabTextActive: { color: "#fff", fontWeight: "500" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 24, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  cardDesc: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
  step: { flexDirection: "row", paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  stepNumberText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  stepName: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  stepType: { fontSize: 11, color: colors.secondary, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" },
  stepInstr: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  stepBenefits: { fontSize: 12, color: colors.primary, marginTop: 6, fontStyle: "italic" },
  loadingBox: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md },
  empty: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textSecondary, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radius.button },
  btnText: { color: "#fff", fontWeight: "500" },
});
