import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";

type Step = { order: number; name: string; product_type: string; instructions: string; benefits: string };
type Routine = { routine_id: string; type: string; title: string; description: string; steps: Step[] };

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();
  const [routines, setRoutines] = useState<{ [k: string]: Routine }>({});
  const [tracking, setTracking] = useState<{ [k: string]: boolean }>({});
  const [tip, setTip] = useState<{ season: string; tip_of_day: string } | null>(null);
  const [stats, setStats] = useState<{ streak: number; total_days: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
  const start = Date.now();
  if (!token) {
    setLoading(false);
    setRefreshing(false);
    return;
  }

  try {
    const [r, t, s, st] = await Promise.all([
      apiFetch(token, "/routines"),
      apiFetch(token, "/tracking/today"),
      apiFetch(token, "/tips/seasonal"),
      apiFetch(token, "/tracking/stats"),
    ]);

    setRoutines(r || {});
    setTracking((t && t.completed) || {});
    setTip(s);
    setStats(st);
	console.log(
		"Temps chargement Home :",
		Date.now() - start,
		"ms"
	);

	console.log("Routine chargée :", Object.keys(r || {}).length);
	console.log("Tracking aujourd'hui :", Object.keys((t && t.completed) || {}).length);
  } catch (e) {
    console.log("home load error", e);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [token]);

  useEffect(() => { load(); }, [load]);

  const toggleStep = async (rtype: string, order: number) => {
  if (!token) return;
  const start = Date.now();

  const key = `${rtype}_${order}`;
  const newVal = !tracking[key];

  setTracking((p) => ({ ...p, [key]: newVal }));

  try {
  await apiFetch(token, "/tracking/toggle", {
    method: "POST",
    body: JSON.stringify({
      routine_type: rtype,
      step_order: order,
      completed: newVal,
    }),
  });

  console.log(
    "Temps validation étape routine :",
    Date.now() - start,
    "ms"
  );

} catch {
    setTracking((p) => ({ ...p, [key]: !newVal }));
  }
};

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bonjour" : "Bonsoir";
  const focusType = hour < 17 ? "matin" : "soir";
  const focusRoutine = routines[focusType];
	const completedCount = focusRoutine
		? focusRoutine.steps.filter((step) => {
		const key = `${focusType}_${step.order}`;
		return !!tracking[key];
    }).length
  : 0;

  const totalSteps = focusRoutine?.steps.length || 0;
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
  <View>
    <Text style={styles.hello}>{greeting},</Text>
    <Text style={styles.name}>{user?.name || ""}</Text>
  </View>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={{ color: "#fff", fontSize: 20, fontFamily: fonts.heading }}>
              {(user?.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
	  <View style={styles.heroCard}>
  <Text style={styles.heroTitle}>
    Votre peau évolue chaque jour ✨
  </Text>

  <Text style={styles.heroText}>
    OASIS analyse vos produits, suit votre routine et personnalise vos recommandations skincare.
  </Text>
</View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Jours d'affilée</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_days}</Text>
            <Text style={styles.statLabel}>Jours suivis</Text>
          </View>
        </View>
      )}

      {tip && (
        <View style={styles.tipCard} testID="seasonal-tip">
          <View style={styles.tipHeader}>
            <Ionicons name="sparkles" size={16} color={colors.secondary} />
            <Text style={styles.tipLabel}>Conseil · {tip.season}</Text>
          </View>
          <Text style={styles.tipText}>{tip.tip_of_day}</Text>
        </View>
      )}

      <TouchableOpacity
        testID="home-scan-product-btn"
        style={styles.scanCard}
        onPress={() => router.push({ pathname: "/(tabs)/products", params: { open: "1" } })}
      >
        <View style={styles.scanIcon}>
          <Ionicons name="scan-outline" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>Scanner un produit ✨</Text>
          <Text style={styles.scanDesc}>Analyse IA des ingrédients selon votre profil peau.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {focusRoutine ? (
        <View style={styles.routineCard} testID={`focus-routine-${focusType}`}>
          <Text style={styles.routineMoment}>
  Routine du {focusType}
</Text>

<Text style={styles.routineTitle}>
  {focusRoutine.title}
</Text>
          <Text style={styles.routineDesc}>{focusRoutine.description}</Text>
		  <Text style={styles.progressText}>
			{completedCount}/{totalSteps} étapes réalisées aujourd'hui
		  </Text>
          {focusRoutine.steps.map((step) => {
            const key = `${focusType}_${step.order}`;
            const done = !!tracking[key];
            return (
              <TouchableOpacity
                key={step.order}
                testID={`step-${focusType}-${step.order}`}
                style={[styles.stepRow, done && styles.stepRowDone]}
                onPress={() => toggleStep(focusType, step.order)}
              >
                <View style={[styles.checkbox, done && styles.checkboxDone]}>
                  {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepName, done && styles.stepNameDone]}>{step.name}</Text>
                  <Text style={styles.stepProduct}>{step.product_type}</Text>
                  <Text style={styles.stepInstructions}>{step.instructions}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune routine encore. Allez dans l'onglet Routines pour générer.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  hello: { fontSize: 14, color: colors.textSecondary, letterSpacing: 1 },
  name: { fontSize: 28, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400", marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  avatarFallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  statValue: { fontSize: 26, color: colors.primary, fontFamily: fonts.heading, fontWeight: "500" },
  statLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
  tipCard: { backgroundColor: "rgba(194,141,117,0.1)", borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: "rgba(194,141,117,0.3)" },
  tipHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs, gap: 6 },
  tipLabel: { fontSize: 11, color: colors.secondary, letterSpacing: 2, textTransform: "uppercase", fontWeight: "500" },
  tipText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  scanCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  scanIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  scanTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  scanDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  routineCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  routineTitle: { fontSize: 24, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  routineDesc: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 20 },
  stepRow: { flexDirection: "row", paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md, alignItems: "flex-start" },
  stepRowDone: { opacity: 0.65 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepName: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  stepNameDone: { textDecorationLine: "line-through" },
  stepProduct: { fontSize: 12, color: colors.secondary, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" },
  stepInstructions: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  heroCard: {
  backgroundColor: "#111827",
  borderRadius: 28,
  padding: 22,
  marginBottom: spacing.lg,
},

heroTitle: {
  color: "#FFFFFF",
  fontSize: 24,
  fontWeight: "800",
  marginBottom: 8,
},

heroText: {
  color: "rgba(255,255,255,0.75)",
  fontSize: 14,
  lineHeight: 22,
},
routineMoment: {
  fontSize: 12,
  color: colors.primary,
  letterSpacing: 2,
  textTransform: "uppercase",
  marginBottom: 6,
  fontWeight: "600",
},
progressText: {
  color: colors.primary,
  fontSize: 14,
  fontWeight: "600",
  marginBottom: spacing.md,
},
});
