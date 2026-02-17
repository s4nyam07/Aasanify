import React, { useEffect, useState } from "react";
import { Stack , Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useNetwork } from "@/lib/network-context";
import { OfflineScreen } from "@/components/OfflineScreen";
import { isOnboardingComplete } from "@/lib/onboarding-storage";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    isOnboardingComplete().then((done) => {
      setOnboardingDone(done);
      setCheckingOnboarding(false);
    });
  }, []);

  if (isLoading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <ActivityIndicator size="large" color="#F7C948" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!isConnected || !isInternetReachable) {
    return <OfflineScreen />;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
