import React from "react";
import {
  BlurMask,
  Path,
} from "@shopify/react-native-skia";

type Props = {
  center: number;
  scale: number;
  variant: 1 | 2 | 3;
};

function createBlobPath(
  center: number,
  scale: number,
  variant: 1 | 2 | 3
) {
  const s = scale;

  if (variant === 1) {
    return `
      M ${center} ${center - 132 * s}
      C ${center + 78 * s} ${center - 142 * s},
        ${center + 142 * s} ${center - 74 * s},
        ${center + 126 * s} ${center}
      C ${center + 142 * s} ${center + 76 * s},
        ${center + 70 * s} ${center + 142 * s},
        ${center} ${center + 128 * s}
      C ${center - 76 * s} ${center + 142 * s},
        ${center - 144 * s} ${center + 72 * s},
        ${center - 126 * s} ${center}
      C ${center - 140 * s} ${center - 74 * s},
        ${center - 74 * s} ${center - 136 * s},
        ${center} ${center - 132 * s}
      Z
    `;
  }

  if (variant === 2) {
    return `
      M ${center - 12 * s} ${center - 108 * s}
      C ${center + 62 * s} ${center - 126 * s},
        ${center + 116 * s} ${center - 48 * s},
        ${center + 104 * s} ${center + 12 * s}
      C ${center + 92 * s} ${center + 84 * s},
        ${center + 30 * s} ${center + 118 * s},
        ${center - 30 * s} ${center + 104 * s}
      C ${center - 96 * s} ${center + 92 * s},
        ${center - 118 * s} ${center + 26 * s},
        ${center - 102 * s} ${center - 34 * s}
      C ${center - 82 * s} ${center - 92 * s},
        ${center - 44 * s} ${center - 104 * s},
        ${center - 12 * s} ${center - 108 * s}
      Z
    `;
  }

  return `
    M ${center + 4 * s} ${center - 82 * s}
    C ${center + 54 * s} ${center - 88 * s},
      ${center + 86 * s} ${center - 42 * s},
      ${center + 78 * s} ${center + 8 * s}
    C ${center + 72 * s} ${center + 58 * s},
      ${center + 22 * s} ${center + 82 * s},
      ${center - 26 * s} ${center + 74 * s}
    C ${center - 72 * s} ${center + 64 * s},
      ${center - 88 * s} ${center + 18 * s},
      ${center - 76 * s} ${center - 30 * s}
    C ${center - 62 * s} ${center - 68 * s},
      ${center - 28 * s} ${center - 78 * s},
      ${center + 4 * s} ${center - 82 * s}
    Z
  `;
}

export function OrbShapes({
  center,
  scale,
  variant,
}: Props) {
  const config = {
    1: {
      color: "#D6C4B7",
      opacity: 0.28,
      blur: 18,
    },
    2: {
      color: "#BDA596",
      opacity: 0.32,
      blur: 10,
    },
    3: {
      color: "#8E7366",
      opacity: 0.42,
      blur: 6,
    },
  }[variant];

  return (
    <Path
      path={createBlobPath(center, scale, variant)}
      color={config.color}
      opacity={config.opacity}
    >
      <BlurMask
        blur={config.blur * scale}
        style="normal"
      />
    </Path>
  );
}