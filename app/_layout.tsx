import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { UserProvider, useUser } from "@/context/UserContext";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isLoggedIn, isLoading, hasSeenWelcome } = useUser();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onWelcome = segments[0] === "welcome";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && !hasSeenWelcome && !onWelcome) {
      router.replace("/welcome");
    } else if (isLoggedIn && hasSeenWelcome && (inAuthGroup || onWelcome)) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isLoading, hasSeenWelcome, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
          <KeyboardProvider>
            <UserProvider>
              <RootLayoutNav />
            </UserProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
