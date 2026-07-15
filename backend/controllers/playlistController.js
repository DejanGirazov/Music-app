import prisma from "../utils/prisma.js";

export const createPlaylist = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    console.log(title);
    console.log(req.user.id);

    const playlist = await prisma.playlist.create({
      data: {
        title,
        description,
        user: { connect: { id: req.user.id } },
      },
    });

    res.status(201).json(playlist);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create playlist" });
  }
};

export const getPlaylists = async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { songs: true } },
      },
    });
    if(!playlists) {
      return res.status(404).json({ error: "No playlists" });
    }
    res.status(200).json(playlists);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
};

export const getPlaylist = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid playlist id" });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { position: "asc" },
          include: { song: { include: { artist: true } } },
        },
      },
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.status(200).json(playlist);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
};

export const addSongToPlaylist = async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { songId } = req.body;

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const lastSong = await prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
    });
    const nextPosition = lastSong ? lastSong.position + 1 : 0;

    const entry = await prisma.playlistSong.create({
      data: {
        playlist: { connect: { id: playlistId } },
        song: { connect: { id: songId } },
        position: nextPosition,
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.log(err);
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Song already in playlist" });
    }
    res.status(500).json({ error: "Failed to add song to playlist" });
    
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.playlistSong.delete({
      where: { playlistId_songId: { playlistId, songId } },
    });

    res.status(200).json({ message: "Song removed from playlist" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to remove song from playlist" });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const playlist = await prisma.playlist.findUnique({ where: { id } });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    if (playlist.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.playlist.delete({ where: { id } });
    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete playlist" });
  }
};