import { apiFetch } from "../auth";

export async function getRoutines(token: string | null) {
  return apiFetch(token, "/routines");
}

export async function getTodayTracking(token: string | null) {
  return apiFetch(token, "/tracking/today");
}

export async function getTrackingStats(token: string | null) {
  return apiFetch(token, "/tracking/stats");
}

export async function getSeasonalTips(token: string | null) {
  return apiFetch(token, "/tips/seasonal");
}

export async function toggleRoutineStep(
  token: string | null,
  routineType: string,
  stepOrder: number,
  completed: boolean
) {
  return apiFetch(token, "/tracking/toggle", {
    method: "POST",
    body: JSON.stringify({
      routine_type: routineType,
      step_order: stepOrder,
      completed,
    }),
  });
}