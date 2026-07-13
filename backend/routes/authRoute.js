import {logIn, signUp, logOut, getMe, updateMe} from "../controllers/authController.js";
import {protectRoute} from "../middleware/protectRoute.js";

const router = express.Router();


router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", logOut);
router.get("/getMe", protectRoute, getMe);
router.put("/updateMe", protectRoute, updateMe);