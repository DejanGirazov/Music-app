import express from "express";
import multer from "multer";
import { postSong } from "../controllers/songController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/postSongs", upload.single("song"), postSong);

export default router;