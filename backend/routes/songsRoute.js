import express from "express";
import multer from "multer";
import { postSong,getSongs, getSong, updateSong, deleteSong } from "../controllers/songController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/postSongs", upload.single("song"), postSong);
router.get("/getSongs", getSongs);
router.get("/getSong/:id", getSong);
router.put("/updateSong/:id", updateSong);
router.delete("/deleteSong/:id", deleteSong);

export default router;