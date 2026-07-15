import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../utils/r2Client.js";
import crypto from "crypto";
import prisma from "../utils/prisma.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { parseBuffer } from "music-metadata";


export const postSong = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, artistName } = req.body;
    if (!title || !artistName) {
      return res
        .status(400)
        .json({ error: "Title and artist name are required" });
    }
    const fileExt = req.file.originalname.split(".").pop();
    const key = `mp3/${crypto.randomUUID()}.${fileExt}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );
    const metadata = await parseBuffer(req.file.buffer, req.file.mimetype);
const duration = metadata.format.duration
  ? Math.round(metadata.format.duration)
  : null;

    const song = await prisma.song.create({
      data: {
        title,
        fileKey: key,
        artist: {
          connectOrCreate: {
            where: { name: artistName },
            create: { name: artistName },
          },
        },
        duration,
        uploader: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
    res.status(201).json({
      message: "Song uploaded successfully",
      song,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to upload song" });
  }
};

export const getSongs = async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        duration: true,
        createdAt: true,
        artist: true,
      },
    });
    res.status(200).json(songs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
};

export const getSong = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid song id" });
    }
    const song = await prisma.song.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        duration: true,
        createdAt: true,
        artist: true,
      },
    });
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.status(200).json(song);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch song" });
  }
};

export const updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artistName } = req.body;
    if (!title || !artistName) {
      return res
        .status(400)
        .json({ error: "Title and artist name are required" });
    }

    const updatedSong = await prisma.song.update({
      where: { id: parseInt(id) },
      data: {
        title,
        artist: {
          connectOrCreate: {
            where: { name: artistName },
            create: { name: artistName },
          },
        },
      },
      include: {
        artist: true,
      },
    });
    if (updatedSong) {
      res.status(200).json(updatedSong);
    } else {
      res.status(404).json({ error: "Song not found" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update song" });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await prisma.song.findUnique({
      where: { id: parseInt(id) },
    });
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: song.fileKey,
      }),
    );
    await prisma.song.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: "Song deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete song" });
  }
};
export const getStreamUrl = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid song id" });
    }

    const song = await prisma.song.findUnique({
      where: { id },
      select: { fileKey: true },
    });

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: song.fileKey,
    });

    const audioUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    res.status(200).json({ audioUrl, expiresIn: 3600 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to generate stream URL" });
  }
};
