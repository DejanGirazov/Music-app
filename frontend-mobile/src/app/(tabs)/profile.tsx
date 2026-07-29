// app/(tabs)/profile.tsx
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../../../utils/apiFetch";

type CurrentUser = {
  email: string;
  fullName: string;
};

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<CurrentUser>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await apiFetch("/api/auth/getMe");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("jwt");
    queryClient.clear();
    router.replace("/logIn");
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center">
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0F1E] pt-16 px-5">
      {/* User info card */}
      <View className="bg-[#1E1B3A] rounded-2xl px-5 py-6 items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-[#4C3A9E] items-center justify-center mb-4">
          <Text className="text-white text-2xl font-bold">
            {user?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>

        <Text className="text-white text-lg font-bold">
          {user?.fullName ?? "Unknown"}
        </Text>
        <Text className="text-[#B8B3D9] text-sm mt-1">
          {user?.email ?? ""}
        </Text>
      </View>

      {/* Logout button */}
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center justify-center bg-[#1E1B3A] rounded-xl py-3.5"
      >
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text className="text-[#FF6B6B] text-base font-semibold ml-2">
          Log Out
        </Text>
      </Pressable>
    </View>
  );
}