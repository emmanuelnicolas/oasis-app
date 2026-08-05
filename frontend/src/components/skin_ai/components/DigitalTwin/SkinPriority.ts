export type SkinPriorityKey =
  | "hydration"
  | "glow"
  | "texture"
  | "redness";

export type SkinPriority = {
  key: SkinPriorityKey;
  label: string;
  value: number;
  target: number;
  progress: number;
  message: string;
};

type Metrics = {
  hydration: number;
  glow: number;
  texture: number;
  redness: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function getSkinPriority({
  hydration,
  glow,
  texture,
  redness,
}: Metrics): SkinPriority {
  const safeHydration = clamp(hydration);
  const safeGlow = clamp(glow);
  const safeTexture = clamp(texture);
  const safeRedness = clamp(redness);

  const priorities = [
    {
      key: "hydration" as const,
      label: "Hydratation",
      value: safeHydration,
      target: 80,
      urgency: Math.max(0, 80 - safeHydration),
      message:
        "Renforcer progressivement l’hydratation et le confort de la peau.",
    },
    {
      key: "glow" as const,
      label: "Éclat",
      value: safeGlow,
      target: 75,
      urgency: Math.max(0, 75 - safeGlow),
      message:
        "Améliorer l’éclat avec une routine régulière et bien tolérée.",
    },
    {
      key: "texture" as const,
      label: "Texture",
      value: safeTexture,
      target: 80,
      urgency: Math.max(0, 80 - safeTexture),
      message:
        "Favoriser une texture plus régulière sans surcharger la peau.",
    },
    {
      key: "redness" as const,
      label: "Rougeurs",
      value: safeRedness,
      target: 20,
      urgency: Math.max(0, safeRedness - 20) * 1.4,
      message:
        "Apaiser la peau et limiter les facteurs pouvant accentuer les rougeurs.",
    },
  ];

  const selected = priorities.reduce((highest, current) =>
    current.urgency > highest.urgency ? current : highest
  );

  const progress =
    selected.key === "redness"
      ? clamp(100 - selected.value)
      : clamp((selected.value / selected.target) * 100);

  return {
    key: selected.key,
    label: selected.label,
    value: selected.value,
    target: selected.target,
    progress: Math.round(progress),
    message: selected.message,
  };
}