import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { OrbVisualState } from "./OrbVisualState";

export function useOrbGlowAnimation(
  visualState: OrbVisualState
) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.75);

  useEffect(() => {
    const glowRatio =
      visualState.glow / 100;

    const confidenceRatio =
      visualState.confidence / 100;

    const targetScale =
      1.015 + glowRatio * 0.035;

    const targetOpacity =
      0.72 +
      glowRatio * 0.18 +
      confidenceRatio * 0.08;

    const duration =
      Math.round(5000 - glowRatio * 1600);

    glowScale.value = withRepeat(
      withTiming(targetScale, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withTiming(
        Math.min(1, targetOpacity),
        {
          duration,
          easing: Easing.inOut(Easing.ease),
        }
      ),
      -1,
      true
    );
  }, [
    visualState.glow,
    visualState.confidence,
    glowOpacity,
    glowScale,
  ]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: glowScale.value,
      },
    ],
  }));

  return {
    glowStyle,
  };
}