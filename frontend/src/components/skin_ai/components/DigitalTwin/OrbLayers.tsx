import React from "react";
import type { OrbVisualState } from "./OrbVisualState";
import {
  BlurMask,
  Circle,
  Group,
  Line,
  Oval,
  rect,
  vec,
} from "@shopify/react-native-skia";

type Props = {
  center: number;
  scale: number;
  visualState: OrbVisualState;
};

export function OrbLayers({
  center,
  scale,
  visualState,
}: Props) {
  return (
    <>
      {/* Noyau principal clair et légèrement décentré */}
      <Oval
        rect={rect(
          center - 70 * scale,
          center - 58 * scale,
          140 * scale,
          116 * scale
        )}
        color={visualState.coreColor}
        opacity={visualState.coreOpacity}
      >
        <BlurMask
          blur={16 * scale}
          style="normal"
        />
      </Oval>

      {/* Lumière interne */}
      <Oval
        rect={rect(
          center - 44 * scale,
          center - 38 * scale,
          92 * scale,
          76 * scale
        )}
        color={visualState.innerLightColor}
        opacity={0.46}
      >
        <BlurMask
          blur={18 * scale}
          style="normal"
        />
      </Oval>

      {/* Halo décentré supérieur */}
      <Circle
        cx={center + 22 * scale}
        cy={center - 28 * scale}
        r={34 * scale}
        color={visualState.innerLightColor}
        opacity={0.24}
      >
        <BlurMask
          blur={20 * scale}
          style="normal"
        />
      </Circle>

      {/* Halo secondaire bas-gauche */}
      <Circle
        cx={center - 34 * scale}
        cy={center + 30 * scale}
        r={26 * scale}
        color={visualState.glowColor}
        opacity={0.16}
      >
        <BlurMask
          blur={16 * scale}
          style="normal"
        />
      </Circle>

      {/* Centre lumineux */}
      <Circle
        cx={center - 8 * scale}
        cy={center + 2 * scale}
        r={13 * scale}
        color={visualState.sparkColor}
        opacity={0.72}
      >
        <BlurMask
          blur={10 * scale}
          style="normal"
        />
      </Circle>

      {/* Filaments internes */}
      <Group opacity={visualState.outlineOpacity}>
        <Line
          p1={vec(
            center - 52 * scale,
            center - 14 * scale
          )}
          p2={vec(
            center + 42 * scale,
            center + 28 * scale
          )}
          color={visualState.outlineColor}
          strokeWidth={0.8 * scale}
        />

        <Line
          p1={vec(
            center - 38 * scale,
            center + 34 * scale
          )}
          p2={vec(
            center + 46 * scale,
            center - 20 * scale
          )}
          color={visualState.outlineColor}
          strokeWidth={0.7 * scale}
        />

        <Line
          p1={vec(
            center - 18 * scale,
            center - 48 * scale
          )}
          p2={vec(
            center + 20 * scale,
            center + 46 * scale
          )}
          color={visualState.outlineColor}
          strokeWidth={0.65 * scale}
        />
      </Group>

      {/* Particules discrètes */}
      <Group opacity={visualState.sparkOpacity}>
        <Circle
          cx={center - 44 * scale}
          cy={center - 30 * scale}
          r={2.1 * scale}
          color={visualState.sparkColor}
        />

        <Circle
          cx={center + 38 * scale}
          cy={center - 18 * scale}
          r={1.7 * scale}
          color={visualState.sparkColor}
        />

        <Circle
          cx={center + 28 * scale}
          cy={center + 34 * scale}
          r={2.3 * scale}
          color={visualState.sparkColor}
        />

        <Circle
          cx={center - 30 * scale}
          cy={center + 26 * scale}
          r={1.5 * scale}
          color={visualState.sparkColor}
        />
      </Group>
    </>
  );
}