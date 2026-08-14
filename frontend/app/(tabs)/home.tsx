import React from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";

import { useAuth } from "../../src/auth";
import { useJournal } from "../../src/hooks/useJournal";
import { useRoutines } from "../../src/hooks/useRoutines";
import { useRoutineTracking } from "../../src/hooks/useRoutineTracking";

import { SkinAiDashboard } from "../../src/components/skin_ai/SkinAiDashboard";

import {
  colors,
} from "../../src/theme";

export default function Home() {
  const { token } = useAuth();

  const {
    routines,
    loading: routinesLoading,
    generating: generatingRoutines,
    regenerateRoutines,
  } = useRoutines(token);

  const {
    loading: routineTrackingLoading,
    toggleStep,
    isStepCompleted,
    stats: routineStats,
  } = useRoutineTracking(token);

  const {
    entries,
    loading,

    learnings,
    insights,

    pendingFeedback,
    submitFeedback,

    pickImage,
    removeEntry,
  } = useJournal(token);

  if (
    loading ||
    routinesLoading ||
    routineTrackingLoading
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator
          color={colors.primary}
        />
      </View>
    );
  }

  const safeInsights = (
    insights ?? []
  ).filter(
    (
      item
    ): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );

  const routineTotalSteps =
    (routines.matin?.steps?.length || 0) +
    (routines.soir?.steps?.length || 0);

  const routineCompletedCount = [
    ...(routines.matin?.steps || []).map(
      (step) =>
        isStepCompleted(
          "matin",
          step.order
        )
    ),
    ...(routines.soir?.steps || []).map(
      (step) =>
        isStepCompleted(
          "soir",
          step.order
        )
    ),
  ].filter(Boolean).length;

  const routineTodayProgress =
    routineTotalSteps > 0
      ? Math.round(
          (routineCompletedCount /
            routineTotalSteps) *
            100
        )
      : 0;

  return (
    <SkinAiDashboard
      learnings={learnings}
      insights={safeInsights}
      entries={entries}
      pendingFeedback={
        pendingFeedback
      }

      morningRoutine={
        routines.matin
      }
      eveningRoutine={
        routines.soir
      }
      weeklyRoutine={
        routines.hebdo
      }

      generatingRoutines={
        generatingRoutines
      }

      onGenerateRoutines={
        regenerateRoutines
      }

      onSubmitFeedback={
        submitFeedback
      }

      onAddTracking={
        pickImage
      }

      onToggleRoutineStep={
        toggleStep
      }

      isRoutineStepCompleted={
        isStepCompleted
      }

      routineStreak={
        routineStats?.streak || 0
      }

      routineTotalDays={
        routineStats?.total_days || 0
      }

      routineTodayProgress={
        routineTodayProgress
      }

      onDeleteTracking={
        removeEntry
      }
    />
  );
}
