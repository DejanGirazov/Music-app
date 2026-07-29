import { useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { apiFetch } from "../../../utils/apiFetch";
import SongCard from "../../../components/SongCard";

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

export default function Home() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const {
    data: songs,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: async () => {
      const res = await apiFetch("/api/songs/getSongs");
      if (!res.ok) throw new Error("Failed to load songs");
      return res.json();
    },
  });

  const handlePress = async (song: Song) => {
    if (playingId === song.id) {
      status.playing ? player.pause() : player.play();
      return;
    }

    try {
      setLoadingId(song.id);
      const res = await apiFetch(`/api/songs/${song.id}/stream-url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get stream URL");

      player.replace({ uri: data.audioUrl });
      player.play();
      setPlayingId(song.id);
    } catch (err) {
      console.log("Playback error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center">
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center px-6">
        <Text className="text-gray-400 text-base mb-4 text-center">
          Couldn&apos;t load songs.
        </Text>
        <Pressable
          className="bg-[#00BFFF] rounded-xl px-5 py-3"
          onPress={() => refetch()}
        >
          <Text className="text-[#0A0F1E] font-bold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0F1E] pt-16 px-5">
      <Text className="text-white text-3xl font-bold mb-1">Your Library</Text>
      <Text className="text-gray-400 text-base mb-6">
        {songs?.length ?? 0} song{songs?.length === 1 ? "" : "s"}
      </Text>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-10">
            No songs uploaded yet.
          </Text>
        }
        renderItem={({ item }) => (
          <SongCard
            song={item}
            isCurrent={playingId === item.id}
            isPlaying={playingId === item.id && status.playing}
            isLoading={loadingId === item.id}
            onPress={handlePress}
          />
        )}
      />
    </View>
  );
}