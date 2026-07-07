import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme";

type Props = {
  visible: boolean;
  bottomPadding: number;
  pickedImage: string | null;
  note: string;
  setNote: (value: string) => void;
  hydration: number;
  setHydration: (n: number) => void;
  glow: number;
  setGlow: (n: number) => void;
  texture: number;
  setTexture: (n: number) => void;
  irritation: number;
  setIrritation: (n: number) => void;
  breakouts: number;
  setBreakouts: (n: number) => void;
  redness: number;
  setRedness: (n: number) => void;
  onClose: () => void;
  recentProducts: any[];
  selectedProducts: any[];
  setSelectedProducts: (products: any[]) => void;
  analysis: any;
  analyzing: boolean;
  saving: boolean;
  onAnalyze: () => void;
  onSave: () => void;
};

export function JournalModal({
  visible,
  bottomPadding,
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
  onClose,
  recentProducts,
  selectedProducts,
  setSelectedProducts,
  analysis,
  analyzing,
  saving,
  onAnalyze,
  onSave,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: bottomPadding }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle entrée</Text>
            <TouchableOpacity onPress={onClose} testID="close-modal-btn">
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

            <MetricSelector label="Hydratation" value={hydration} onChange={setHydration} />
            <MetricSelector label="Glow" value={glow} onChange={setGlow} />
            <MetricSelector label="Texture" value={texture} onChange={setTexture} />
            <MetricSelector label="Irritation" value={irritation} onChange={setIrritation} />
            <MetricSelector label="Breakouts" value={breakouts} onChange={setBreakouts} />
            <MetricSelector label="Redness" value={redness} onChange={setRedness} />
			<Text style={styles.label}>Produits utilisés récemment</Text>

{recentProducts.map((product: any) => {
  const selected = selectedProducts.some(
    (item) => item.analysis_id === product.analysis_id
  );

  return (
    <TouchableOpacity
      key={product.analysis_id}
      style={[styles.productChip, selected && styles.productChipActive]}
      onPress={() => {
        if (selected) {
          setSelectedProducts(
            selectedProducts.filter(
              (item) => item.analysis_id !== product.analysis_id
            )
          );
        } else {
          setSelectedProducts([...selectedProducts, product]);
        }
      }}
    >
      <Text style={{ color: selected ? "#fff" : colors.textPrimary }}>
        {product.product_name}
      </Text>
    </TouchableOpacity>
  );
})}

{analysis && (
  <View style={styles.analysisCard} testID="analysis-result">
    <Text style={styles.analysisLabel}>Analyse IA</Text>
    <Text style={styles.analysisType}>Type: {analysis.skin_type}</Text>

    {analysis.concerns?.length > 0 && (
      <Text style={styles.analysisConcerns}>
        Préoccupations: {analysis.concerns.join(", ")}
      </Text>
    )}

    <Text style={styles.analysisSummary}>{analysis.summary}</Text>
  </View>
)}

<TouchableOpacity
  testID="analyze-btn"
  style={styles.secondaryBtn}
  onPress={onAnalyze}
  disabled={analyzing}
>
  {analyzing ? (
    <ActivityIndicator color={colors.primary} />
  ) : (
    <Text style={styles.secondaryBtnText}>✦ Analyser ma peau (IA)</Text>
  )}
</TouchableOpacity>

<TouchableOpacity
  testID="save-entry-btn"
  style={styles.primaryBtn}
  onPress={onSave}
  disabled={saving}
>
  {saving ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.primaryBtnText}>Enregistrer</Text>
  )}
</TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MetricSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <>
      <Text style={styles.label}>{label} : {value}/10</Text>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.scaleBtn, value === n && styles.scaleBtnActive]}
            onPress={() => onChange(n)}
          >
            <Text>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 22, color: colors.textPrimary, fontFamily: fonts.heading },
  preview: { width: "100%", height: 240, borderRadius: radius.card, marginBottom: spacing.md },
  label: { fontSize: 11, color: colors.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: spacing.md, fontSize: 14, color: colors.textPrimary, minHeight: 70, marginBottom: spacing.md },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.md },
  scaleBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  scaleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
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
analysisCard: {
  backgroundColor: "rgba(126,154,136,0.1)",
  borderRadius: radius.input,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: "rgba(126,154,136,0.3)",
},
analysisLabel: {
  fontSize: 11,
  color: colors.primary,
  letterSpacing: 2,
  textTransform: "uppercase",
  fontWeight: "500",
},
analysisType: {
  fontSize: 16,
  color: colors.textPrimary,
  marginTop: spacing.xs,
  fontWeight: "500",
},
analysisConcerns: {
  fontSize: 13,
  color: colors.textSecondary,
  marginTop: 2,
},
analysisSummary: {
  fontSize: 13,
  color: colors.textPrimary,
  marginTop: spacing.sm,
  lineHeight: 18,
},
primaryBtn: {
  backgroundColor: colors.primary,
  borderRadius: radius.button,
  paddingVertical: 14,
  alignItems: "center",
  marginTop: spacing.sm,
},
primaryBtnText: {
  color: "#fff",
  fontWeight: "500",
  fontSize: 15,
},
secondaryBtn: {
  borderWidth: 1,
  borderColor: colors.primary,
  borderRadius: radius.button,
  paddingVertical: 12,
  alignItems: "center",
  marginBottom: spacing.sm,
},
secondaryBtnText: {
  color: colors.primary,
  fontWeight: "500",
  fontSize: 14,
},
});