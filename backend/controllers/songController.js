import { PutObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "../utils/r2Client.js";
import crypto from "crypto";

export const postSong = async (req, res) => {
  try {
 
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, artist } = req.body;
    const fileExt = req.file.originalname.split(".").pop();
    const key = `mp3/${crypto.randomUUID()}.${fileExt}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // TODO: save { title, artist, fileUrl, key } to your database here

    res.status(201).json({
      message: "Song uploaded successfully",
      url: fileUrl,
      title,
      artist,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload song" });
  }
};