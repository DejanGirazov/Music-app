import { useState } from "react";
import {
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/apiFetch";

export default function LogIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const logInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Log in failed");
      }
      return data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("jwt", data.token);
      queryClient.setQueryData(["authUser"], data.user);
      router.replace("/(tabs)/home" as any);
    },
    onError: (err: any) => {
      Alert.alert("Log in failed", err.message);
    },
  });

  const handleSubmit = () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    logInMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0F1E] justify-center px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text className="text-white text-3xl font-bold mb-1.5">
        Welcome back
      </Text>
      <Text className="text-gray-400 text-base mb-8">Log in to continue</Text>

      <TextInput
        className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
        placeholder="Email"
        placeholderTextColor="#6B7280"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!logInMutation.isPending}
      />
      <TextInput
        className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
        placeholder="Password"
        placeholderTextColor="#6B7280"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!logInMutation.isPending}
      />

      <Pressable
        className={`bg-[#00BFFF] rounded-xl py-4 items-center mt-2 ${
          logInMutation.isPending ? "opacity-60" : ""
        }`}
        onPress={handleSubmit}
        disabled={logInMutation.isPending}
      >
        {logInMutation.isPending ? (
          <ActivityIndicator color="#0A0F1E" />
        ) : (
          <Text className="text-[#0A0F1E] text-base font-bold">Log in</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/signUp" as any)}>
        <Text className="text-gray-400 text-center mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Text className="text-[#00BFFF] font-semibold">Sign up</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}