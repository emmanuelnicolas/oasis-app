import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useHome } from "../../src/hooks/useHome";
import { HeroCard } from "../../src/components/home/HeroCard";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { StatsCard } from "../../src/components/home/StatsCard";
import { TipCard } from "../../src/components/home/TipCard";
import { ScanCard } from "../../src/components/home/ScanCard";
import { RoutineCard } from "../../src/components/home/RoutineCard";
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { colors, spacing } from "../../src/theme";


export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();


  const {
  tracking,
  tip,
  stats,
  loading,
  refreshing,
  greeting,
  focusType,
  focusRoutine,
  completedCount,
  totalSteps,
  startRefreshing,
  toggleStep,
} = useHome(token);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
  style={{ backgroundColor: colors.bg }}
  contentContainerStyle={[
    styles.scroll,
    {
      paddingTop: insets.top + spacing.md,
      paddingBottom: spacing.xxl,
    },
  ]}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={startRefreshing}
      tintColor={colors.primary}
    />
  }
>
   <HomeHeader
  greeting={greeting}
  user={user}
/>
	  <HeroCard />

    <StatsCard stats={stats} />
	
      <TipCard tip={tip} />

     <ScanCard
  onPress={() =>
    router.push({
      pathname: "/(tabs)/products",
      params: { open: "1" },
    })
  }
/>

      <RoutineCard
  focusRoutine={focusRoutine}
  focusType={focusType}
  tracking={tracking}
  completedCount={completedCount}
  totalSteps={totalSteps}
  onToggleStep={toggleStep}
/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg },
  
});
