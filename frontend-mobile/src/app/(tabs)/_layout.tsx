import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MiniPlayer from "../../../components/MiniPlayer";
import { View } from "react-native";


export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00BFFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#0A0F1E",
          borderTopColor: "#1A1F2E",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      </Tabs>
      <MiniPlayer />
    </View>

  );
}