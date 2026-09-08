import express from "express";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { corsOptions } from "./config/origins.js";

import connect from "./db/db.js";
connect();

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again shortly." },
});

app.use("/users/login", authLimiter);
app.use("/users/register", authLimiter);

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "Nexora API",
    status: "ok",
  });
});

app.get("/health", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    connect();
  }

  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
    ai: Boolean(process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_KEY),
  });
});

export default app;
