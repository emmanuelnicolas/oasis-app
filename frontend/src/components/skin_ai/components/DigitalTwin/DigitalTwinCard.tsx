import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../../../../theme";
import { Orb } from "./Orb";
import {
  OrbMetrics,
  type OrbMetricKey,
} from "./OrbMetrics";
import { InsightCard } from "./InsightCard";
import { ObjectiveCard } from "./ObjectiveCard";
import { TwinStatusCard } from "./TwinStatusCard";
import { useResponsive } from "../../../../hooks/useResponsive";
import { buildOrbVisualState } from "./OrbVisualState";
import { MetricDetailCard } from "./MetricDetailCard";

type Props = {
  learnings: any;
  insights: string[];
};

function getLevel(confidence: number) {
  if (confidence < 10) {
    return {
      name: "Découverte",
      description: "OASIS commence à construire votre profil peau.",
    };
  }

  if (confidence < 35) {
    return {
      name: "Observation",
      description: "OASIS repère vos premières tendances.",
    };
  }

  if (confidence < 65) {
    return {
      name: "Compréhension",
      description: "Votre profil devient plus précis.",
    };
  }

  return {
    name: "Personnalisation",
    description: "OASIS adapte ses recommandations à votre historique.",
  };
}

export function DigitalTwinCard({
  learnings,
  insights,
}: Props) {
	const {
  isPhone,
  orbSize,
  cardGap,
} = useResponsive();
  
  const ingredient = learnings?.ingredient_intelligence || {};
  const skin = learnings?.skin_intelligence || {};
  const skinEntries = skin.entry_count || 0;
  const [
  selectedMetric,
  setSelectedMetric,
] = useState<OrbMetricKey | null>(null);
  
  

  const confidence = Math.min(
    100,
    Math.round(
      (ingredient.confidence || 0) * 0.4 +
        (ingredient.correlation_confidence || 0) * 0.4 +
        Math.min(skinEntries * 5, 20)
    )
  );

  const level = getLevel(confidence);
  const metrics = skin.metrics || {};

  const toPercent = (value: unknown) => {
    const numberValue = Number(value || 0);
    return Math.max(0, Math.min(100, Math.round(numberValue * 10)));
  };

  const hydration = toPercent(metrics.hydration?.latest);
  const glow = toPercent(metrics.glow?.latest);
  const texture = toPercent(metrics.texture?.latest);
  const redness = toPercent(metrics.redness?.latest);
  const metricValues = {
  hydration,
  glow,
  texture,
  redness,
};
  const visualState = buildOrbVisualState({
  hydration,
  glow,
  texture,
  redness,
  confidence,
});
  return (
  <View style={styles.card}>
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>DIGITAL TWIN</Text>
        <Text style={styles.title}>{level.name}</Text>
      </View>

    </View>

    <View
  style={[
    styles.scanArea,
    {
      height: orbSize,
    },
  ]}
>
      <OrbMetrics
  hydration={hydration}
  glow={glow}
  texture={texture}
  redness={redness}
  orbSize={orbSize}
  selectedMetric={selectedMetric}
  onMetricPress={(metric) => {
    setSelectedMetric((current) =>
      current === metric ? null : metric
    );
  }}
/>

      <Orb
  confidence={confidence}
  visualState={visualState}
/>
    </View>
	{selectedMetric ? (
  <MetricDetailCard
    metric={selectedMetric}
    value={metricValues[selectedMetric]}
  />
) : null}

    <TwinStatusCard learnings={learnings} />

    <View
  style={[
    styles.intelligenceRow,
    {
      flexDirection: isPhone ? "column" : "row",
      gap: cardGap,
    },
  ]}
>
      <InsightCard
  insights={insights}
  learnings={learnings}
/>
      <ObjectiveCard learnings={learnings} />
    </View>

    
  </View>
);
}

const styles = StyleSheet.create({
  card: {
    minHeight: 430,
    backgroundColor: "#F8F3EE",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#D8CEC5",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  eyebrow: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },

  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  scanArea: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
    overflow: "hidden",
  },

  intelligenceRow: {
    width: "100%",
    marginTop: spacing.md,
  },
});