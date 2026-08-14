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
      {/* Halo externe très léger */}
      <Circle
        cx={center}
        cy={center}
        r={146 * scale}
        color={visualState.glowColor}
        opacity={
          visualState.glowOpacity * 0.36
        }
      >
        <BlurMask
          blur={46 * scale}
          style="normal"
        />
      </Circle>

      {/* Halo supérieur décalé */}
      <Circle
        cx={center + 34 * scale}
        cy={center - 38 * scale}
        r={74 * scale}
        color={visualState.innerLightColor}
        opacity={
          visualState.glowOpacity * 0.62
        }
      >
        <BlurMask
          blur={32 * scale}
          style="normal"
        />
      </Circle>

      {/* Halo bas-gauche */}
      <Circle
        cx={center - 48 * scale}
        cy={center + 42 * scale}
        r={64 * scale}
        color={
          visualState.membraneAccentColor
        }
        opacity={
          visualState.glowOpacity * 0.42
        }
      >
        <BlurMask
          blur={28 * scale}
          style="normal"
        />
      </Circle>

      {/* Lumière centrale */}
      <Circle
        cx={center - 4 * scale}
        cy={center}
        r={42 * scale}
        color={visualState.sparkColor}
        opacity={
          visualState.glowOpacity * 0.78
        }
      >
        <BlurMask
          blur={22 * scale}
          style="normal"
        />
      </Circle>
    </>
  );
}