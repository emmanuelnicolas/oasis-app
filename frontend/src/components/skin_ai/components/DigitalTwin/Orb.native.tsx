import React from "react";
import OrbSkia from "./OrbSkia";
import type { OrbVisualState } from "./OrbVisualState";

type Props = {
  confidence: number;
  visualState: OrbVisualState;
};

export function Orb({
  confidence,
  visualState,
}: Props) {
  return (
    <OrbSkia
      confidence={confidence}
      visualState={visualState}
    />
  );
}