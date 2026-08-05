export type OrbVisualState = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
  confidence: number;

  hydrationLevel: "low" | "medium" | "good";
  rednessLevel: "calm" | "moderate" | "high";
  confidenceLevel: "discovery" | "learning" | "mature";

  coreColor: string;
  innerLightColor: string;
  glowColor: string;

  glowOpacity: number;
  coreOpacity: number;
};

type Params = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
  confidence: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function buildOrbVisualState({
  hydration,
  glow,
  texture,
  redness,
  confidence,
}: Params): OrbVisualState {
  const safeHydration = clamp(hydration);
  const safeGlow = clamp(glow);
  const safeTexture = clamp(texture);
  const safeRedness = clamp(redness);
  const safeConfidence = clamp(confidence);

  const hydrationLevel =
    safeHydration < 40
      ? "low"
      : safeHydration < 70
        ? "medium"
        : "good";

  const rednessLevel =
    safeRedness >= 60
      ? "high"
      : safeRedness >= 30
        ? "moderate"
        : "calm";

  const confidenceLevel =
    safeConfidence < 20
      ? "discovery"
      : safeConfidence < 65
        ? "learning"
        : "mature";

  let coreColor = "#3E302B";
  let innerLightColor = "#6C554C";
  let glowColor = "#D6C5B8";

  if (hydrationLevel === "low") {
    coreColor = "#403A3C";
    innerLightColor = "#756C70";
    glowColor = "#D8D1D2";
  }

  if (hydrationLevel === "good") {
    coreColor = "#2F3934";
    innerLightColor = "#65766C";
    glowColor = "#C9D8CF";
  }

  if (rednessLevel === "moderate") {
    glowColor = "#DFC9C1";
  }

  if (rednessLevel === "high") {
    coreColor = "#493431";
    innerLightColor = "#835D56";
    glowColor = "#E2BDB4";
  }

  const glowOpacity =
    0.08 + safeGlow / 1000 + safeConfidence / 2000;

  const coreOpacity =
    0.72 + safeConfidence / 560;

  return {
    hydration: safeHydration,
    glow: safeGlow,
    texture: safeTexture,
    redness: safeRedness,
    confidence: safeConfidence,

    hydrationLevel,
    rednessLevel,
    confidenceLevel,

    coreColor,
    innerLightColor,
    glowColor,

    glowOpacity: Math.min(0.22, glowOpacity),
    coreOpacity: Math.min(0.92, coreOpacity),
  };
}