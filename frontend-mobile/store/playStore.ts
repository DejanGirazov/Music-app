import { create } from "zustand";
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
  isLoading: boolean;
  playSong: (song: Song) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (value: number) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: createAudioPlayer(),
  currentSong: null,
  isLoading: false,

  playSong: async (song) => {
    const { currentSong, player } = get();

    if (currentSong?.id === song.id) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      return;
    }

    set({ isLoading: true, currentSong: song });

    try {
      const res = await apiFetch(`/api/songs/${song.id}/stream-url`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get stream URL");
      }

      player.replace({ uri: data.audioUrl });
      player.play();

      // Lock screen / notification controls with metadata
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

  togglePlayPause: () => {
    const { player } = get();
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  },
   seekTo: (seconds: number) => {
    const { player } = get();
    player.seekTo(seconds);
  },
}));