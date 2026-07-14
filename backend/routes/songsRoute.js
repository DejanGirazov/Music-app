import express from "express";
import multer from "multer";
import { postSong,getSongs, getSong, updateSong, deleteSong, getStreamUrl } from "../controllers/songController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/postSongs",protectRoute, upload.single("song"), postSong);
router.get("/getSongs",protectRoute, getSongs);
router.get("/getSong/:id",protectRoute, getSong);
router.put("/updateSong/:id",protectRoute, updateSong);
router.delete("/deleteSong/:id",protectRoute, deleteSong);
router.get("/:id/stream-url", protectRoute, getStreamUrl);

export default router;