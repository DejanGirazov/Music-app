import TrackPlayer from "@rntp/player";
import { PlaybackService } from "./services/trackPlayerService";
import { usePlayerStore } from "./store/playStore";

PlaybackService();

TrackPlayer.registerBackgroundEventHandler(() => async (event) => {
  await usePlayerStore.getState().handleNativeTransition(event);
});

import "expo-router/entry";