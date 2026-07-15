import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });
    res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const signUp = async (req, res) => {
  try {

    const {email, password, fullName} = req.body;
   
    if (!email || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "Email, password and full name are required" });
    }
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const cleanFullName = fullName.trim();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        fullName: cleanFullName,
        passwordHash: hashedPassword,
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });
    res.status(201).json({
      message: "User signed up successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: cleanFullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logOut = async (req, res) => {
  try {
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, newPassword } = req.body;

    const data = {};

    if (fullName) {
      data.fullName = fullName.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long",
        });
      }

      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    res.status(200).json(user);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
export const updateUserRole = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true },
    });

    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update role" });
  }
};
export const getAllUsers = async (req,res)=>{
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}