import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Unauthorized: User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or expired token" });
  }
};
