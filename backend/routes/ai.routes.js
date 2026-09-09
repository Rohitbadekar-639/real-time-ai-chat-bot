import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as aiController from "../controllers/ai.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { requireDb } from "../middleware/db.middleware.js";

const router = Router();

const aiHttpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit reached. Try again in a few minutes." },
});

router.post(
  "/get-result",
  requireDb,
  authUser,
  aiHttpLimiter,
  aiController.getResult
);

export default router;
