import { useMemo } from "react";
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsPlaying } from "@rntp/player";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "../../../utils/apiFetch";
import SongCard from "../../../components/SongCard";
import { usePlayerStore } from "../../../store/playStore";
import Ionicons from "@expo/vector-icons/build/Ionicons";

type Song = {
  id: number;
  title: string;
  artistId: number;
  duration: number | null;
  createdAt: string;
  artist: { id: number; name: string };
};

type ArtistDetail = {
  id: string;
  title: string; // artist name
  type: "ARTIST";
  songs: { position: number; song: Song }[];
};

export default function ArtistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isPlaying = useIsPlaying();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playSong = usePlayerStore((s) => s.playSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const { data: artist, isLoading, isError, refetch } = useQuery<ArtistDetail>({
    queryKey: ["artist", id],
    queryFn: async () => {
      const res = await apiFetch(`/api/songs/artists/${id}/playlist`);
      if (!res.ok) throw new Error("Failed to load artist");
      return res.json();
    },
    enabled: !!id,
  });

  const songs = useMemo(
    () => (artist?.songs ?? []).map((entry) => entry.song),
    [artist],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center">
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  if (isError || !artist) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center px-6">
        <Text className="text-gray-400 text-base mb-4 text-center">
          Couldn&apos;t load artist.
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
    <FlatList
      className="flex-1 bg-black"
      contentContainerStyle={{
        paddingTop: 64,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
      data={songs}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <View>
          <Pressable onPress={() => router.back()} className="mb-4">
            <Ionicons name="chevron-back-outline" size={22} color="white" />
          </Pressable>
          <Text className="text-white text-3xl font-bold mb-1">
            {artist.title}
          </Text>
          <Text className="text-gray-400 text-base mb-6">
            {songs.length} song{songs.length === 1 ? "" : "s"}
          </Text>
          {songs.length > 0 && (
            <Pressable
              onPress={() => {
                setQueue(songs);
                playSong(songs[0]);
              }}
              className="bg-[#00BFFF] rounded-xl px-5 py-3 self-start mb-6"
            >
              <Text className="text-[#0A0F1E] font-bold">Play all</Text>
            </Pressable>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text className="text-gray-400 text-center mt-10">
          No songs found.
        </Text>
      }
      renderItem={({ item }) => (
        <SongCard
          song={item}
          isCurrent={currentSong?.id === item.id}
          isPlaying={currentSong?.id === item.id && isPlaying}
          isLoading={false}
          currentTime={null}
          onPress={(song) => {
            setQueue(songs);
            playSong(song);
          }}
        />
      )}
    />
  );
}