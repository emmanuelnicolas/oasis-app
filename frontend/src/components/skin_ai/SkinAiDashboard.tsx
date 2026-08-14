import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  colors,
  fonts,
  spacing,
} from "../../theme";

import { useResponsive } from "../../hooks/useResponsive";
import type { Routine } from "../../hooks/useRoutines";
import type { JournalEntry } from "../../types/journal";

import { DigitalTwinCard } from "./components/DigitalTwin/DigitalTwinCard";
import { CoachCard } from "./components/CoachCard";
import { AlertCard } from "./components/AlertCard";
import { DiscoveriesCard } from "./components/DiscoveriesCard";
import { PhotosCard } from "./components/PhotosCard";
import { ProgressCard } from "./components/ProgressCard";

import { FeedbackCard } from "../journal/FeedbackCard";

import { RoutineSetupCard } from "./components/RoutineSetupCard";
import { DailyRoutineSummary } from "./components/DailyRoutineSummary";

import {
  RoutineItem,
  RoutinePeriod,
} from "./components/RoutineCard";

import { TrackingDetailModal } from "./components/TrackingDetailModal";
import { TrackingComparisonModal } from "./components/TrackingComparisonModal";
import { ProgressDetailModal } from "./components/ProgressDetailModal";
import { RoutineDetailModal } from "./components/RoutineDetailModal";
import { InsightDetailModal } from "./components/InsightDetailModal";
import { DiscoveriesDetailModal } from "./components/DiscoveriesDetailModal";
import { AlertDetailModal } from "./components/AlertDetailModal";

type Props = {
  learnings: any;
  insights: string[];
  entries: any[];
  pendingFeedback: any[];

  morningRoutine?: Routine;
  eveningRoutine?: Routine;
  weeklyRoutine?: Routine;

  generatingRoutines: boolean;

  onGenerateRoutines:
    () => void | Promise<void>;

  onSubmitFeedback: (
    item: any,
    result: string
  ) => void | Promise<void>;

  onAddTracking: () => void;

  onToggleRoutineStep: (
    period: RoutinePeriod,
    order: number
  ) => void | Promise<void>;

  isRoutineStepCompleted: (
    period: RoutinePeriod,
    order: number
  ) => boolean;

  routineStreak: number;
  routineTotalDays: number;
  routineTodayProgress: number;

  onDeleteTracking: (
    trackingId: string
  ) => void | Promise<void>;
};

export function SkinAiDashboard({
  learnings,
  insights,
  entries,
  pendingFeedback,
  morningRoutine,
  eveningRoutine,
  weeklyRoutine,
  generatingRoutines,
  onGenerateRoutines,
  onSubmitFeedback,
  onAddTracking,
  onToggleRoutineStep,
  isRoutineStepCompleted,
  routineStreak,
  routineTotalDays,
  routineTodayProgress,
  onDeleteTracking,
}: Props) {
  const insets = useSafeAreaInsets();

  const {
    isPhone,
    horizontalPadding,
    contentMaxWidth,
  } = useResponsive();

  const [
    selectedTracking,
    setSelectedTracking,
  ] = useState<JournalEntry | null>(null);

  const [
    comparisonEntries,
    setComparisonEntries,
  ] = useState<
    [JournalEntry, JournalEntry] | null
  >(null);
  
  const [
  discoveriesOpen,
  setDiscoveriesOpen,
] = useState(false);

  const [
    progressOpen,
    setProgressOpen,
  ] = useState(false);

  const [
    routineDetailsOpen,
    setRoutineDetailsOpen,
  ] = useState(false);

  const [
    insightOpen,
    setInsightOpen,
  ] = useState(false);
  
  const [
  alertOpen,
  setAlertOpen,
  ] = useState(false);

  const mapRoutineSteps = (
    routineType: RoutinePeriod,
    steps: Routine["steps"] = []
  ): RoutineItem[] =>
    steps.map((step) => ({
      order: step.order,
      label: step.name,
      productName:
        step.instructions ||
        step.product_type ||
        "Étape personnalisée",
      completed:
        isRoutineStepCompleted(
          routineType,
          step.order
        ),
    }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            insets.top + spacing.md,
          paddingHorizontal:
            horizontalPadding,
          paddingBottom:
            insets.bottom + spacing.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.contentInner,
          {
            maxWidth: contentMaxWidth,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.brand}>
              OASIS AI
            </Text>

            <Text
              style={[
                styles.title,
                isPhone &&
                  styles.titlePhone,
              ]}
            >
              Votre peau aujourd’hui
            </Text>

            <Text style={styles.subtitle}>
              OASIS affine votre profil à
              partir de vos suivis, produits
              et retours.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter un suivi peau"
            onPress={onAddTracking}
            hitSlop={8}
            style={({ pressed }) => [
              styles.addButton,
              pressed &&
                styles.addButtonPressed,
            ]}
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <DigitalTwinCard
          learnings={learnings}
          insights={insights}
        />

        <CoachCard
          insights={insights}
          onPress={() =>
            setInsightOpen(true)
          }
        />
		
		<AlertDetailModal
  visible={alertOpen}
  onClose={() =>
    setAlertOpen(false)
  }
/>

        <AlertCard
  onPress={() =>
    setAlertOpen(true)
  }
/>

        {morningRoutine ||
        eveningRoutine ||
        weeklyRoutine ? (
          <DailyRoutineSummary
            morningItems={
              morningRoutine
                ? mapRoutineSteps(
                    "matin",
                    morningRoutine.steps
                  )
                : []
            }
            eveningItems={
              eveningRoutine
                ? mapRoutineSteps(
                    "soir",
                    eveningRoutine.steps
                  )
                : []
            }
            weeklyItems={
              weeklyRoutine
                ? mapRoutineSteps(
                    "hebdo",
                    weeklyRoutine.steps
                  )
                : []
            }
            onToggleStep={
              onToggleRoutineStep
            }
            onOpenDetails={() =>
              setRoutineDetailsOpen(
                true
              )
            }
          />
        ) : (
          <RoutineSetupCard
            generating={
              generatingRoutines
            }
            onGenerate={
              onGenerateRoutines
            }
          />
        )}

        <ProgressCard
          learnings={learnings}
          streak={routineStreak}
          totalDays={routineTotalDays}
          todayProgress={
            routineTodayProgress
          }
          onPress={() =>
            setProgressOpen(true)
          }
        />

        <FeedbackCard
          pendingFeedback={
            pendingFeedback
          }
          onSubmit={
            onSubmitFeedback
          }
        />

        <DiscoveriesCard
		  learnings={learnings}
		  onPress={() =>
			setDiscoveriesOpen(true)
		  }
		/>

        <PhotosCard
          entries={
            entries as JournalEntry[]
          }
          onDeleteEntry={
            onDeleteTracking
          }
          onOpenEntry={(entry) =>
            setSelectedTracking(entry)
          }
          onCompareEntries={(
            firstEntry,
            secondEntry
          ) =>
            setComparisonEntries([
              firstEntry,
              secondEntry,
            ])
          }
          onAddTracking={
            onAddTracking
          }
        />

        <TrackingDetailModal
          visible={Boolean(
            selectedTracking
          )}
          entry={selectedTracking}
          onClose={() =>
            setSelectedTracking(null)
          }
        />

        <TrackingComparisonModal
          visible={Boolean(
            comparisonEntries
          )}
          firstEntry={
            comparisonEntries?.[0] ||
            null
          }
          secondEntry={
            comparisonEntries?.[1] ||
            null
          }
          onClose={() =>
            setComparisonEntries(null)
          }
        />

        <ProgressDetailModal
          visible={progressOpen}
          onClose={() =>
            setProgressOpen(false)
          }
          streak={routineStreak}
          totalDays={routineTotalDays}
          todayProgress={
            routineTodayProgress
          }
          learnings={learnings}
        />

        <RoutineDetailModal
          visible={
            routineDetailsOpen
          }
          onClose={() =>
            setRoutineDetailsOpen(
              false
            )
          }
          morningItems={
            morningRoutine
              ? mapRoutineSteps(
                  "matin",
                  morningRoutine.steps
                )
              : []
          }
          eveningItems={
            eveningRoutine
              ? mapRoutineSteps(
                  "soir",
                  eveningRoutine.steps
                )
              : []
          }
          weeklyItems={
            weeklyRoutine
              ? mapRoutineSteps(
                  "hebdo",
                  weeklyRoutine.steps
                )
              : []
          }
          onToggleStep={
            onToggleRoutineStep
          }
        />

        <InsightDetailModal
          visible={insightOpen}
          onClose={() =>
            setInsightOpen(false)
          }
          insights={insights}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4EEE8",
  },

  content: {
    alignItems: "center",
  },

  contentInner: {
    width: "100%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },

  headerContent: {
    flex: 1,
    paddingRight: spacing.md,
  },

  brand: {
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },

  titlePhone: {
    fontSize: 21,
    lineHeight: 26,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    maxWidth: 420,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  addButtonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },
});