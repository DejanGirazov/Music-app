import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { apiFetch } from "../../utils/apiFetch";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./globals.css";
import TrackPlayer, { PlayerCommand } from "@rntp/player";

const queryClient = new QueryClient();
let isPlayerSetup = false;

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (isPlayerSetup) return;
    isPlayerSetup = true;

    try {
      TrackPlayer.setupPlayer();

      TrackPlayer.setCommands({
        capabilities: [
          PlayerCommand.PlayPause,
          PlayerCommand.Next,
          PlayerCommand.Previous,
          PlayerCommand.Seek,
        ],
        handling: "native",
      });
    } catch (err) {
      console.log("setupPlayer error:", err);
    }
  }, []);

  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/api/auth/getMe");

        if (!res.ok) {
          await SecureStore.deleteItemAsync("jwt"); // clean up dead/invalid token
          return null;
        }

        const data = await res.json();
        if (data.error) return null;
        return data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    setMounted(true); // ← mark as mounted
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === "logIn" || segments[0] === "signUp";

    if (!authUser && !inAuthGroup) {
      // not logged in, and not already on an auth screen → send to login
      router.replace("/logIn" as any);
    } else if (authUser && inAuthGroup) {
      // logged in, but on login/signup or bare root → send to home
      router.replace("/(tabs)/home" as any);
    }
  }, [authUser, isLoading, segments, mounted]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0F1E",
        }}
      >
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="logIn" />
      <Stack.Screen name="signUp" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
