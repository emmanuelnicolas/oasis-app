import React from "react";
import type { OrbVisualState } from "./OrbVisualState";
import {
  BlurMask,
  Circle,
} from "@shopify/react-native-skia";

type Props = {
  center: number;
  scale: number;
  visualState: OrbVisualState;
};

export function OrbGlow({
  center,
  scale,
  visualState,
}: Props) {
  return (
    <>
      <Circle
  cx={center}
  cy={center}
  r={160 * scale}
  color={visualState.glowColor}
  opacity={visualState.glowOpacity * 0.8}
>
        <BlurMask
          blur={55 * scale}
          style="normal"
        />
      </Circle>

      <Circle
  cx={center}
  cy={center}
  r={128 * scale}
  color={visualState.glowColor}
  opacity={visualState.glowOpacity}
>
        <BlurMask
          blur={30 * scale}
          style="normal"
        />
      </Circle>
    </>
  );
}