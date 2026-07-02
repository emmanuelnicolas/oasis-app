import { useCallback, useEffect, useState } from "react";
import {
  getRoutines,
  getTodayTracking,
  getSeasonalTips,
  getTrackingStats,
  toggleRoutineStep,
} from "../services/routineService";

import type {
  RoutinesByType,
  TrackingCompleted,
  TrackingStats,
  SeasonalTip,
} from "../types/routine";

export function useHome(token: string | null) {
  const [routines, setRoutines] = useState<RoutinesByType>({});
  const [tracking, setTracking] = useState<TrackingCompleted>({});
  const [tip, setTip] = useState<SeasonalTip | null>(null);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const start = Date.now();

    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [r, t, s, st] = await Promise.all([
        getRoutines(token),
        getTodayTracking(token),
        getSeasonalTips(token),
        getTrackingStats(token),
      ]);

      setRoutines(r || {});
      setTracking((t && t.completed) || {});
      setTip(s);
      setStats(st);

      console.log("Temps chargement Home :", Date.now() - start, "ms");
      console.log("Routine chargée :", Object.keys(r || {}).length);
      console.log(
        "Tracking aujourd'hui :",
        Object.keys((t && t.completed) || {}).length
      );
    } catch (e) {
      console.log("home load error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStep = async (rtype: string, order: number) => {
    if (!token) return;

    const start = Date.now();
    const key = `${rtype}_${order}`;
    const newVal = !tracking[key];

    setTracking((p) => ({ ...p, [key]: newVal }));

    try {
      await toggleRoutineStep(token, rtype, order, newVal);

      console.log(
        "Temps validation étape routine :",
        Date.now() - start,
        "ms"
      );
    } catch {
      setTracking((p) => ({ ...p, [key]: !newVal }));
    }
  };

  const startRefreshing = () => {
    setRefreshing(true);
    load();
  };

const hour = new Date().getHours();
const greeting =
  hour < 12 ? "Bonjour" : hour < 18 ? "Bonjour" : "Bonsoir";

const focusType = hour < 17 ? "matin" : "soir";
const focusRoutine = routines[focusType];

const completedCount = focusRoutine
  ? focusRoutine.steps.filter((step) => {
      const key = `${focusType}_${step.order}`;
      return !!tracking[key];
    }).length
  : 0;

const totalSteps = focusRoutine?.steps.length || 0;
  return {
  routines,
  tracking,
  tip,
  stats,
  loading,
  refreshing,
  greeting,
  focusType,
  focusRoutine,
  completedCount,
  totalSteps,
  load,
  startRefreshing,
  toggleStep,
 };
}
