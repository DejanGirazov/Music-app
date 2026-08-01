import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { apiFetch } from "../utils/apiFetch";

// Configure the audio session for background playback (call once)
setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: "doNotMix", // required for lock-screen controls to bind correctly
});

type Artist = {
  id: number;
  name: string;
};

export type Song = {
  id: number;
  title: string;
  duration: number | null;
  createdAt: string;
  artist: Artist;
};

type PlayerState = {
  player: AudioPlayer;
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isLoading: boolean;
  autoplay: boolean;
  setQueue: (songs: Song[]) => void;
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  seekTo: (value: number) => void;
  toggleAutoplay: () => void;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: createAudioPlayer(),
      currentSong: null,
      queue: [],
      queueIndex: -1,
      isLoading: false,
      autoplay: true,

      // Call this whenever the song list loads/refreshes (e.g. in home.tsx)
      setQueue: (songs) => {
        const { currentSong } = get();
        const idx = currentSong ? songs.findIndex((s) => s.id === currentSong.id) : -1;
        set({ queue: songs, queueIndex: idx });
      },

      playSong: async (song, queue) => {
        const { currentSong, player } = get();

        // toggle play/pause if tapping the same song again
        if (currentSong?.id === song.id) {
          player.playing ? player.pause() : player.play();
          return;
        }

        const activeQueue = queue ?? get().queue;
        const idx = activeQueue.findIndex((s) => s.id === song.id);

        set({ isLoading: true, currentSong: song, queue: activeQueue, queueIndex: idx });

        try {
          const res = await apiFetch(`/api/songs/${song.id}/stream-url`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to get stream URL");

          player.replace({ uri: data.audioUrl });
          player.play();
          player.setActiveForLockScreen(true, {
            title: song.title,
            artist: song.artist?.name ?? "Unknown artist",
          });
        } catch (err) {
          console.log("Playback error:", err);
          set({ currentSong: null });
        } finally {
          set({ isLoading: false });
        }
      },

      playNext: () => {
        const { queue, queueIndex, playSong } = get();
        if (queue.length === 0) return;
        const nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) return; // end of queue, nothing to do
        playSong(queue[nextIndex], queue);
      },

      playPrevious: () => {
        const { queue, queueIndex, playSong } = get();
        if (queue.length === 0) return;
        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) return;
        playSong(queue[prevIndex], queue);
      },

      togglePlayPause: () => {
        const { player } = get();
        player.playing ? player.pause() : player.play();
      },

      seekTo: (seconds) => {
        get().player.seekTo(seconds);
      },

      toggleAutoplay: () => set((s) => ({ autoplay: !s.autoplay })),
    }),
    {
      name: "player-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist currentSong. Never persist `player` (AudioPlayer instance,
      // not serializable), and never persist `queue`/`queueIndex` since those
      // come fresh from home.tsx's setQueue on every load anyway.
      partialize: (state) => ({ currentSong: state.currentSong }),
    }
  )
);