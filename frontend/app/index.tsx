import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../src/auth";
import { colors, fonts, radius, spacing } from "../src/theme";

export default function Index() {
  const router = useRouter();
  const { user, loading, login, signup } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      if (!user.has_profile) router.replace("/onboarding");
      else router.replace("/(tabs)/home");
    }
  }, [loading, user, router]);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Veuillez entrer votre prénom");
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      Alert.alert("Google Login", "Veuillez ouvrir l'app dans le navigateur web pour utiliser Google.");
      return;
    }
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const useDemoCredentials = () => {
    setMode("login");
    setEmail("demo@skincare.app");
    setPassword("Demo1234!");
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1767884022378-7909a74a15ab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHx3b21hbiUyMGNsZWFyJTIwc2tpbiUyMHBvcnRyYWl0JTIwbmF0dXJhbCUyMGxpZ2h0fGVufDB8fHx8MTc3NzQ2ODg1Nnww&ixlib=rb-4.1.0&q=85",
            }}
            style={styles.hero}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.brand}>OASIS</Text>
            <Text style={styles.tagline}>Votre rituel beauté, sur mesure.</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>{mode === "login" ? "Bienvenue" : "Créez votre compte"}</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Reprenez votre rituel de soin."
              : "Découvrez une routine pensée pour vous."}
          </Text>

          {mode === "signup" && (
            <View style={styles.field}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                testID="name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Sophie"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="email-input"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              testID="password-input"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDisabled}
              secureTextEntry
            />
          </View>

          {error && <Text style={styles.error} testID="auth-error">{error}</Text>}

          <TouchableOpacity
            testID="submit-auth-btn"
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === "login" ? "Se connecter" : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity testID="google-btn" style={styles.googleBtn} onPress={handleGoogle}>
            <Text style={styles.googleBtnText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="demo-btn" onPress={useDemoCredentials} style={{ marginTop: spacing.md }}>
            <Text style={styles.demoText}>Essayer avec le compte de démo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="toggle-mode-btn"
            onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            style={{ marginTop: spacing.lg, alignItems: "center" }}
          >
            <Text style={styles.toggleText}>
              {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit·e ? Se connecter"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg },
  heroContainer: {
    height: 280,
    borderRadius: radius.image,
    overflow: "hidden",
    marginBottom: spacing.xl,
    position: "relative",
  },
  hero: { width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(31,46,36,0.25)",
  },
  heroText: { position: "absolute", left: spacing.lg, bottom: spacing.lg },
  brand: { fontSize: 28, color: "#fff", letterSpacing: 6, fontWeight: "300", fontFamily: fonts.heading },
  tagline: { fontSize: 16, color: "#fff", marginTop: spacing.xs, fontWeight: "300" },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 30, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400", marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "transparent",
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textSecondary, fontSize: 12 },
  googleBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleBtnText: { color: colors.primary, fontSize: 15, fontWeight: "500" },
  toggleText: { color: colors.textSecondary, fontSize: 14 },
  error: { color: colors.error, fontSize: 14, marginTop: spacing.xs, textAlign: "center" },
  demoText: { color: colors.secondary, fontSize: 13, textAlign: "center", textDecorationLine: "underline" },
});
