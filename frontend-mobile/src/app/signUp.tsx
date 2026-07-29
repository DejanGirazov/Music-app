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

export default function SignUp() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign up failed");
      }
      return data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("jwt", data.token);
      queryClient.setQueryData(["authUser"], data.user);
      router.replace("/(tabs)/home" as any);
    },
    onError: (err: any) => {
      Alert.alert("Sign up failed", err.message);
    },
  });

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    signUpMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0F1E] justify-center px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text className="text-white text-3xl font-bold mb-1.5">
        Create account
      </Text>
      <Text className="text-gray-400 text-base mb-8">
        Sign up to start listening
      </Text>

      <TextInput
        className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
        placeholder="Full name"
        placeholderTextColor="#6B7280"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        editable={!signUpMutation.isPending}
      />
      <TextInput
        className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
        placeholder="Email"
        placeholderTextColor="#6B7280"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!signUpMutation.isPending}
      />
      <TextInput
        className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
        placeholder="Password"
        placeholderTextColor="#6B7280"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!signUpMutation.isPending}
      />

      <Pressable
        className={`bg-[#00BFFF] rounded-xl py-4 items-center mt-2 ${
          signUpMutation.isPending ? "opacity-60" : ""
        }`}
        onPress={handleSubmit}
        disabled={signUpMutation.isPending}
      >
        {signUpMutation.isPending ? (
          <ActivityIndicator color="#0A0F1E" />
        ) : (
          <Text className="text-[#0A0F1E] text-base font-bold">Sign up</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push("/logIn" as any)}>
        <Text className="text-gray-400 text-center mt-6 text-sm">
          Already have an account?{" "}
          <Text className="text-[#00BFFF] font-semibold">Log in</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

