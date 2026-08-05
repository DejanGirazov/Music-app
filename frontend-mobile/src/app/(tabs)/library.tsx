import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../utils/apiFetch";
import { Song } from "../../../store/playStore";

type Playlist = {
  id: number;
  title: string;
  description: string | null;
  _count: { songs: number };
};

export default function Library() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ---- playlists list ----
  const {
    data: playlists,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      const res = await apiFetch("/api/playlist/getPlaylists");
      if (!res.ok) throw new Error("Failed to load playlists");
      return res.json();
    },
  });

  // ---- create playlist modal ----
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/playlist/createPlaylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setNewTitle("");
      setNewDescription("");
      setCreateModalVisible(false);
    },
  });

  const handleCreatePlaylist = () => {
    if (!newTitle.trim()) return;
    createPlaylistMutation.mutate();
  };

  // ---- add songs modal ----
  const [addSongsPlaylist, setAddSongsPlaylist] = useState<Playlist | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSongIds, setAddedSongIds] = useState<Set<number>>(new Set());
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!addSongsPlaylist) return;
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsSearching(true);

    (async () => {
      try {
        const res = await apiFetch(
          `/api/songs/search?q=${encodeURIComponent(debouncedQuery)}`,
        );
        const data = await res.json();
        if (currentRequestId !== requestIdRef.current) return;
        setResults(res.ok ? data : []);
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          console.log("Search failed:", err);
          setResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) setIsSearching(false);
      }
    })();
  }, [debouncedQuery, addSongsPlaylist]);

  const addSongMutation = useMutation({
    mutationFn: async (songId: number) => {
      if (!addSongsPlaylist) return;
      const res = await apiFetch(`/api/playlist/addToPlaylist/${addSongsPlaylist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add song");
      return songId;
    },
    onSuccess: (songId) => {
      if (songId == null) return;
      setAddedSongIds((prev) => new Set(prev).add(songId));
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({
        queryKey: ["playlist", addSongsPlaylist?.id],
      });
    },
  });

  const openAddSongs = (playlist: Playlist) => {
    setAddSongsPlaylist(playlist);
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setAddedSongIds(new Set());
  };

  const closeAddSongs = () => {
    setAddSongsPlaylist(null);
  };

  // ---- render ----
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center">
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0F1E]">
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        data={playlists ?? []}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-6 mt-2">
            <Text className="text-white text-3xl font-bold">Library</Text>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              className="flex-row items-center bg-[#00BFFF] rounded-xl px-3.5 py-2.5"
            >
              <Ionicons name="add" size={18} color="#0A0F1E" />
              <Text className="text-[#0A0F1E] font-bold text-sm ml-1">
                Create Playlist
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          isError ? (
            <Text className="text-gray-400 text-center mt-10">
              Couldn&apos;t load playlists.
            </Text>
          ) : (
            <Text className="text-gray-400 text-center mt-10">
              No playlists yet. Create one to get started.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/playlist/${item.id}` as any)}
            className="flex-row items-center bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 mb-3"
          >
            <View className="w-11 h-11 rounded-lg bg-[#4C3A9E] items-center justify-center mr-3">
              <Ionicons name="musical-notes" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-white text-base font-semibold">
                {item.title}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                {item._count.songs} song{item._count.songs === 1 ? "" : "s"}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                openAddSongs(item);
              }}
              hitSlop={8}
              className="w-8 h-8 rounded-full bg-[#232B44] items-center justify-center ml-2"
            >
              <Ionicons name="add" size={18} color="#00BFFF" />
            </Pressable>
          </Pressable>
        )}
      />

      {/* Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="bg-[#0A0F1E] border-t border-[#232B44] rounded-t-2xl px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-xl font-bold">New Playlist</Text>
              <Pressable onPress={() => setCreateModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <TextInput
              className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-3.5"
              placeholder="Playlist name"
              placeholderTextColor="#6B7280"
              value={newTitle}
              onChangeText={setNewTitle}
              editable={!createPlaylistMutation.isPending}
            />
            <TextInput
              className="bg-[#151B2E] border border-[#232B44] rounded-xl px-4 py-3.5 text-white text-base mb-4"
              placeholder="Description (optional)"
              placeholderTextColor="#6B7280"
              value={newDescription}
              onChangeText={setNewDescription}
              editable={!createPlaylistMutation.isPending}
              multiline
            />

            {createPlaylistMutation.isError && (
              <Text className="text-[#FF6B6B] text-sm mb-3">
                {(createPlaylistMutation.error as Error).message}
              </Text>
            )}

            <Pressable
              onPress={handleCreatePlaylist}
              disabled={!newTitle.trim() || createPlaylistMutation.isPending}
              className={`bg-[#00BFFF] rounded-xl py-4 items-center ${
                !newTitle.trim() || createPlaylistMutation.isPending
                  ? "opacity-60"
                  : ""
              }`}
            >
              {createPlaylistMutation.isPending ? (
                <ActivityIndicator color="#0A0F1E" />
              ) : (
                <Text className="text-[#0A0F1E] text-base font-bold">Create</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Songs Modal */}
      <Modal
        visible={!!addSongsPlaylist}
        animationType="slide"
        onRequestClose={closeAddSongs}
      >
        <SafeAreaView className="flex-1 bg-black px-4">
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <Text numberOfLines={1} className="text-white text-lg font-bold flex-1 mr-3">
              Add songs to {addSongsPlaylist?.title}
            </Text>
            <Pressable onPress={closeAddSongs} hitSlop={8}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <TextInput
            className="bg-neutral-900 text-white rounded-xl px-4 py-2.5 text-base mb-4"
            placeholder="Search songs or artists"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {isSearching && <ActivityIndicator className="my-3" size="small" />}

          <FlatList
            data={results}
            keyExtractor={(item) => `song-${item.id}`}
            renderItem={({ item }) => {
              const isAdded = addedSongIds.has(item.id);
              const isAdding =
                addSongMutation.isPending &&
                addSongMutation.variables === item.id;
              return (
                <View className="flex-row items-center bg-[#151B2E] rounded-xl px-3.5 py-3 mb-2.5">
                  <View className="flex-1 mr-3">
                    <Text numberOfLines={1} className="text-white text-sm">
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} className="text-gray-500 text-xs mt-0.5">
                      {item.artist?.name ?? "Unknown artist"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => !isAdded && addSongMutation.mutate(item.id)}
                    disabled={isAdded || isAdding}
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      isAdded ? "bg-[#1E3A2E]" : "bg-[#232B44]"
                    }`}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#00BFFF" />
                    ) : isAdded ? (
                      <Ionicons name="checkmark" size={18} color="#4ADE80" />
                    ) : (
                      <Ionicons name="add" size={18} color="#00BFFF" />
                    )}
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              !isSearching && debouncedQuery.length > 0 ? (
                <Text className="text-neutral-500 text-center mt-10">
                  No results found
                </Text>
              ) : !isSearching ? (
                <Text className="text-neutral-500 text-center mt-10">
                  Search for songs to add
                </Text>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}