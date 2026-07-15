import { createPlaylist, getPlaylists,getPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist } from "../controllers/playlistController.js";
import express from "express";
import {protectRoute} from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/getPlaylists",protectRoute, getPlaylists);
router.get("/getPlaylist/:id",protectRoute, getPlaylist);
router.post("/createPlaylist",protectRoute, createPlaylist);
router.delete("/deletePlaylist/:id",protectRoute, deletePlaylist);
router.put("/addToPlaylist/:id",protectRoute, addSongToPlaylist);
router.put("/removeFromPlaylist/:id/:songId",protectRoute, removeSongFromPlaylist);

export default router;
