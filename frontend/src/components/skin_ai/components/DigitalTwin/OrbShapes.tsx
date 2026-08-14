import React from "react";
import {
  Group,
  Path,
} from "@shopify/react-native-skia";

type Props = {
  center: number;
  scale: number;
  variant: 1 | 2 | 3;
};

function createMembranePath(
  center: number,
  scale: number,
  variant: 1 | 2 | 3
) {
  const s = scale;

  if (variant === 1) {
    return `
      M ${center - 42 * s} ${center - 138 * s}
      C ${center + 28 * s} ${center - 156 * s},
        ${center + 132 * s} ${center - 104 * s},
        ${center + 116 * s} ${center - 20 * s}
      C ${center + 152 * s} ${center + 48 * s},
        ${center + 76 * s} ${center + 136 * s},
        ${center + 2 * s} ${center + 118 * s}
      C ${center - 70 * s} ${center + 148 * s},
        ${center - 142 * s} ${center + 66 * s},
        ${center - 112 * s} ${center - 8 * s}
      C ${center - 138 * s} ${center - 76 * s},
        ${center - 92 * s} ${center - 122 * s},
        ${center - 42 * s} ${center - 138 * s}
      Z
    `;
  }

  if (variant === 2) {
    return `
      M ${center + 38 * s} ${center - 116 * s}
      C ${center + 104 * s} ${center - 92 * s},
        ${center + 126 * s} ${center - 18 * s},
        ${center + 88 * s} ${center + 42 * s}
      C ${center + 62 * s} ${center + 104 * s},
        ${center - 18 * s} ${center + 122 * s},
        ${center - 62 * s} ${center + 72 * s}
      C ${center - 118 * s} ${center + 36 * s},
        ${center - 110 * s} ${center - 32 * s},
        ${center - 66 * s} ${center - 72 * s}
      C ${center - 22 * s} ${center - 118 * s},
        ${center + 8 * s} ${center - 132 * s},
        ${center + 38 * s} ${center - 116 * s}
      Z
    `;
  }

  return `
    M ${center - 54 * s} ${center - 76 * s}
    C ${center - 10 * s} ${center - 108 * s},
      ${center + 78 * s} ${center - 88 * s},
      ${center + 92 * s} ${center - 18 * s}
    C ${center + 106 * s} ${center + 44 * s},
      ${center + 34 * s} ${center + 94 * s},
      ${center - 22 * s} ${center + 76 * s}
    C ${center - 74 * s} ${center + 64 * s},
      ${center - 98 * s} ${center + 10 * s},
      ${center - 72 * s} ${center - 36 * s}
    C ${center - 64 * s} ${center - 52 * s},
      ${center - 62 * s} ${center - 66 * s},
      ${center - 54 * s} ${center - 76 * s}
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
      fill: "#EFE4DC",
      stroke: "#AD9B8E",
      fillOpacity: 0.18,
      strokeOpacity: 0.34,
      strokeWidth: 1.1,
    },
    2: {
      fill: "#DDD0C7",
      stroke: "#98867A",
      fillOpacity: 0.17,
      strokeOpacity: 0.3,
      strokeWidth: 0.95,
    },
    3: {
      fill: "#CFC0B6",
      stroke: "#88766A",
      fillOpacity: 0.16,
      strokeOpacity: 0.28,
      strokeWidth: 0.8,
    },
  }[variant];

  const path = createMembranePath(
    center,
    scale,
    variant
  );

  return (
    <Group>
      <Path
        path={path}
        color={config.fill}
        opacity={config.fillOpacity}
      />

      <Path
        path={path}
        style="stroke"
        strokeWidth={
          config.strokeWidth * scale
        }
        strokeCap="round"
        strokeJoin="round"
        color={config.stroke}
        opacity={config.strokeOpacity}
      />
    </Group>
  );
}