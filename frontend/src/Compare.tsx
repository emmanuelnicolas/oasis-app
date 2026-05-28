import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, apiFetch } from "./auth";
import { colors, fonts, radius, spacing } from "./theme";

type Analysis = {
  analysis_id: string;
  product_name: string;
  score: number;
  ingredients: { name: string; flag: "green" | "orange" | "red" }[];
  risks: { type: string; severity: string }[];
  compatibility: { verdict: string };
  decision: { label: string; color: "green" | "orange" | "red"; justification: string };
  created_at: string;
};

const flagColor = (f: string) =>
  f === "green" ? "#7E9A88" : f === "orange" ? "#D4B271" : "#B86B6B";
const flagBg = (f: string) =>
  f === "green" ? "rgba(126,154,136,0.12)" : f === "orange" ? "rgba(212,178,113,0.18)" : "rgba(184,107,107,0.15)";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function Compare({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [a, setA] = useState<Analysis | null>(null);
  const [b, setB] = useState<Analysis | null>(null);
  const [pickerFor, setPickerFor] = useState<"a" | "b" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await apiFetch(token, "/api/products");
      setHistory(items || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible) {
      setA(null); setB(null); setPickerFor(null);
      load();
    }
  }, [visible, load]);

  const countFlags = (an: Analysis | null, flag: string) =>
    an ? an.ingredients.filter((i) => i.flag === flag).length : 0;

  const renderCard = (an: Analysis | null, side: "a" | "b") => {
    if (!an) {
      return (
        <TouchableOpacity
          testID={`pick-${side}`}
          style={styles.emptySlot}
          onPress={() => setPickerFor(side)}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
          <Text style={styles.emptySlotText}>Choisir un produit</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.card}
        testID={`slot-${side}`}
        onPress={() => setPickerFor(side)}
      >
        <Text style={styles.cardName} numberOfLines={2}>{an.product_name}</Text>
        <View style={[styles.scoreCircle, { borderColor: flagColor(an.decision.color) }]}>
          <Text style={[styles.scoreNum, { color: flagColor(an.decision.color) }]}>{an.score}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: flagBg(an.decision.color) }]}>
          <Text style={[styles.badgeText, { color: flagColor(an.decision.color) }]}>{an.decision.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const row = (label: string, av: React.ReactNode, bv: React.ReactNode) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValues}>
        <View style={styles.rowValue}>{av}</View>
        <View style={styles.rowValue}>{bv}</View>
      </View>
    </View>
  );

  const winnerBanner = () => {
    if (!a || !b) return null;
    let winner: Analysis | null = null;
    let msg = "";
    if (a.score > b.score) { winner = a; msg = "Score plus élevé et décision plus favorable"; }
    else if (b.score > a.score) { winner = b; msg = "Score plus élevé et décision plus favorable"; }
    else { msg = "Scores identiques — regardez la compatibilité et les risques."; }

    return (
      <View style={styles.winner}>
        <Ionicons name="trophy-outline" size={18} color={colors.secondary} />
        <Text style={styles.winnerText}>
          {winner ? `Notre recommandation : ${winner.product_name}` : "Match nul"} — {msg}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.title}>Comparer</Text>
          <TouchableOpacity onPress={onClose} testID="close-compare-btn">
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.subtitle}>Choisissez 2 produits de votre historique pour les comparer côte à côte.</Text>

          <View style={styles.slots}>
            {renderCard(a, "a")}
            <Text style={styles.vs}>vs</Text>
            {renderCard(b, "b")}
          </View>

          {a && b && (
            <View style={styles.compareBlock}>
              {winnerBanner()}

              {row("Score",
                <Text style={[styles.bigVal, { color: flagColor(a.decision.color) }]}>{a.score}</Text>,
                <Text style={[styles.bigVal, { color: flagColor(b.decision.color) }]}>{b.score}</Text>
              )}

              {row("Décision",
                <View style={[styles.pill, { backgroundColor: flagBg(a.decision.color) }]}>
                  <Text style={[styles.pillText, { color: flagColor(a.decision.color) }]}>{a.decision.label}</Text>
                </View>,
                <View style={[styles.pill, { backgroundColor: flagBg(b.decision.color) }]}>
                  <Text style={[styles.pillText, { color: flagColor(b.decision.color) }]}>{b.decision.label}</Text>
                </View>
              )}

              {row("Compatibilité",
                <Text style={styles.val}>{a.compatibility?.verdict || "—"}</Text>,
                <Text style={styles.val}>{b.compatibility?.verdict || "—"}</Text>
              )}

              {row("Ingrédients ✓",
                <Text style={[styles.val, { color: flagColor("green") }]}>{countFlags(a, "green")}</Text>,
                <Text style={[styles.val, { color: flagColor("green") }]}>{countFlags(b, "green")}</Text>
              )}
              {row("À surveiller",
                <Text style={[styles.val, { color: flagColor("orange") }]}>{countFlags(a, "orange")}</Text>,
                <Text style={[styles.val, { color: flagColor("orange") }]}>{countFlags(b, "orange")}</Text>
              )}
              {row("À éviter",
                <Text style={[styles.val, { color: flagColor("red") }]}>{countFlags(a, "red")}</Text>,
                <Text style={[styles.val, { color: flagColor("red") }]}>{countFlags(b, "red")}</Text>
              )}
              {row("Risques",
                <Text style={styles.val}>{a.risks?.length || 0}</Text>,
                <Text style={styles.val}>{b.risks?.length || 0}</Text>
              )}

              <View style={styles.justifBlock}>
                <Text style={styles.justifLabel}>Justifications</Text>
                <View style={styles.justifCard}>
                  <Text style={styles.justifName}>{a.product_name}</Text>
                  <Text style={styles.justifText}>{a.decision.justification}</Text>
                </View>
                <View style={styles.justifCard}>
                  <Text style={styles.justifName}>{b.product_name}</Text>
                  <Text style={styles.justifText}>{b.decision.justification}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Picker modal */}
        <Modal visible={!!pickerFor} transparent animationType="slide" onRequestClose={() => setPickerFor(null)}>
          <View style={styles.pickerBackdrop}>
            <View style={[styles.pickerCard, { paddingBottom: insets.bottom + spacing.md }]}>
              <View style={styles.header}>
                <Text style={styles.title}>Choisir un produit</Text>
                <TouchableOpacity onPress={() => setPickerFor(null)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
              ) : history.length === 0 ? (
                <Text style={styles.emptyHist}>Aucune analyse dans votre historique.</Text>
              ) : (
                <ScrollView>
                  {history.map((item) => (
                    <TouchableOpacity
                      key={item.analysis_id}
                      testID={`pick-item-${item.analysis_id}`}
                      style={styles.pickItem}
                      onPress={() => {
                        if (pickerFor === "a") setA(item);
                        else setB(item);
                        setPickerFor(null);
                      }}
                    >
                      <View style={[styles.scoreDot, { borderColor: flagColor(item.decision.color) }]}>
                        <Text style={[styles.scoreDotNum, { color: flagColor(item.decision.color) }]}>{item.score}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickName} numberOfLines={1}>{item.product_name}</Text>
                        <Text style={styles.pickDecision}>{item.decision.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 26, color: colors.textPrimary, fontFamily: fonts.heading },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  scroll: { paddingHorizontal: spacing.lg },
  slots: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  vs: { color: colors.textSecondary, fontFamily: fonts.heading, fontSize: 20, fontStyle: "italic", paddingHorizontal: 4 },
  emptySlot: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", minHeight: 160 },
  emptySlotText: { color: colors.primary, fontSize: 13, marginTop: spacing.xs, fontWeight: "500" },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", minHeight: 160, justifyContent: "space-between" },
  cardName: { color: colors.textPrimary, fontSize: 13, fontWeight: "500", textAlign: "center", marginBottom: spacing.sm },
  scoreCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 18, fontWeight: "600" },
  badge: { marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },

  compareBlock: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.xs, fontWeight: "500" },
  rowValues: { flexDirection: "row" },
  rowValue: { flex: 1, alignItems: "center" },
  val: { fontSize: 15, color: colors.textPrimary, textAlign: "center", textTransform: "capitalize" },
  bigVal: { fontSize: 26, fontFamily: fonts.heading, fontWeight: "600" },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600" },

  winner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: "rgba(194,141,117,0.12)", padding: spacing.md, borderRadius: radius.input, marginBottom: spacing.md, borderWidth: 1, borderColor: "rgba(194,141,117,0.3)" },
  winnerText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },

  justifBlock: { marginTop: spacing.md },
  justifLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.sm, fontWeight: "500" },
  justifCard: { backgroundColor: colors.bg, borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.sm },
  justifName: { color: colors.textPrimary, fontWeight: "600", fontSize: 13, marginBottom: 4 },
  justifText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },

  pickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  pickerCard: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: spacing.md, maxHeight: "75%" },
  emptyHist: { textAlign: "center", color: colors.textSecondary, padding: spacing.lg },
  pickItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  scoreDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreDotNum: { fontSize: 13, fontWeight: "600" },
  pickName: { color: colors.textPrimary, fontSize: 14, fontWeight: "500" },
  pickDecision: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
