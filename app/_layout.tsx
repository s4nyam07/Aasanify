import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { ActivityIndicator, View } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/lib/auth-context";
import { NetworkProvider } from "@/lib/network-context";
import { isOnboardingComplete } from "@/lib/onboarding-storage";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function RootLayoutContent() {
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    isOnboardingComplete().then((done) => {
      setOnboardingDone(done);
      setCheckingOnboarding(false);
    });
  }, []);

  if (checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <ActivityIndicator size="large" color="#F7C948" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/(onboarding)" />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
              <StatusBar style="light" />
              <RootLayoutContent />
            </GestureHandlerRootView>
          </QueryClientProvider>
        </AuthProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}
