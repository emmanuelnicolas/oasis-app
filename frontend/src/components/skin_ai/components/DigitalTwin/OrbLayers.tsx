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

export function OrbLayers({
  center,
  scale,
  visualState,
}: Props) {
  return (
    <>
      {/* Noyau central */}
      <Circle
        cx={center}
        cy={center}
        r={76 * scale}
        color={visualState.coreColor}
        opacity={visualState.coreOpacity}
      >
        <BlurMask
          blur={8 * scale}
          style="normal"
        />
      </Circle>

      {/* Lumière interne */}
      <Circle
        cx={center - 20 * scale}
        cy={center - 20 * scale}
        r={48 * scale}
        color={visualState.innerLightColor}
        opacity={0.34}
      >
        <BlurMask
          blur={14 * scale}
          style="normal"
        />
      </Circle>

      {/* Reflet supérieur */}
      <Circle
        cx={center + 58 * scale}
        cy={center - 62 * scale}
        r={42 * scale}
        color="#F5ECE6"
        opacity={0.3}
      >
        <BlurMask
          blur={12 * scale}
          style="normal"
        />
      </Circle>

      {/* Reflet inférieur */}
      <Circle
        cx={center - 62 * scale}
        cy={center + 54 * scale}
        r={34 * scale}
        color="#EADDD4"
        opacity={0.18}
      >
        <BlurMask
          blur={10 * scale}
          style="normal"
        />
      </Circle>
    </>
  );
}