import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { useAuth } from "../auth";
import { getRoutines, generateRoutines } from "../api/routineApi";

export default function RoutineScreen() {
  const { token } = useAuth();

  const [routines, setRoutines] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadRoutines = async () => {
    try {
      if (!token) return;

      const data = await getRoutines(token);
      setRoutines(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError("");

      const data = await generateRoutines(token);
      setRoutines(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, [token]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 40 }}
      />
    );
  }

  const sections = [
    ["matin", "Routine matin"],
    ["soir", "Routine soir"],
    ["hebdo", "Routine hebdo"],
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mes routines</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGenerate}
      >
        <Text style={styles.buttonText}>
          {generating
            ? "Génération..."
            : "Générer ma routine"}
        </Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      {sections.map(([key, fallback]) => {
        const routine = routines[key];

        return (
          <View key={key} style={styles.card}>
            <Text style={styles.sectionTitle}>
              {routine?.title || fallback}
            </Text>

            <Text style={styles.description}>
              {routine?.description ||
                "Aucune routine générée"}
            </Text>

            {routine?.steps?.map((step) => (
              <View key={step.order} style={styles.step}>
                <Text style={styles.stepTitle}>
                  {step.order}. {step.name}
                </Text>

                <Text>{step.instructions}</Text>

                <Text style={styles.benefits}>
                  {step.benefits}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
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

  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },

  description: {
    color: "#555",
    marginBottom: 12,
  },

  step: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  stepTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  benefits: {
    color: "#16a34a",
    marginTop: 4,
  },

  error: {
    color: "red",
    marginTop: 10,
  },
});