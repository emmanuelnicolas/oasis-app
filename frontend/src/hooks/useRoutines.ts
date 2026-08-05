import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { apiFetch } from "../auth";

export type RoutineStep = {
  order: number;
  name: string;
  product_type: string;
  instructions: string;
  benefits: string;
  completed?: boolean;
};

export type Routine = {
  type: string;
  title: string;
  description: string;
  steps: RoutineStep[];
};

export type RoutinesByPeriod = {
  matin?: Routine;
  soir?: Routine;
  hebdo?: Routine;
};

export function useRoutines(token: string | null) {
  const [routines, setRoutines] = useState<RoutinesByPeriod>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadRoutines = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const result = await apiFetch(token, "/routines");
      setRoutines(result || {});
    } catch (error: any) {
      console.error("Erreur chargement routines :", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const regenerateRoutines = async () => {
    if (!token) {
      Alert.alert("Session expirée", "Reconnectez-vous.");
      return;
    }

    setGenerating(true);

    try {
      const result = await apiFetch(token, "/routines/generate", {
        method: "POST",
      });

      setRoutines(result || {});

      Alert.alert(
        "Routines créées",
        "Vos nouvelles routines sont disponibles."
      );
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de générer les routines."
      );
    } finally {
      setGenerating(false);
    }
  };

  return {
    routines,
    loading,
    generating,
    loadRoutines,
    regenerateRoutines,
  };
}