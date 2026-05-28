import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../auth";
import { Alert } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { analyzeProduct } from "../api/productApi";

export default function ProductAnalyzeScreen() {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageBase64, setImageBase64] = useState("");

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
	if (!token) {
	throw new Error("Utilisateur non connecté");
		}
      const data = await analyzeProduct({
  token,
  name,
  ingredientsText,
  imageBase64,
});

      setResult(data);
    } catch (err) {
  const message =
    err?.message ||
    "Analyse indisponible. Réessayez dans quelques instants.";

  setError(message);

  Alert.alert(
    "Analyse indisponible",
    message
  );
} finally {
      setLoading(false);
    }
  };
  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.7,
    base64: true,
  });

  if (!result.canceled) {
    const asset = result.assets[0];
    setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
  }
};
const getScoreColor = (score) => {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
};
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analyse produit</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du produit"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Colle la liste INCI ici..."
        value={ingredientsText}
        onChangeText={setIngredientsText}
        multiline
      />
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={pickImage}
>
  <Text style={styles.secondaryButtonText}>
    {imageBase64
      ? "Photo ajoutée ✅"
      : "Ajouter une photo INCI"}
  </Text>
</TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleAnalyze}>
        <Text style={styles.buttonText}>Analyser</Text>
      </TouchableOpacity>

      {loading && (
  <View style={styles.loaderBox}>
    <ActivityIndicator size="large" />
    <Text style={styles.loaderText}>Analyse du produit en cours...</Text>
  </View>
	)}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>{result.product_name}</Text>

          <Text style={[styles.score, { color: getScoreColor(result.score || 0) }]}>
			Score IA : {result.score}/100
			</Text>
			<Text
	style={[
		styles.score,
		{ color: getScoreColor(result.ingredient_analysis?.ingredient_score || 0) },
		]}
			>
	Score ingrédients : {result.ingredient_analysis?.ingredient_score}/100
		</Text>

          <Text style={styles.sectionTitle}>Décision</Text>
          <Text>{result.decision?.label}</Text>
          <Text>{result.decision?.justification}</Text>

          <Text style={styles.sectionTitle}>À surveiller</Text>
          {result.ingredient_analysis?.caution_ingredients?.map((item, index) => (
            <Text key={index}>⚠️ {item.name}</Text>
          ))}

          <Text style={styles.sectionTitle}>Bons ingrédients</Text>
          {result.ingredient_analysis?.good_ingredients?.map((item, index) => (
            <Text key={index}>✅ {item.name}</Text>
          ))}

          <Text style={styles.sectionTitle}>Anti-bullshit</Text>
          <Text>
            Ligne ~1% :{" "}
            {result.formula_positioning?.one_percent_marker || "Non détectée"}
          </Text>

          {result.formula_positioning?.marketing_flags?.map((flag, index) => (
            <Text key={index}>• {flag.message}</Text>
          ))}

          <Text style={styles.sectionTitle}>Produits recommandés</Text>
          {result.recommended_products?.map((product) => (
            <View key={product.product_id} style={styles.productCard}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text>{product.brand}</Text>
              <Text>Match : {product.match_score}/100</Text>
              <Text>Prix : {product.price_category}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },

  textarea: {
    minHeight: 140,
    textAlignVertical: "top",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },

  secondaryButtonText: {
    color: "#111",
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  error: {
    color: "red",
    marginTop: 15,
  },

  resultBox: {
    marginTop: 24,
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  score: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },

  productCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  loaderBox: {
  marginTop: 20,
  padding: 18,
  borderRadius: 14,
  backgroundColor: "#f5f5f5",
  alignItems: "center",
},

 loaderText: {
  marginTop: 10,
  fontWeight: "600",
},

  productName: {
    fontWeight: "700",
  },
});