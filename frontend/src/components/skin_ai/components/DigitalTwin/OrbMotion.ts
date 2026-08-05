import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function useOrbMotion() {
  const outerRotation = useSharedValue(0);
  const middleRotation = useSharedValue(-12);
  const innerRotation = useSharedValue(8);

  const middleScale = useSharedValue(0.99);
  const innerScale = useSharedValue(1.01);

  useEffect(() => {
    // Membrane externe : rotation lente vers la droite
    outerRotation.value = withRepeat(
      withTiming(360, {
        duration: 90000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Membrane intermédiaire : rotation inverse
    middleRotation.value = withRepeat(
      withTiming(-372, {
        duration: 70000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Membrane interne : rotation lente et différente
    innerRotation.value = withRepeat(
      withTiming(368, {
        duration: 52000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    middleScale.value = withRepeat(
      withTiming(1.015, {
        duration: 5600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    innerScale.value = withRepeat(
      withTiming(0.985, {
        duration: 4300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [
    outerRotation,
    middleRotation,
    innerRotation,
    middleScale,
    innerScale,
  ]);

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${outerRotation.value}deg`,
      },
    ],
  }));

  const middleMotionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${middleRotation.value}deg`,
      },
      {
        scale: middleScale.value,
      },
    ],
  }));

  const innerMotionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${innerRotation.value}deg`,
      },
      {
        scale: innerScale.value,
      },
    ],
  }));

  return {
    rotatingStyle,
    middleMotionStyle,
    innerMotionStyle,
  };
}