import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../auth";

type CompletedSteps = Record<string, boolean>;

type TrackingStats = {
  total_days: number;
  streak: number;
  history: any[];
};
type RoutinePeriod =
  | "matin"
  | "soir"
  | "hebdo";

export function useRoutineTracking(token: string | null) {
  const [completedSteps, setCompletedSteps] =
    useState<CompletedSteps>({});

  const [stats, setStats] = useState<TrackingStats>({
    total_days: 0,
    streak: 0,
    history: [],
  });

  const [loading, setLoading] = useState(true);

  const loadTodayTracking = useCallback(async () => {
    if (!token) return;

    const result = await apiFetch(
      token,
      "/tracking/today"
    );

    setCompletedSteps(result?.completed || {});
  }, [token]);

  const loadTrackingStats = useCallback(async () => {
    if (!token) return;

    const result = await apiFetch(
      token,
      "/tracking/stats"
    );

    setStats({
      total_days: Number(result?.total_days || 0),
      streak: Number(result?.streak || 0),
      history: result?.history || [],
    });
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await Promise.all([
          loadTodayTracking(),
          loadTrackingStats(),
        ]);
      } catch (error) {
        console.error(
          "Erreur chargement suivi routine :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    token,
    loadTodayTracking,
    loadTrackingStats,
  ]);

  const toggleStep = async (
  routineType: RoutinePeriod,
  stepOrder: number
) => {
    if (!token) return;

    const key = `${routineType}_${stepOrder}`;

    const previousValue = Boolean(
      completedSteps[key]
    );

    const nextValue = !previousValue;

    setCompletedSteps((current) => ({
      ...current,
      [key]: nextValue,
    }));

    try {
      const result = await apiFetch(
        token,
        "/tracking/toggle",
        {
          method: "POST",
          body: JSON.stringify({
            routine_type: routineType,
            step_order: stepOrder,
            completed: nextValue,
          }),
        }
      );

      setCompletedSteps(result?.completed || {});
      await loadTrackingStats();
    } catch (error) {
      setCompletedSteps((current) => ({
        ...current,
        [key]: previousValue,
      }));

      console.error(
        "Erreur mise à jour routine :",
        error
      );
    }
  };

  const isStepCompleted = (
  routineType: RoutinePeriod,
  stepOrder: number
) => {
    return Boolean(
      completedSteps[
        `${routineType}_${stepOrder}`
      ]
    );
  };

  const completedCount = Object.values(
  completedSteps
).filter(Boolean).length;

  return {
    completedSteps,
    stats,
    completedCount,
    loading,
    toggleStep,
    isStepCompleted,
    loadTodayTracking,
    loadTrackingStats,
  };
}