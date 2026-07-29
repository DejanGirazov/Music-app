import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  View,
  Image,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/apiFetch";

export default function LogIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    <SafeAreaView className="flex-1 bg-[#0B0A1F]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* TOP: hides instead of squishing when keyboard is open */}
        {!keyboardVisible && (
          <View className="flex-[0.8] items-center justify-center">
            <Image
              source={require("../../assets/images/tempo-logo-no-text.png")}
              className="w-80 h-80 opacity-80"
              resizeMode="contain"
            />
          </View>
        )}

        {/* BOTTOM: form panel */}
        <View className={keyboardVisible ? "flex-1 justify-center" : "flex-[1.6] justify-evenly"}>
          <View className="flex-1 bg-[#19163A] rounded-t-[40px] px-6 pt-9 pb-10 justify-between">
            <View className="mb-6">
              <Text className="text-white text-3xl font-bold mb-1.5 text-center">
                Welcome back
              </Text>
            </View>

            <View className="flex">
              <Text className="text-white text-base mb-3.5 font-bold">
                Email
              </Text>
              <TextInput
                className="bg-[#211E45] border border-[#403872] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
                placeholder="Email"
                placeholderTextColor="#8B85B6"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!logInMutation.isPending}
              />
            </View>

            <View>
              <Text className="text-white text-base mb-3.5 font-bold">
                Password
              </Text>
              <TextInput
                className="bg-[#211E45] border border-[#403872] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
                placeholder="Password"
                placeholderTextColor="#8B85B6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!logInMutation.isPending}
              />
            </View>

            <Pressable
              className={`bg-[#8B5CF6] rounded-xl py-4 items-center mt-2 ${
                logInMutation.isPending ? "opacity-60" : ""
              }`}
              onPress={handleSubmit}
              disabled={logInMutation.isPending}
            >
              {logInMutation.isPending ? (
                <ActivityIndicator color="#0A0F1E" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Log in
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/signUp" as any)}>
              <Text className="text-white text-center mt-6 text-sm">
                Don&apos;t have an account?{" "}
                <Text className="text-[#8B5CF6] font-semibold">Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}