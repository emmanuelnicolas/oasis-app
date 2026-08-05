import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas } from "@shopify/react-native-skia";
import Animated from "react-native-reanimated";

import { useResponsive } from "../../../../hooks/useResponsive";
import { OrbLayers } from "./OrbLayers";
import { OrbGlow } from "./OrbGlow";
import { OrbShapes } from "./OrbShapes";
import { OrbText } from "./OrbText";
import { OrbConnections } from "./OrbConnections";
import { useOrbAnimation } from "./OrbAnimation";
import { useOrbMotion } from "./OrbMotion";
import { useOrbGlowAnimation } from "./OrbGlowAnimation";
import type { OrbVisualState } from "./OrbVisualState";

type Props = {
  confidence: number;
  visualState: OrbVisualState;
};

export default function OrbSkia({
  confidence,
  visualState,
}: Props) {
  const { orbSize } = useResponsive();

  const ORB_SIZE = orbSize;
  const CENTER = ORB_SIZE / 2;
  const scale = ORB_SIZE / 380;

  const {
  animatedStyle,
  morphStyle,
} = useOrbAnimation(visualState);

const {
  rotatingStyle,
  middleMotionStyle,
  innerMotionStyle,
} = useOrbMotion();

const {
  glowStyle,
} = useOrbGlowAnimation(visualState);

  const safeConfidence = Math.max(
    0,
    Math.min(100, Math.round(confidence))
  );

  return (
    <View
      style={[
        styles.container,
        {
          width: ORB_SIZE,
          height: ORB_SIZE,
        },
      ]}
    >
      {/* Halo indépendant */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowLayer,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
          },
          glowStyle,
        ]}
      >
        <Canvas
          style={[
            styles.canvas,
            {
              width: ORB_SIZE,
              height: ORB_SIZE,
            },
          ]}
        >
          <OrbGlow
  center={CENTER}
  scale={scale}
  visualState={visualState}
/>
        </Canvas>
      </Animated.View>

      {/* Respiration générale */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.graphicsLayer,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
          },
          animatedStyle,
        ]}
      >
        {/* Connecteurs */}
        <Canvas
          style={[
            styles.canvas,
            {
              width: ORB_SIZE,
              height: ORB_SIZE,
            },
          ]}
        >
          <OrbConnections center={CENTER} scale={scale} />
        </Canvas>

        {/* Membrane externe */}
<Animated.View
  style={[
    styles.rotatingLayer,
    {
      width: ORB_SIZE,
      height: ORB_SIZE,
    },
    rotatingStyle,
  ]}
>
  <Animated.View
    style={[
      styles.morphLayer,
      {
        width: ORB_SIZE,
        height: ORB_SIZE,
      },
      morphStyle,
    ]}
  >
    <Canvas
      style={[
        styles.canvas,
        {
          width: ORB_SIZE,
          height: ORB_SIZE,
        },
      ]}
    >
      <OrbShapes
        center={CENTER}
        scale={scale}
        variant={1}
      />
    </Canvas>
  </Animated.View>
</Animated.View>

{/* Membrane intermédiaire */}
<Animated.View
  style={[
    styles.middleLayer,
    {
      width: ORB_SIZE,
      height: ORB_SIZE,
    },
    middleMotionStyle,
  ]}
>
  <Canvas
    style={[
      styles.canvas,
      {
        width: ORB_SIZE,
        height: ORB_SIZE,
      },
    ]}
  >
    <OrbShapes
      center={CENTER}
      scale={scale}
      variant={2}
    />
  </Canvas>
</Animated.View>

{/* Membrane interne */}
<Animated.View
  style={[
    styles.innerLayer,
    {
      width: ORB_SIZE,
      height: ORB_SIZE,
    },
    innerMotionStyle,
  ]}
>
  <Canvas
    style={[
      styles.canvas,
      {
        width: ORB_SIZE,
        height: ORB_SIZE,
      },
    ]}
  >
    <OrbShapes
      center={CENTER}
      scale={scale}
      variant={3}
    />
  </Canvas>
</Animated.View>

{/* Noyau fixe */}
<Canvas
  style={[
    styles.canvas,
    {
      width: ORB_SIZE,
      height: ORB_SIZE,
    },
  ]}
>
  <OrbLayers
  center={CENTER}
  scale={scale}
  visualState={visualState}
/>
</Canvas>
</Animated.View>

      <OrbText confidence={safeConfidence} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  graphicsLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  glowLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  rotatingLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  canvas: {
    position: "absolute",
  },
  morphLayer: {
   position: "absolute",
   alignItems: "center",
   justifyContent: "center",
},

  middleLayer: {
   position: "absolute",
   alignItems: "center",
   justifyContent: "center",
},

  innerLayer: {
   position: "absolute",
   alignItems: "center",
   justifyContent: "center",
},
});