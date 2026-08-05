import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 68,
        },

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor:
          colors.textDisabled,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="scan-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: "OASIS AI",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="sparkles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="routines"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}