export type OrbVisualState = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
  confidence: number;

  hydrationLevel: "low" | "medium" | "good";
  rednessLevel: "calm" | "moderate" | "high";
  confidenceLevel:
    | "discovery"
    | "learning"
    | "mature";

  coreColor: string;
  innerLightColor: string;
  glowColor: string;
  membraneColor: string;
  membraneAccentColor: string;
  outlineColor: string;
  sparkColor: string;

  glowOpacity: number;
  coreOpacity: number;
  membraneOpacity: number;
  outlineOpacity: number;
  sparkOpacity: number;
};

type Params = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
  confidence: number;
};

function clamp(value: number) {
  return Math.max(
    0,
    Math.min(100, value)
  );
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

  let coreColor = "#B7A89F";
  let innerLightColor = "#FFF8F2";
  let glowColor = "#E7DDD4";
  let membraneColor = "#F5ECE5";
  let membraneAccentColor = "#D9C7BA";
  let outlineColor = "#A99689";
  let sparkColor = "#FFFDF9";

  if (hydrationLevel === "low") {
    coreColor = "#AAA7A5";
    innerLightColor = "#F8F4F1";
    glowColor = "#E2DEDC";
    membraneColor = "#EEEAE8";
    membraneAccentColor = "#CBC3BF";
    outlineColor = "#918B87";
  }

  if (hydrationLevel === "good") {
    coreColor = "#A8B4AC";
    innerLightColor = "#F8FCF9";
    glowColor = "#DCE7E0";
    membraneColor = "#EDF5F0";
    membraneAccentColor = "#C5D4CA";
    outlineColor = "#8D9D92";
  }

  if (rednessLevel === "moderate") {
    glowColor = "#E8D8D2";
    membraneAccentColor = "#D7BEB5";
  }

  if (rednessLevel === "high") {
    coreColor = "#B6A09C";
    innerLightColor = "#FFF7F5";
    glowColor = "#ECD3CD";
    membraneColor = "#F4E4E0";
    membraneAccentColor = "#D8B3AA";
    outlineColor = "#A9857D";
  }

  const glowOpacity =
    0.14 +
    safeGlow / 1400 +
    safeConfidence / 2200;

  const coreOpacity =
    0.26 +
    safeConfidence / 700;

  const membraneOpacity =
    0.18 +
    safeTexture / 1300 +
    safeConfidence / 1700;

  const outlineOpacity =
    0.26 +
    safeConfidence / 900;

  const sparkOpacity =
    0.24 +
    safeGlow / 600;

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
    membraneColor,
    membraneAccentColor,
    outlineColor,
    sparkColor,

    glowOpacity: Math.min(
      0.26,
      glowOpacity
    ),

    coreOpacity: Math.min(
      0.42,
      coreOpacity
    ),

    membraneOpacity: Math.min(
      0.32,
      membraneOpacity
    ),

    outlineOpacity: Math.min(
      0.38,
      outlineOpacity
    ),

    sparkOpacity: Math.min(
      0.42,
      sparkOpacity
    ),
  };
}