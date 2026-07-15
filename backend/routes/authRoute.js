import {logIn, signUp, logOut, getMe, updateMe, updateUserRole, getAllUsers} from "../controllers/authController.js";
import {protectRoute} from "../middleware/protectRoute.js";
import express from "express";
import {requireAdmin} from "../middleware/requireAdmin.js";

const router = express.Router();


router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", logOut);
router.get("/getMe", protectRoute, getMe);
router.put("/updateMe", protectRoute, updateMe);
router.put("/updateUserRole/:id", protectRoute,requireAdmin, updateUserRole);
router.get("/getAllUsers", protectRoute,requireAdmin, getAllUsers);

export default router;