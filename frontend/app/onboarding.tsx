import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, apiFetch } from "../src/auth";
import { colors, fonts, radius, spacing } from "../src/theme";

const SKIN_TYPES = [
  { id: "sec", label: "Sèche", desc: "Tiraille, manque de confort" },
  { id: "gras", label: "Grasse", desc: "Brillances, pores dilatés" },
  { id: "mixte", label: "Mixte", desc: "Zone T grasse, joues normales" },
  { id: "normal", label: "Normale", desc: "Équilibrée, peu de soucis" },
  { id: "sensible", label: "Sensible", desc: "Réactive, rougeurs faciles" },
];

const AGE_RANGES = ["18-25", "26-35", "36-45", "46+"];

const CONCERNS = [
  { id: "acne", label: "Acné / Imperfections" },
  { id: "rides", label: "Rides / Anti-âge" },
  { id: "taches", label: "Taches pigmentaires" },
  { id: "deshydratation", label: "Déshydratation" },
  { id: "eclat", label: "Manque d'éclat" },
  { id: "pores", label: "Pores dilatés" },
  { id: "rougeurs", label: "Rougeurs" },
];

const SENSITIVITY = ["faible", "moyenne", "forte"];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sensitivity, setSensitivity] = useState("");
  const [allergies, setAllergies] = useState("");
  const [goals, setGoals] = useState("");
  const [busy, setBusy] = useState(false);

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggleConcern = (id: string) => {
    setConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const canContinue = () => {
    if (step === 0) return !!skinType;
    if (step === 1) return !!ageRange;
    if (step === 2) return concerns.length > 0;
    if (step === 3) return !!sensitivity;
    return true;
  };

  const submit = async () => {
    setBusy(true);
    try {
      await apiFetch(token, "/api/profile", {
        method: "POST",
        body: JSON.stringify({
          skin_type: skinType,
          age_range: ageRange,
          concerns,
          sensitivity,
          allergies,
          current_routine: "",
          goals,
        }),
      });
      // Generate routines
      await apiFetch(token, "/api/routines/generate", { method: "POST" });
      await refreshUser();
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de créer votre profil");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.stepCount}>Étape {step + 1} sur {totalSteps}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View>
            <Text style={styles.title}>Quel est votre type de peau ?</Text>
            <Text style={styles.subtitle}>Choisissez celui qui vous correspond le mieux.</Text>
            {SKIN_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`skin-type-${t.id}`}
                style={[styles.option, skinType === t.id && styles.optionActive]}
                onPress={() => setSkinType(t.id)}
              >
                <Text style={[styles.optionLabel, skinType === t.id && styles.optionLabelActive]}>{t.label}</Text>
                <Text style={styles.optionDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Votre tranche d'âge ?</Text>
            <Text style={styles.subtitle}>Pour adapter les soins à votre peau.</Text>
            <View style={styles.pillRow}>
              {AGE_RANGES.map((a) => (
                <TouchableOpacity
                  key={a}
                  testID={`age-${a}`}
                  style={[styles.pill, ageRange === a && styles.pillActive]}
                  onPress={() => setAgeRange(a)}
                >
                  <Text style={[styles.pillText, ageRange === a && styles.pillTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Vos préoccupations</Text>
            <Text style={styles.subtitle}>Sélectionnez tout ce qui vous concerne (multiple).</Text>
            {CONCERNS.map((c) => {
              const active = concerns.includes(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  testID={`concern-${c.id}`}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => toggleConcern(c.id)}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {active ? "✓ " : ""}{c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Sensibilité de votre peau</Text>
            <Text style={styles.subtitle}>À quel point votre peau réagit-elle ?</Text>
            <View style={styles.pillRow}>
              {SENSITIVITY.map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`sensitivity-${s}`}
                  style={[styles.pill, sensitivity === s && styles.pillActive]}
                  onPress={() => setSensitivity(s)}
                >
                  <Text style={[styles.pillText, sensitivity === s && styles.pillTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.title}>Pour finir</Text>
            <Text style={styles.subtitle}>Quelques détails pour mieux vous accompagner.</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Allergies / produits à éviter</Text>
              <TextInput
                testID="allergies-input"
                style={styles.input}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="ex: parfum, alcool, fragrance..."
                placeholderTextColor={colors.textDisabled}
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Vos objectifs</Text>
              <TextInput
                testID="goals-input"
                style={[styles.input, { minHeight: 80 }]}
                value={goals}
                onChangeText={setGoals}
                placeholder="ex: peau plus lumineuse, réduire les rides..."
                placeholderTextColor={colors.textDisabled}
                multiline
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {step > 0 && (
          <TouchableOpacity testID="prev-btn" style={styles.secondaryBtn} onPress={prev}>
            <Text style={styles.secondaryBtnText}>Retour</Text>
          </TouchableOpacity>
        )}
        {step < totalSteps - 1 ? (
          <TouchableOpacity
            testID="next-btn"
            style={[styles.primaryBtn, !canContinue() && styles.btnDisabled]}
            onPress={next}
            disabled={!canContinue()}
          >
            <Text style={styles.primaryBtnText}>Continuer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="finish-btn"
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Créer ma routine ✨</Text>}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  stepCount: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, letterSpacing: 1 },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  title: { fontSize: 28, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400", marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  option: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: "rgba(126,154,136,0.08)" },
  optionLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
  optionLabelActive: { color: colors.primary },
  optionDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  pillText: { color: colors.textPrimary, fontSize: 15 },
  pillTextActive: { color: "#fff", fontWeight: "500" },
  field: { marginBottom: spacing.md },
  label: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 15, color: colors.textPrimary,
  },
  footer: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  secondaryBtn: { paddingHorizontal: spacing.lg, paddingVertical: 16, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { color: colors.textPrimary, fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
