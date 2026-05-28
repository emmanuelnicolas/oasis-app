import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "../../src/auth";
import { colors, fonts, radius, spacing } from "../../src/theme";

const SKIN_LABELS: Record<string, string> = {
  sec: "Sèche", gras: "Grasse", mixte: "Mixte", normal: "Normale", sensible: "Sensible",
};

const CONCERN_LABELS: Record<string, string> = {
  acne: "Acné", rides: "Rides", taches: "Taches", deshydratation: "Déshydratation",
  eclat: "Éclat", pores: "Pores", rougeurs: "Rougeurs",
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tips, setTips] = useState<{ season: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        apiFetch(token, "/api/profile"),
        apiFetch(token, "/api/tips/seasonal"),
      ]);
      setProfile(p);
      setTips(t);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxl }]}>
      <View style={styles.profileHeader}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.bigAvatar} />
        ) : (
          <View style={[styles.bigAvatar, styles.avatarFallback]}>
            <Text style={{ color: "#fff", fontSize: 32, fontFamily: fonts.heading }}>
              {(user?.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {profile && profile.skin_type && (
        <View style={styles.card} testID="profile-summary">
          <Text style={styles.cardLabel}>Votre profil de peau</Text>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Type</Text>
            <Text style={styles.rowVal}>{SKIN_LABELS[profile.skin_type] || profile.skin_type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Âge</Text>
            <Text style={styles.rowVal}>{profile.age_range}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Sensibilité</Text>
            <Text style={styles.rowVal}>{profile.sensitivity}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowKey}>Préoccupations</Text>
            <Text style={[styles.rowVal, { textAlign: "right", flex: 1, marginLeft: spacing.md }]}>
              {(profile.concerns || []).map((c: string) => CONCERN_LABELS[c] || c).join(", ")}
            </Text>
          </View>

          <TouchableOpacity testID="edit-profile-btn" style={styles.editBtn} onPress={() => router.push("/onboarding")}>
            <Text style={styles.editBtnText}>Modifier mon profil</Text>
          </TouchableOpacity>
        </View>
      )}

      {tips && tips.tips.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Conseils {tips.season}</Text>
          {tips.tips.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="leaf-outline" size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg },
  profileHeader: { alignItems: "center", marginBottom: spacing.lg },
  bigAvatar: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.md, backgroundColor: colors.border },
  avatarFallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 26, color: colors.textPrimary, fontFamily: fonts.heading, fontWeight: "400" },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.md, fontWeight: "500" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: "center" },
  rowKey: { color: colors.textSecondary, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: "500" },
  editBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.button, paddingVertical: 12, alignItems: "center", marginTop: spacing.md },
  editBtnText: { color: colors.primary, fontWeight: "500", fontSize: 14 },
  tipRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  tipText: { flex: 1, color: colors.textPrimary, fontSize: 13, lineHeight: 19 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.md },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: "500" },
});
