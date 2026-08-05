import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type PlaylistDetail = {
  id: number;
  title: string;
  description: string | null;
  songs: { position: number; song: Song }[];
};

export default function PlaylistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isPlaying = useIsPlaying();
  const queryClient = useQueryClient();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const playSong = usePlayerStore((s) => s.playSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const [removingSongId, setRemovingSongId] = useState<number | null>(null);

  const {
    data: playlist,
    isLoading,
    isError,
    refetch,
  } = useQuery<PlaylistDetail>({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const res = await apiFetch(`/api/playlist/getPlaylist/${id}`);
      if (!res.ok) throw new Error("Failed to load playlist");
      return res.json();
    },
    enabled: !!id,
  });

  const songs = useMemo(
    () => (playlist?.songs ?? []).map((entry) => entry.song),
    [playlist],
  );

  const removeSongMutation = useMutation({
    mutationFn: async (songId: number) => {
      setRemovingSongId(songId);
      const res = await apiFetch(`/api/playlist/removeFromPlaylist/${id}/${songId}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to remove song");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", id] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onSettled: () => setRemovingSongId(null),
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/playlist/deletePlaylist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete playlist");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      router.back();
    },
  });

  const confirmDeletePlaylist = () => {
    Alert.alert(
      "Delete playlist",
      `Are you sure you want to delete "${playlist?.title}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePlaylistMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center">
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  if (isError || !playlist) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center px-6">
        <Text className="text-gray-400 text-base mb-4 text-center">
          Couldn&apos;t load playlist.
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
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={22} color="white" />
            </Pressable>
            <Pressable onPress={confirmDeletePlaylist} hitSlop={8}>
              {deletePlaylistMutation.isPending ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              )}
            </Pressable>
          </View>

          <Text className="text-white text-3xl font-bold mb-1">
            {playlist.title}
          </Text>
          {playlist.description ? (
            <Text className="text-gray-400 text-sm mb-2">
              {playlist.description}
            </Text>
          ) : null}
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
          No songs in this playlist yet.
        </Text>
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center">
          <View className="flex-1">
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
          </View>
          <Pressable
            onPress={() => removeSongMutation.mutate(item.id)}
            disabled={removingSongId === item.id}
            hitSlop={8}
            className="w-8 h-8 items-center justify-center ml-1"
          >
            {removingSongId === item.id ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
            )}
          </Pressable>
        </View>
      )}
    />
  );
}