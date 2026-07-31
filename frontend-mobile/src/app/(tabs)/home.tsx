import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { apiFetch } from "../../../utils/apiFetch";
import SongCard from "../../../components/SongCard";
import { usePlayerStore } from "../../../store/playStore";
import { useEffect } from "react";


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
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playSong = usePlayerStore((s) => s.playSong);
  const player = usePlayerStore((s) => s.player);
  const status = useAudioPlayerStatus(player);
  const setQueue = usePlayerStore((s) => s.setQueue);




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

    useEffect(() => {
  if (songs) setQueue(songs);
}, [songs, setQueue]);

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
    <View className="flex-1 bg-black pt-16 px-5">
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
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-10">
            No songs uploaded yet.
          </Text>
        }
        renderItem={({ item }) => (
          <SongCard
            song={item}
            isCurrent={currentSong?.id === item.id}
            isPlaying={currentSong?.id === item.id && status.playing}
            isLoading={isLoading && currentSong?.id === item.id}
            currentTime={
              currentSong?.id === item.id ? status.currentTime : null
            }
            onPress={playSong}
          />
        )}
      />
    </View>
  );
}
