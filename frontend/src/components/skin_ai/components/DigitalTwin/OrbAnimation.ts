import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import type { OrbVisualState } from "./OrbVisualState";

export function useOrbAnimation(
  visualState: OrbVisualState
) {
  const breathingScale = useSharedValue(1);

  const morphScaleX = useSharedValue(1);
  const morphScaleY = useSharedValue(1);

  const morphTranslateX = useSharedValue(0);
  const morphTranslateY = useSharedValue(0);

  useEffect(() => {
    const confidenceRatio =
      visualState.confidence / 100;

    const rednessRatio =
      visualState.redness / 100;

    const breathingAmplitude =
		1.035 + confidenceRatio * 0.015;

	const breathingDuration =
		Math.round(3200 - confidenceRatio * 700);

    const morphIntensity =
		0.028 + rednessRatio * 0.03;

	const translationIntensity =
		3 + rednessRatio * 2.5;

    breathingScale.value = withRepeat(
      withTiming(breathingAmplitude, {
        duration: breathingDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    morphScaleX.value = withRepeat(
      withTiming(1 + morphIntensity, {
        duration: 6200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    morphScaleY.value = withRepeat(
      withTiming(1 - morphIntensity * 0.7, {
        duration: 7300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    morphTranslateX.value = withRepeat(
      withTiming(translationIntensity, {
        duration: 6800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    morphTranslateY.value = withRepeat(
      withTiming(-translationIntensity * 0.7, {
        duration: 7600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [
    visualState.confidence,
    visualState.redness,
    breathingScale,
    morphScaleX,
    morphScaleY,
    morphTranslateX,
    morphTranslateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: breathingScale.value,
      },
    ],
  }));

  const morphStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: morphTranslateX.value,
      },
      {
        translateY: morphTranslateY.value,
      },
      {
        scaleX: morphScaleX.value,
      },
      {
        scaleY: morphScaleY.value,
      },
    ],
  }));

  return {
    animatedStyle,
    morphStyle,
  };
}