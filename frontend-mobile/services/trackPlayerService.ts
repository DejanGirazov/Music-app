import TrackPlayer, { Event } from "@rntp/player";
import { usePlayerStore } from "../store/playStore";

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.MediaItemTransition, (event) => {
    usePlayerStore.getState().handleNativeTransition(event);
  });
}