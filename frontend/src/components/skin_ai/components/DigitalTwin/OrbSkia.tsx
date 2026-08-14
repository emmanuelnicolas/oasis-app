import React from "react";
import {
  Image,
  StyleSheet,
  View,
} from "react-native";
import {
  Canvas,
} from "@shopify/react-native-skia";
import Animated from "react-native-reanimated";

import { useResponsive } from "../../../../hooks/useResponsive";
import { OrbText } from "./OrbText";
import { OrbConnections } from "./OrbConnections";
import { useOrbAnimation } from "./OrbAnimation";
import type { OrbVisualState } from "./OrbVisualState";

type Props = {
  confidence: number;
  visualState: OrbVisualState;
};

const DIGITAL_TWIN_IMAGE = require(
  "../../../../../assets/images/oasis_digital_twin_transparent.png"
);

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

  const safeConfidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(confidence)
    )
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
      {/* Halo vivant derrière le Digital Twin */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.haloLayer,
          {
            width: ORB_SIZE * 0.7,
            height: ORB_SIZE * 0.7,
            borderRadius: ORB_SIZE * 0.35,
          },
          animatedStyle,
        ]}
      />

      {/* Membrane / reflet organique animé */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.morphLayer,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
          },
          morphStyle,
        ]}
      >
        <Image
          source={DIGITAL_TWIN_IMAGE}
          resizeMode="contain"
          blurRadius={11}
          style={{
            width: ORB_SIZE * 1.1,
            height: ORB_SIZE * 1.1,
            opacity: 0.16,
          }}
        />
      </Animated.View>

      {/* Digital Twin principal */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.imageLayer,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={DIGITAL_TWIN_IMAGE}
          resizeMode="contain"
          style={{
            width: ORB_SIZE * 1.08,
            height: ORB_SIZE * 1.08,
            opacity: 0.96,
          }}
        />
      </Animated.View>

      {/* Réseau / connecteurs dynamiques */}
      <Canvas
        pointerEvents="none"
        style={[
          styles.canvas,
          {
            width: ORB_SIZE,
            height: ORB_SIZE,
          },
        ]}
      >
        <OrbConnections
          center={CENTER}
          scale={scale}
        />
      </Canvas>

      {/* Score */}
      <OrbText
        confidence={safeConfidence}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  haloLayer: {
    position: "absolute",
    backgroundColor:
      "rgba(200, 181, 168, 0.13)",
    shadowColor: "#BBA89C",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },

  morphLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.85,
    transform: [
      {
        translateY: 4,
      },
    ],
  },

  imageLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        translateY: 4,
      },
    ],
  },

  canvas: {
    position: "absolute",
  },
});