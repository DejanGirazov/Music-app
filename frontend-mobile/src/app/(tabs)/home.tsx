import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsPlaying } from "@rntp/player";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../utils/apiFetch";
import SongCard from "../../../components/SongCard";
import { usePlayerStore } from "../../../store/playStore";

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

type Playlist = {
  id: number;
  title: string;
  _count: { songs: number };
};

export default function Home() {
  const router = useRouter();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playSong = usePlayerStore((s) => s.playSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

const isPlaying = useIsPlaying();  const {
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

  const { data: playlists, isLoading: loadingPlaylists } = useQuery<Playlist[]>(
    {
      queryKey: ["playlists"],
      queryFn: async () => {
        const res = await apiFetch("/api/playlists");
        if (!res.ok) throw new Error("Failed to load playlists");
        return res.json();
      },
    },
  );

  useEffect(() => {
    if (songs) setQueue(songs);
  }, [songs, setQueue]);

  const recentSongs = useMemo(() => {
    if (!songs) return [];
    return [...songs]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [songs]);

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
    <FlatList
      className="flex-1 bg-black"
      contentContainerStyle={{
        paddingTop: 64,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
      data={recentSongs}
      keyExtractor={(item) => item.id.toString()}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <View>
          <Text className="text-white text-3xl font-bold mb-1">Home</Text>
          <Text className="text-gray-400 text-base mb-6">
            {songs?.length ?? 0} song{songs?.length === 1 ? "" : "s"}
          </Text>

          {currentSong && (
            <View className="mb-6">
              <Text className="text-white text-sm font-semibold mb-3">
                Continue listening
              </Text>
              <Pressable
                onPress={() => playSong(currentSong)}
                className="flex-row items-center bg-[#211E45] rounded-xl px-3 py-2.5 mb-8"
              >
                <View className="w-9 h-9 rounded-lg bg-[#4C3A9E] items-center justify-center mr-3">
                  <Text className="text-white text-lg">
                    {isPlaying ? "❚❚" : "▶"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[#B8B3D9] text-xs mt-0.5"
                  >
                    {currentSong.title} ·{" "}
                    {currentSong.artist?.name ?? "Unknown artist"}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          <Text className="text-white text-lg font-semibold mb-3">
            Your playlists
          </Text>
          {loadingPlaylists ? (
            <ActivityIndicator color="#00BFFF" style={{ marginBottom: 24 }} />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={playlists ?? []}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              style={{ marginBottom: 28 }}
              ListEmptyComponent={
                <Text className="text-gray-400 text-sm">No playlists yet.</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/playlist/${item.id}` as any)}
                  className="w-32 bg-[#151B2E] border border-[#232B44] rounded-xl p-3"
                >
                  <Text numberOfLines={1} className="text-white text-sm">
                    {item.title}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {item._count.songs} song{item._count.songs === 1 ? "" : "s"}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <Text className="text-white text-lg font-semibold mb-3">
            Recently added
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text className="text-gray-400 text-center mt-10">
          No songs uploaded yet.
        </Text>
      }
      renderItem={({ item }) => (
        <SongCard
          song={item}
          isCurrent={currentSong?.id === item.id}
          isPlaying={currentSong?.id === item.id && isPlaying}
          isLoading={isLoading && currentSong?.id === item.id}
          currentTime={null}
          onPress={playSong}
        />
      )}
    />
  );
}