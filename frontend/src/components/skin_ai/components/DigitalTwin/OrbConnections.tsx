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
  const lineColor = "#BDAEA2";
  const pointColor = "#8F7B6E";

  const pointRadius = useSharedValue(3 * scale);
  const pointOpacity = useSharedValue(0.65);

  useEffect(() => {
    pointRadius.value = withRepeat(
      withTiming(4.2 * scale, {
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    pointOpacity.value = withRepeat(
      withTiming(1, {
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pointOpacity, pointRadius, scale]);

  return (
    <Group opacity={0.75}>
      {/* Hydratation — haut gauche */}
      <Line
        p1={{
          x: center - 150 * scale,
          y: center - 80 * scale,
        }}
        p2={{
          x: center - 92 * scale,
          y: center - 80 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Line
        p1={{
          x: center - 92 * scale,
          y: center - 80 * scale,
        }}
        p2={{
          x: center - 72 * scale,
          y: center - 52 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Circle
        cx={center - 72 * scale}
        cy={center - 52 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Glow — haut droite */}
      <Line
        p1={{
          x: center + 150 * scale,
          y: center - 80 * scale,
        }}
        p2={{
          x: center + 92 * scale,
          y: center - 80 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Line
        p1={{
          x: center + 92 * scale,
          y: center - 80 * scale,
        }}
        p2={{
          x: center + 72 * scale,
          y: center - 52 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Circle
        cx={center + 72 * scale}
        cy={center - 52 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Texture — bas gauche */}
      <Line
        p1={{
          x: center - 150 * scale,
          y: center + 82 * scale,
        }}
        p2={{
          x: center - 92 * scale,
          y: center + 82 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Line
        p1={{
          x: center - 92 * scale,
          y: center + 82 * scale,
        }}
        p2={{
          x: center - 72 * scale,
          y: center + 54 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Circle
        cx={center - 72 * scale}
        cy={center + 54 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />

      {/* Rougeurs — bas droite */}
      <Line
        p1={{
          x: center + 150 * scale,
          y: center + 82 * scale,
        }}
        p2={{
          x: center + 92 * scale,
          y: center + 82 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Line
        p1={{
          x: center + 92 * scale,
          y: center + 82 * scale,
        }}
        p2={{
          x: center + 72 * scale,
          y: center + 54 * scale,
        }}
        color={lineColor}
        strokeWidth={1 * scale}
      />

      <Circle
        cx={center + 72 * scale}
        cy={center + 54 * scale}
        r={pointRadius}
        opacity={pointOpacity}
        color={pointColor}
      />
    </Group>
  );
}