import React, { useEffect } from "react";
import {
  Circle,
  Group,
  Line,
} from "@shopify/react-native-skia";

import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  center: number;
  scale: number;
};

export function OrbConnections({
  center,
  scale,
}: Props) {
  const lineColor = "#CFC2B8";
  const pointColor = "#AA988A";

  const pointRadius = useSharedValue(
    2.2 * scale
  );

  const pointOpacity = useSharedValue(
    0.48
  );

  useEffect(() => {
    pointRadius.value = withRepeat(
      withTiming(2.8 * scale, {
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    pointOpacity.value = withRepeat(
      withTiming(0.72, {
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [
    pointOpacity,
    pointRadius,
    scale,
  ]);

  const strokeWidth = Math.max(
    0.6,
    0.72 * scale
  );

  return (
    <Group opacity={0.62}>
      {/* Hydratation */}
      <Line
        p1={{
          x: center - 154 * scale,
          y: center - 86 * scale,
        }}
        p2={{
          x: center - 112 * scale,
          y: center - 86 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Line
        p1={{
          x: center - 112 * scale,
          y: center - 86 * scale,
        }}
        p2={{
          x: center - 88 * scale,
          y: center - 60 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Circle
        cx={center - 88 * scale}
        cy={center - 60 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Glow */}
      <Line
        p1={{
          x: center + 154 * scale,
          y: center - 86 * scale,
        }}
        p2={{
          x: center + 112 * scale,
          y: center - 86 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Line
        p1={{
          x: center + 112 * scale,
          y: center - 86 * scale,
        }}
        p2={{
          x: center + 88 * scale,
          y: center - 60 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Circle
        cx={center + 88 * scale}
        cy={center - 60 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Texture */}
      <Line
        p1={{
          x: center - 154 * scale,
          y: center + 88 * scale,
        }}
        p2={{
          x: center - 112 * scale,
          y: center + 88 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Line
        p1={{
          x: center - 112 * scale,
          y: center + 88 * scale,
        }}
        p2={{
          x: center - 88 * scale,
          y: center + 62 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Circle
        cx={center - 88 * scale}
        cy={center + 62 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Rougeurs */}
      <Line
        p1={{
          x: center + 154 * scale,
          y: center + 88 * scale,
        }}
        p2={{
          x: center + 112 * scale,
          y: center + 88 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Line
        p1={{
          x: center + 112 * scale,
          y: center + 88 * scale,
        }}
        p2={{
          x: center + 88 * scale,
          y: center + 62 * scale,
        }}
        color={lineColor}
        strokeWidth={strokeWidth}
      />

      <Circle
        cx={center + 88 * scale}
        cy={center + 62 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />
    </Group>
  );
}