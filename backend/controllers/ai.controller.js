import * as ai from "../services/ai.service.js";
import { clipAiPrompt } from "../services/ai-guard.js";
import { recordAiAudit } from "../models/aiAudit.model.js";

export const getResult = async (req, res) => {
  try {
    const prompt = clipAiPrompt(req.body?.prompt);
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }
    const result = await ai.generateResult(prompt);
    recordAiAudit({
      userId: String(req.user?._id || ""),
      email: req.user?.email,
      promptChars: prompt.length,
      provider: "http",
      outcome: "ok",
    });
    res.type("json").send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
