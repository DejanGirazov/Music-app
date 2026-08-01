import { apiFetch } from "./apiFetch";

export const getRecentSongs = async (limit = 5) => {
  const res = await apiFetch(`/api/songs/recent?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch recent songs");
  return res.json();
};

export const getPlaylists = async () => {
  const res = await apiFetch(`/api/playlist/getPlaylists`);
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json();
};