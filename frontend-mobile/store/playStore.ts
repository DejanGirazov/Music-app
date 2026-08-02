import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackPlayer, { type MediaItemTransitionEvent } from "@rntp/player";
import { apiFetch } from "../utils/apiFetch";

type Artist = { id: number; name: string };
export type Song = {
  id: number;
  title: string;
  duration: number | null;
  createdAt: string;
  artist: Artist;
};

// How far behind/ahead of the current track we keep loaded in the
// *native* queue. AHEAD grows without bound as you skip forward
// (handleNativeTransition tops it off every transition). BEHIND is
// fixed at playSong time — see note in playSong for why.
const WINDOW_BEHIND = 2;
const WINDOW_AHEAD = 2;

async function fetchStreamUrl(songId: number): Promise<string> {
  const res = await apiFetch(`/api/songs/${songId}/stream-url`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get stream URL");
  return data.audioUrl;
}

function toMediaItem(song: Song, url: string) {
  return {
    mediaId: String(song.id),
    url,
    title: song.title,
    artist: song.artist?.name ?? "Unknown artist",
    duration: song.duration ?? undefined,
    extras: { songId: song.id },
  };
}

type PlayerState = {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isLoading: boolean;
  autoplay: boolean;
  // ids of songs currently present in the *native* queue (not just
  // "ahead" anymore — replaces queuedAheadIds)
  loadedIds: Set<number>;
  setQueue: (songs: Song[]) => void;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seekTo: (value: number) => void;
  toggleAutoplay: () => void;
  handleNativeTransition: (event: MediaItemTransitionEvent) => Promise<void>;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      queueIndex: -1,
      isLoading: false,
      autoplay: true,
      loadedIds: new Set<number>(),

      setQueue: (songs) => {
        const { currentSong } = get();
        const idx = currentSong
          ? songs.findIndex((s) => s.id === currentSong.id)
          : -1;
        set({ queue: songs, queueIndex: idx });
      },

      playSong: async (song, queue) => {
        const { currentSong } = get();

        if (currentSong?.id === song.id) {
          const playing = TrackPlayer.isPlaying();
          playing ? TrackPlayer.pause() : TrackPlayer.play();
          return;
        }

        const activeQueue = queue ?? get().queue;
        const idx = activeQueue.findIndex((s) => s.id === song.id);

        set({
          isLoading: true,
          currentSong: song,
          queue: activeQueue,
          queueIndex: idx,
        });

        try {
          // song always at index 0 — no skip()/index-jump dependency
          const url = await fetchStreamUrl(song.id);
          const items = [toMediaItem(song, url)];
          const loadedIds = new Set([song.id]);

          for (
            let i = idx + 1;
            i <= Math.min(activeQueue.length - 1, idx + WINDOW_AHEAD);
            i++
          ) {
            const s = activeQueue[i];
            const u = await fetchStreamUrl(s.id);
            items.push(toMediaItem(s, u));
            loadedIds.add(s.id);
          }

          await TrackPlayer.setMediaItems(items);
          TrackPlayer.play();
          set({ loadedIds });
        } catch (err) {
          console.log("Playback error:", err);
          set({ currentSong: null });
        } finally {
          set({ isLoading: false });
        }
      },

      // Both just delegate to native now — native owns the queue and
      // fires MediaItemTransition either way, which is what keeps our
      // state in sync (see handleNativeTransition below). Lock-screen
      // presses and in-app button presses are now the same code path.
      playNext: () => TrackPlayer.skipToNext(),
      playPrevious: async () => {
        const { queue, queueIndex, loadedIds } = get();
        const prevSong = queue[queueIndex - 1];
        if (!prevSong) return;

        // if it's not already loaded natively, native has nothing to go
        // back to — just manually start it instead of trusting skipToPrevious
        if (!loadedIds.has(prevSong.id)) {
          await get().playSong(prevSong, queue);
          return;
        }

        TrackPlayer.skipToPrevious();
      },
      togglePlayPause: () => {
        const playing = TrackPlayer.isPlaying();
        playing ? TrackPlayer.pause() : TrackPlayer.play();
      },

      seekTo: (seconds) => {
        TrackPlayer.seekTo(seconds);
      },

      toggleAutoplay: () => set((s) => ({ autoplay: !s.autoplay })),

      // Wired up in trackPlayerService — runs whenever native advances
      // the active item, from any source (lock screen, in-app, or a
      // track finishing naturally). Only tops off the *ahead* side —
      // see file header note on why "behind" isn't extended at
      // runtime.
      handleNativeTransition: async (event) => {
        const { item } = event;
        if (!item) return;

        const songId = item.extras?.songId as number | undefined;
        const { queue, loadedIds } = get();
        const matchIdx = songId ? queue.findIndex((s) => s.id === songId) : -1;
        if (matchIdx === -1) return;

        set({ currentSong: queue[matchIdx], queueIndex: matchIdx });

        const newLoaded = new Set(loadedIds);

        // --- leading edge: add one song ahead ---
        const upcoming = queue[matchIdx + WINDOW_AHEAD];
        if (upcoming && !newLoaded.has(upcoming.id)) {
          try {
            const url = await fetchStreamUrl(upcoming.id);
            TrackPlayer.addMediaItem(toMediaItem(upcoming, url));
            newLoaded.add(upcoming.id);
          } catch (err) {
            console.log("Prefetch next song failed:", err);
          }
        }
      },
    }),
    {
      name: "player-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentSong: state.currentSong }),
    },
  ),
);
