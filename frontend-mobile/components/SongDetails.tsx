import { View, Text, Pressable, PanResponder, LayoutChangeEvent } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayerStatus } from "expo-audio";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { usePlayerStore } from "../store/playStore";

function formatTime(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type ScrubberProps = {
  value: number;
  duration: number;
  onSlidingStart: () => void;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
};

function Scrubber({ value, duration, onSlidingStart, onValueChange, onSlidingComplete }: ScrubberProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const positionToSeconds = (x: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, x / width));
    return ratio * duration;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onSlidingStart();
        onValueChange(positionToSeconds(evt.nativeEvent.locationX));
      },
      onPanResponderMove: (evt) => {
        onValueChange(positionToSeconds(evt.nativeEvent.locationX));
      },
      onPanResponderRelease: (evt) => {
        onSlidingComplete(positionToSeconds(evt.nativeEvent.locationX));
      },
    })
  ).current;

  const progress = duration > 0 ? Math.max(0, Math.min(1, value / duration)) : 0;

  return (
    <View
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      className="h-8 justify-center"
      hitSlop={{ top: 12, bottom: 12 }}
    >
      {/* Track background */}
      <View className="h-1.5 rounded-full bg-[#403872] w-full" />
      {/* Track fill */}
      <View
        className="h-1.5 rounded-full bg-[#8B5CF6] absolute left-0"
        style={{ width: trackWidth * progress }}
      />
      {/* Thumb */}
      <View
        className="w-4 h-4 rounded-full bg-[#8B5CF6] absolute"
        style={{ left: Math.max(0, trackWidth * progress - 8) }}
      />
    </View>
  );
}

type Props = {
  songId: string;
};

export default function SongDetails({ songId }: Props) {
  const insets = useSafeAreaInsets();

  const currentSong = usePlayerStore((s) => s.currentSong);
  const player = usePlayerStore((s) => s.player);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const status = useAudioPlayerStatus(player);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  if (!currentSong || currentSong.id.toString() !== songId) {
    return (
      <View className="flex-1 bg-[#0A0F1E] justify-center items-center px-6">
        <Text className="text-gray-400 text-base text-center">
          Nothing playing right now.
        </Text>
        <Pressable
          className="mt-6 bg-[#1E1B3A] rounded-xl px-5 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const duration = status.duration || 0;
  const displayTime = isScrubbing ? scrubValue : status.currentTime;

  return (
    <View
      className="flex-1 bg-[#0A0F1E] px-6"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-10">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color="#ffffff" />
        </Pressable>
        <Text className="text-gray-400 text-xs font-semibold tracking-wider">
          NOW PLAYING
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Artwork placeholder */}
      <View className="flex-1 items-center justify-center">
        <View className="w-72 h-72 rounded-3xl bg-[#1E1B3A] items-center justify-center">
          <Ionicons name="musical-notes" size={72} color="#4C3A9E" />
        </View>
      </View>

      {/* Title / artist */}
      <View className="mt-8">
        <Text numberOfLines={1} className="text-white text-2xl font-bold text-center">
          {currentSong.title}
        </Text>
        <Text numberOfLines={1} className="text-[#B8B3D9] text-base text-center mt-1">
          {currentSong.artist?.name ?? "Unknown artist"}
        </Text>
      </View>

      {/* Scrubber */}
      <View className="mt-8">
        <Scrubber
          value={displayTime}
          duration={duration}
          onSlidingStart={() => {
            setScrubValue(status.currentTime);
            setIsScrubbing(true);
          }}
          onValueChange={(value) => setScrubValue(value)}
          onSlidingComplete={(value) => {
            seekTo(value);
            setIsScrubbing(false);
          }}
        />
        <View className="flex-row justify-between mt-1">
          <Text className="text-[#B8B3D9] text-xs">{formatTime(displayTime)}</Text>
          <Text className="text-[#B8B3D9] text-xs">{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Playback controls */}
      <View className="flex-row items-center justify-center mt-8">
        <Pressable
          onPress={togglePlayPause}
          className="w-16 h-16 rounded-full bg-[#8B5CF6] items-center justify-center"
        >
          <Ionicons
            name={status.playing ? "pause" : "play"}
            size={28}
            color="#ffffff"
            style={{ marginLeft: status.playing ? 0 : 3 }}
          />
        </Pressable>
      </View>
    </View>
  );
}