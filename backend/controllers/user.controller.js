import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await userService.createUser(req.body);
    const token = await user.generateJWT();
    delete user._doc.password;
    res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ errors: "An account with this email already exists" });
    }
    console.error("register failed:", error.message);
    const waking =
      /buffering timed out|ECONNREFUSED|MongoNetwork|ServerSelection/i.test(
        error.message || ""
      );
    return res.status(waking ? 503 : 400).json({
      error: waking
        ? "Database is waking up. Please wait a few seconds and try again."
        : error.message,
    });
  }
};

export const loginController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        errors: "Invalid Credentials",
      });
    }
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        errors: "Invalid Credentials",
      });
    }
    const token = await user.generateJWT();
    delete user._doc.password;
    res.status(200).json({ user, token });
  } catch (err) {
    console.error("login failed:", err.message);
    const waking =
      /buffering timed out|ECONNREFUSED|MongoNetwork|ServerSelection/i.test(
        err.message || ""
      );
    return res.status(waking ? 503 : 400).json({
      error: waking
        ? "Database is waking up. Please wait a few seconds and try again."
        : err.message,
    });
  }
};

export const profileController = async (req, res) => {
  try {
    const user = await userModel.findOne({
      $or: [
        req.user._id ? { _id: req.user._id } : null,
        { email: req.user.email },
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    const token =
      req.token ||
      req.cookies.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).send({ error: "No token provided" });
    }

    try {
      await redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    } catch (redisError) {
      console.log("Redis not available during logout, continuing");
    }

    res.clearCookie("token", { httpOnly: true });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Something went wrong" });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });
    const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });
    return res.status(200).json({ users: allUsers });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};
