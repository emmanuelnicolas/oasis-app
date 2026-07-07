import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../auth";
import type { JournalEntry } from "../types/journal";

export function useJournal(token: string | null) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
  const [analysis, setAnalysis] = useState<any>(null);

  const [recentProducts, setRecentProducts] = useState<any[]>([]);
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

  const getTrend = (
    key: keyof JournalEntry,
    label: string,
    emoji: string,
    reverse = false
  ) => {
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
    if (!token) {
      setLoading(false);
      return;
    }

    const start = Date.now();

    try {
      const [e, products, feedback, learningData] = await Promise.all([
        apiFetch(token, "/skin/tracking"),
        apiFetch(token, "/products/recent"),
        apiFetch(token, "/product-feedback/pending").catch(() => []),
        apiFetch(token, "/oasis-learnings").catch(() => null),
      ]);

      setEntries(e || []);
      setRecentProducts(products || []);
      setPendingFeedback(feedback || []);
      setLearnings(learningData);

      console.log("Temps chargement Journal :", Date.now() - start, "ms");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        Alert.alert(
          "Permission requise",
          "L'accès à vos photos est nécessaire."
        );
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
    if (!token) return;

    const start = Date.now();
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
          linked_products: selectedProducts.map((p) => p.analysis_id),
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

      Alert.alert(
        "Journal enregistré",
        "Votre suivi peau a bien été sauvegardé."
      );

      await load();

      console.log("Temps sauvegarde Journal :", Date.now() - start, "ms");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const analyze = async () => {
    if (!token || !pickedImage) return;

    const start = Date.now();
    setAnalyzing(true);

    try {
      const result = await apiFetch(token, "/skin/analyze", {
        method: "POST",
        body: JSON.stringify({ image_base64: pickedImage }),
      });

      setAnalysis(result);

      console.log("Temps analyse selfie IA :", Date.now() - start, "ms");
    } catch (e: any) {
      Alert.alert("Erreur d'analyse", e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!token) return;

    try {
      await apiFetch(token, `/skin/tracking/${id}`, {
        method: "DELETE",
      });

      setEntries((previousEntries) =>
        previousEntries.filter((entry) => entry.tracking_id !== id)
      );
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const submitFeedback = async (item: any, result: string) => {
    if (!token) return;

    try {
      await apiFetch(token, "/product-feedback", {
        method: "POST",
        body: JSON.stringify({
          analysis_id: item.analysis_id,
          product_name: item.product_name,
          overall_result: result,
        }),
      });

      setPendingFeedback((previousFeedbacks) =>
        previousFeedbacks.filter(
          (feedback) => feedback.analysis_id !== item.analysis_id
        )
      );

      Alert.alert("Merci", "Votre retour a été enregistré.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  return {
    entries,
    loading,

    pickerOpen,
    setPickerOpen,
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

    saving,
    analyzing,
    analysis,

    recentProducts,
    selectedProducts,
    setSelectedProducts,
    pendingFeedback,
    learnings,
    insights,

    load,
    pickImage,
    save,
    analyze,
    removeEntry,
    submitFeedback,
  };
}