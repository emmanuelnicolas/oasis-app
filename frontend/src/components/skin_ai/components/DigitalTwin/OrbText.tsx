 import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  confidence: number;
};

export function OrbText({ confidence }: Props) {
  const safeConfidence = Math.max(
    0,
    Math.min(100, Math.round(confidence))
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      <Text style={styles.label}>SCORE GLOBAL</Text>

      <View style={styles.scoreRow}>
        <Text style={styles.score}>{safeConfidence}</Text>
        <Text style={styles.percent}>%</Text>
      </View>

      <Text style={styles.caption}>DIGITAL TWIN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: "#F5EEE9",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  score: {
    color: "#FFFFFF",
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "600",
  },

  percent: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 34,
    marginLeft: 2,
  },

  caption: {
    color: "#E7DDD6",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 3,
  },
});