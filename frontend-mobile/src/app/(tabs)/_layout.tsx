import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MiniPlayer from "../../../components/MiniPlayer";
import { View } from "react-native";
import { usePlayerStore } from "../../../store/playStore";

export default function TabsLayout() {
  const hasLoadedSong = usePlayerStore((s) => s.loadedIds.size > 0);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#8B5CF6",
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
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library" color={color} size={size} />
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
        <Tabs.Screen name="artist/[id]" options={{ href: null }} />
        <Tabs.Screen name="playlist/[id]" options={{ href: null }} />
        <Tabs.Screen name="song/[id]" options={{ href: null }} />

      </Tabs>
      {hasLoadedSong  && <MiniPlayer />}
    </View>
  );
}
