import React from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../src/auth";
import { useJournal } from "../../src/hooks/useJournal";
import {
  colors,
  spacing,
} from "../../src/theme";

import { SkinAiDashboard } from "../../src/components/skin_ai/SkinAiDashboard";
import { JournalModal } from "../../src/components/journal/JournalModal";
import { useRoutines } from "../../src/hooks/useRoutines";
import { useRoutineTracking } from "../../src/hooks/useRoutineTracking";

export default function Journal() {
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
  const insets = useSafeAreaInsets();

  const {
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

    learnings,
    insights,

    pickImage,
    save,
    analyze,
	
	pendingFeedback,
	submitFeedback,
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
          size="large"
        />
      </View>
    );
  }

  const safeInsights = (insights ?? []).filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
  const routineTotalSteps =
  (routines.matin?.steps?.length || 0) +
  (routines.soir?.steps?.length || 0);

const routineCompletedCount = [
  ...(routines.matin?.steps || []).map((step) =>
    isStepCompleted("matin", step.order)
  ),
  ...(routines.soir?.steps || []).map((step) =>
    isStepCompleted("soir", step.order)
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
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <SkinAiDashboard
  learnings={learnings}
  insights={safeInsights}
  entries={entries}
  pendingFeedback={pendingFeedback}
  morningRoutine={routines.matin}
  eveningRoutine={routines.soir}
  generatingRoutines={generatingRoutines}
  onGenerateRoutines={regenerateRoutines}
  onSubmitFeedback={submitFeedback}
  onAddTracking={pickImage}
  onToggleRoutineStep={toggleStep}
  isRoutineStepCompleted={isStepCompleted}
  routineStreak={routineStats.streak}
  routineTotalDays={routineStats.total_days}
  routineTodayProgress={routineTodayProgress}
  onDeleteTracking={removeEntry}
  weeklyRoutine={routines.hebdo}
/>

      <JournalModal
        visible={pickerOpen}
        bottomPadding={insets.bottom + spacing.md}
        pickedImage={pickedImage}
        note={note}
        setNote={setNote}
        hydration={hydration}
        setHydration={setHydration}
        glow={glow}
        setGlow={setGlow}
        texture={texture}
        setTexture={setTexture}
        irritation={irritation}
        setIrritation={setIrritation}
        breakouts={breakouts}
        setBreakouts={setBreakouts}
        redness={redness}
        setRedness={setRedness}
        recentProducts={recentProducts}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        analysis={analysis}
        analyzing={analyzing}
        saving={saving}
        onAnalyze={analyze}
        onSave={save}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
