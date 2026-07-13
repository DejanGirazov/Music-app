import { useState  } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import { useMutation } from "@tanstack/react-query";

const API_URL = "http://localhost:5000/api/songs/postSongs"; 

interface UploadSongPayload {
  file: File;
  title: string;
  artist: string;
}

interface UploadSongResponse {
  id?: string;
  [key: string]: unknown;
}

async function uploadSong({
  file,
  title,
  artist,
}: UploadSongPayload): Promise<UploadSongResponse> {
  const formData = new FormData();
  formData.append("song", file);
  formData.append("title", title);
  formData.append("artistName", artist);

  const res = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Server responded with status ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

export default function SongUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");


  const mutation = useMutation<UploadSongResponse, Error, UploadSongPayload>({
    mutationFn: uploadSong,
    onSuccess: () => {
      setFile(null);
      setTitle("");
      setArtist("");
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !title.trim() || !artist.trim()) {
      setValidationError("Please fill in the song file, title, and artist.");
      return;
    }
    setValidationError("");
    mutation.mutate({ file, title, artist });
  };

  return (
    <div className="h-screen bg-slate-50 flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Add a song
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Upload an audio file with its title and artist.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Song file
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-slate-100 file:text-slate-700
                hover:file:bg-slate-200
                cursor-pointer"
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Song title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Midnight Drive"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setArtist(e.target.value)
              }
              placeholder="e.g. Jane Doe"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Status messages */}
          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}
          {mutation.isError && (
            <p className="text-sm text-red-600">{mutation.error.message}</p>
          )}
          {mutation.isSuccess && (
            <p className="text-sm text-green-600">Song uploaded successfully.</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-slate-900 text-white text-sm font-medium
              rounded-lg py-2.5 hover:bg-slate-800 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Uploading..." : "Upload song"}
          </button>
        </form>
      </div>
    </div>
  );
}