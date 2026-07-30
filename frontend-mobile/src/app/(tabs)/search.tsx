import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayerStatus } from "expo-audio";
import { apiFetch } from "../../../utils/apiFetch";
import { usePlayerStore, Song } from "../../../store/playStore";
import SongCard from "../../../components/SongCard";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const player = usePlayerStore((s) => s.player);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isLoadingSong = usePlayerStore((s) => s.isLoading);
  const playSong = usePlayerStore((s) => s.playSong);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
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
          `/api/songs/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await res.json();

        if (currentRequestId !== requestIdRef.current) return;

        if (res.ok) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          console.log("Search failed:", err);
          setResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    })();
  }, [debouncedQuery]);

  const matchingArtists = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    results.forEach((s) => {
      if (
        s.artist &&
        s.artist.name.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
        !map.has(s.artist.id)
      ) {
        map.set(s.artist.id, s.artist);
      }
    });
    return Array.from(map.values());
  }, [results, debouncedQuery]);

  const visibleSongs = useMemo(() => {
    if (selectedArtist) {
      return results.filter((s) => s.artist?.name === selectedArtist);
    }
    return results;
  }, [results, selectedArtist]);

  return (
    <SafeAreaView className="flex-1 bg-black px-4">
      <TextInput
        className="bg-neutral-900 text-white rounded-xl px-4 py-2.5 text-base mb-4"
        placeholder="Search songs or artists"
        placeholderTextColor="#888"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setSelectedArtist(null);
        }}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {selectedArtist && (
        <TouchableOpacity
          className="bg-[#208AEF] rounded-xl p-2.5 mb-4"
          onPress={() => setSelectedArtist(null)}
        >
          <Text className="text-white font-semibold">
            Songs by {selectedArtist} ✕
          </Text>
        </TouchableOpacity>
      )}

      {isSearching && <ActivityIndicator className="my-3" size="small" />}

      {!selectedArtist && !isSearching && matchingArtists.length > 0 && (
        <View className="mb-4">
          <Text className="text-white text-lg font-semibold mb-2">Artists</Text>
          <FlatList
            horizontal
            data={matchingArtists}
            keyExtractor={(item) => `artist-${item.id}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-neutral-900 rounded-full px-3.5 py-2 mr-2"
                onPress={() => setSelectedArtist(item.name)}
              >
                <Text className="text-white text-sm">{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {!isSearching && debouncedQuery.length > 0 && (
        <Text className="text-white text-lg font-semibold mb-2">Songs</Text>
      )}

      <FlatList
        data={visibleSongs}
        keyExtractor={(item) => `song-${item.id}`}
        renderItem={({ item }) => {
          const isCurrent = currentSong?.id === item.id;
          return (
            <SongCard
              song={item}
              isCurrent={isCurrent}
              isPlaying={isCurrent && playerStatus.playing}
              isLoading={isCurrent && isLoadingSong}
              currentTime={isCurrent ? playerStatus.currentTime : null}
              onPress={playSong}
            />
          );
        }}
        ListEmptyComponent={
          !isSearching && debouncedQuery.length > 0 ? (
            <Text className="text-neutral-500 text-center mt-10">
              No results found
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}