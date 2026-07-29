import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/apiUrl";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await SecureStore.getItemAsync("jwt");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options, 
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return res;
};
