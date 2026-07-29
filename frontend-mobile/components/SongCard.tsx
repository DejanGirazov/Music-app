// components/SongCard.tsx
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Artist = {
  id: number;
  name: string;
};

type Song = {
  id: number;
  title: string;
  duration: number | null;
  createdAt: string;
  artist: Artist;
};

type SongCardProps = {
  song: Song;
  isCurrent: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime?: number | null;
  onPress: (song: Song) => void;
};

function formatTime(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function SongCard({
  song,
  isCurrent,
  isPlaying,
  isLoading,
  currentTime,
  onPress,
}: SongCardProps) {
  return (
    <Pressable
      onPress={() => onPress(song)}
      className={`flex-row items-center justify-between rounded-2xl px-4 py-2.5 mb-2 ${
        isCurrent ? "bg-[#4C3A9E]" : "bg-[#1E1B3A]"
      }`}
    >
      <View className="flex-1 mr-3">
        <Text numberOfLines={1} className="text-white text-[15px] font-semibold">
          {song.title}
        </Text>
        <Text numberOfLines={1} className="text-[#B8B3D9] text-xs mt-0.5">
          {song.artist?.name ?? "Unknown artist"}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Text className="text-[#D6D2EE] text-xs font-medium mr-2.5">
          {isCurrent
            ? `${formatTime(currentTime)} / ${formatTime(song.duration)}`
            : formatTime(song.duration)}
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <View className="w-8 h-8 rounded-full bg-white/15 items-center justify-center">
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={16}
              color="#ffffff"
              style={{ marginLeft: isPlaying ? 0 : 2 }}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}