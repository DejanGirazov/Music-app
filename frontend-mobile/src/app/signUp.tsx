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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/apiFetch";

export default function SignUp() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
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

  const signUpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/signUp", {
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
      className="flex-1 bg-[#0B0A1F]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* TOP: hides instead of squishing when keyboard is open */}
      {!keyboardVisible && (
        <View className="flex-[0.6] items-center justify-center">
          <Image
            source={require("../../assets/images/tempo-logo-no-text.png")}
            className="w-64 h-64 opacity-80"
            resizeMode="contain"
          />
        </View>
      )}

      {/* BOTTOM: scrollable form panel */}
      <View className="flex-1">
        <ScrollView
          className="flex-1 bg-[#19163A] rounded-t-[40px]"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-white text-3xl font-bold mb-1.5 text-center">
              Create account
            </Text>
          </View>

          <View>
            <Text className="text-white text-base mb-3.5 font-bold">
              Full name
            </Text>
            <TextInput
              className="bg-[#211E45] border border-[#403872] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
              placeholder="Full name"
              placeholderTextColor="#8B85B6"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!signUpMutation.isPending}
            />
          </View>

          <View>
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
              editable={!signUpMutation.isPending}
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
              editable={!signUpMutation.isPending}
            />
          </View>

          <Pressable
            className={`bg-[#8B5CF6] rounded-xl py-4 items-center mt-2 ${
              signUpMutation.isPending ? "opacity-60" : ""
            }`}
            onPress={handleSubmit}
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending ? (
              <ActivityIndicator color="#0A0F1E" />
            ) : (
              <Text className="text-white text-base font-bold">Sign up</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/logIn" as any)}>
            <Text className="text-white text-center mt-6 text-sm">
              Already have an account?{" "}
              <Text className="text-[#8B5CF6] font-semibold">Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}