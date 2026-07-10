import express from "express";
import {postSong} from "../controllers/songController.js"

const router = express.Router();

router.post("/postSongs", postSong);

export default router;