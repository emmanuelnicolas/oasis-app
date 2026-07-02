import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth";
import { initializeNotifications } from "../src/services/notificationService";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#F7F5F0" },
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}