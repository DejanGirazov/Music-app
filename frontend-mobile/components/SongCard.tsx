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
  onPress: (song: Song) => void;
};

function formatDuration(seconds: number | null) {
  if (!seconds && seconds !== 0) return "--:--";
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
  onPress,
}: SongCardProps) {
  return (
    <Pressable
      onPress={() => onPress(song)}
      className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 border ${
        isCurrent
          ? "bg-[#151B2E] border-[#00BFFF]"
          : "bg-[#111726] border-[#232B44]"
      }`}
    >
      <View className="flex-1 mr-3">
        <Text
          numberOfLines={1}
          className={`text-base font-semibold ${
            isCurrent ? "text-[#00BFFF]" : "text-white"
          }`}
        >
          {song.title}
        </Text>
        <Text numberOfLines={1} className="text-gray-400 text-sm mt-0.5">
          {song.artist?.name ?? "Unknown artist"} ·{" "}
          {formatDuration(song.duration)}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#00BFFF" />
      ) : (
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          size={34}
          color={isCurrent ? "#00BFFF" : "#6B7280"}
        />
      )}
    </Pressable>
  );
}