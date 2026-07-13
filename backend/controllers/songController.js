import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../utils/r2Client.js";
import crypto from "crypto";
import prisma from "../utils/prisma.js";

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

    const audioUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    const song = await prisma.song.create({
      data: {
        title,
        audioUrl,
        fileKey: key,
        artist: {
          connectOrCreate: {
            where: { name: artistName },
            create: { name: artistName },
          },
        },
      },
    });
    res.status(201).json({
      message: "Song uploaded successfully",
      song,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload song" });
  }
};
