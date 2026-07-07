import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "../../theme";

type Props = {
  topPadding: number;
  onAddPress: () => void;
};

export function JournalHeader({ topPadding, onAddPress }: Props) {
  return (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <Text style={styles.title}>Journal</Text>

      <TouchableOpacity
        testID="add-entry-btn"
        style={styles.addBtn}
        onPress={onAddPress}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontWeight: "400",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});s