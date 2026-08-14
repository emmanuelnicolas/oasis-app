import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  confidence: number;
};

export function OrbText({
  confidence,
}: Props) {
  const safeConfidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(confidence)
    )
  );

  return (
    <View
      pointerEvents="none"
      style={styles.container}
    >
      <Text style={styles.label}>
        SCORE GLOBAL
      </Text>

      <View style={styles.scoreRow}>
        <Text style={styles.score}>
          {safeConfidence}
        </Text>

        <Text style={styles.percent}>
          %
        </Text>
      </View>

      <Text style={styles.caption}>
        DIGITAL TWIN
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 116,
    minHeight: 116,
    borderRadius: 58,
    backgroundColor:
      "rgba(248, 242, 237, 0.40)",
  },

  label: {
    color: "#665B54",
    fontSize: 9,
    letterSpacing: 1.25,
    marginBottom: 2,
    fontWeight: "500",
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  score: {
    color: "#24372E",
    fontSize: 50,
    lineHeight: 54,
    fontWeight: "500",
  },

  percent: {
    color: "#24372E",
    fontSize: 18,
    lineHeight: 30,
    marginLeft: 2,
    fontWeight: "500",
  },

  caption: {
    color: "#877970",
    fontSize: 8,
    letterSpacing: 1.4,
    marginTop: 1,
  },
});