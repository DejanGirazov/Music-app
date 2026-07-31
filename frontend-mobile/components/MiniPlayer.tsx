import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayerStatus } from "expo-audio";
import { usePlayerStore } from "../store/playStore";
import { useEffect } from "react";

const TAB_BAR_HEIGHT = 56;

export default function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const playNext = usePlayerStore((s) => s.playNext);
  const autoplay = usePlayerStore((s) => s.autoplay);

  const status = useAudioPlayerStatus(player);

    useEffect(() => {
    if (status.didJustFinish && autoplay) {
      playNext();
    }
  }, [status.didJustFinish, autoplay]);

  if (!currentSong) return null;



  const progress =
    status.duration > 0 ? status.currentTime / status.duration : 0;

  return (
    <Pressable
      onPress={() => router.push(`/song/${currentSong.id}` as any)}
      style={{ bottom: TAB_BAR_HEIGHT + insets.bottom }}
      className="absolute left-0 right-0 mx-2 rounded-xl bg-[#211E45] overflow-hidden"
    >
      {/* progress line */}
      <View className="h-0.5 bg-[#403872]">
        <View
          className="h-0.5 bg-[#8B5CF6]"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </View>

      <View className="flex-row items-center justify-between px-4 py-2.5">
        <View className="flex-1 mr-3">
          <Text numberOfLines={1} className="text-white text-sm font-semibold">
            {currentSong.title}
          </Text>
          <Text numberOfLines={1} className="text-[#B8B3D9] text-xs mt-0.5">
            {currentSong.artist?.name ?? "Unknown artist"}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
          >
            <Ionicons
              name={status.playing ? "pause" : "play"}
              size={18}
              color="#ffffff"
              style={{ marginLeft: status.playing ? 0 : 2 }}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
