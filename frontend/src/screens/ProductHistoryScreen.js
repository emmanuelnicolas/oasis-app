import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../auth";
import { getProductHistory } from "../api/historyApi";

function getScoreColor(score) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#f59e0b";
  return "#dc2626";
}

export default function ProductHistoryScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (!token) return;
        const data = await getProductHistory(token);
        setItems(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Historique des analyses</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {items.length === 0 ? (
        <Text style={styles.empty}>Aucune analyse pour le moment.</Text>
      ) : (
        items.map((item) => (
          <View key={item.analysis_id} style={styles.card}>
            <Text style={styles.name}>{item.product_name || "Produit analysé"}</Text>

            <Text style={[styles.score, { color: getScoreColor(item.score || 0) }]}>
              Score : {item.score || 0}/100
            </Text>

            <Text style={styles.label}>{item.decision?.label}</Text>
            <Text>{item.decision?.justification}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  score: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  label: { fontWeight: "700", marginBottom: 4 },
  empty: { color: "#666" },
  error: { color: "red", marginBottom: 10 },
});