import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../../theme";
import type { SkinUser } from "../../auth";

type Props = {
  greeting: string;
  user: SkinUser | null;
};

export function HomeHeader({ greeting, user }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.hello}>{greeting},</Text>
        <Text style={styles.name}>{user?.name || ""}</Text>
      </View>

      {user?.picture ? (
        <Image source={{ uri: user.picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>
            {(user?.name || "S").charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  hello: {
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  name: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontWeight: "400",
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: fonts.heading,
  },
});