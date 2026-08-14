import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../../../theme";

export type OrbMetricKey =
  | "hydration"
  | "glow"
  | "texture"
  | "redness";

type Props = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
  orbSize: number;
  selectedMetric?: OrbMetricKey | null;
  onMetricPress: (metric: OrbMetricKey) => void;
};

export function OrbMetrics({
  hydration,
  glow,
  texture,
  redness,
  orbSize,
  selectedMetric,
  onMetricPress,
}: Props) {
  const valueSize = Math.max(
    18,
    Math.min(26, orbSize * 0.075)
  );

  const labelSize = Math.max(
    10,
    Math.min(13, orbSize * 0.036)
  );

  const metrics = [
    {
      key: "hydration" as const,
      label: "Hydratation",
      value: hydration,
      position: styles.topLeft,
      alignment: styles.leftMetric,
    },
    {
      key: "glow" as const,
      label: "Glow",
      value: glow,
      position: styles.topRight,
      alignment: styles.rightMetric,
    },
    {
      key: "texture" as const,
      label: "Texture",
      value: texture,
      position: styles.bottomLeft,
      alignment: styles.leftMetric,
    },
    {
      key: "redness" as const,
      label: "Rougeurs",
      value: redness,
      position: styles.bottomRight,
      alignment: styles.rightMetric,
    },
  ];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          width: orbSize,
          height: orbSize,
        },
      ]}
    >
      {metrics.map((metric) => {
        const selected =
          selectedMetric === metric.key;

        return (
          <Pressable
            key={metric.key}
            accessibilityRole="button"
            accessibilityLabel={`${metric.label} ${metric.value}%`}
            onPress={() =>
              onMetricPress(metric.key)
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.metric,
              metric.position,
              metric.alignment,
              selected && styles.metricSelected,
              pressed && styles.metricPressed,
            ]}
          >
            <Text
  maxFontSizeMultiplier={1.1}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.82}
  style={[
    styles.label,
    {
      fontSize: labelSize,
    },
    selected && styles.labelSelected,
  ]}
>
  {metric.label}
</Text>

            <Text
              maxFontSizeMultiplier={1.1}
              style={[
                styles.value,
                {
                  fontSize: valueSize,
                },
                selected && styles.valueSelected,
              ]}
            >
              {metric.value}%
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 5,
  },

  metric: {
    position: "absolute",
    width: "34%",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  metricSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },

  metricPressed: {
    opacity: 0.65,
  },

  leftMetric: {
    alignItems: "flex-start",
  },

  rightMetric: {
    alignItems: "flex-end",
  },

topLeft: {
  left: -4,
  top: "14%",
},

topRight: {
  right: -4,
  top: "14%",
},

bottomLeft: {
  left: -4,
  bottom: "14%",
},

bottomRight: {
  right: -4,
  bottom: "14%",
},

  label: {
    color: colors.textSecondary,
    lineHeight: 16,
	fontWeight: "500",
  },

  labelSelected: {
    color: colors.textPrimary,
  },

  value: {
    color: colors.textPrimary,
    fontWeight: "600",
    lineHeight: 29,
  },

  valueSelected: {
    fontWeight: "700",
  },
});