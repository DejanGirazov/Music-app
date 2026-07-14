import {logIn, signUp, logOut, getMe, updateMe} from "../controllers/authController.js";
import {protectRoute} from "../middleware/protectRoute.js";
import express from "express";

const router = express.Router();


router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", logOut);
router.get("/getMe", protectRoute, getMe);
router.put("/updateMe", protectRoute, updateMe);

export default router;