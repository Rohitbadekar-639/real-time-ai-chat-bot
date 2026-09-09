import OpenAI from "openai";
import { clipAiPrompt, isTrivialAiPrompt } from "./ai-guard.js";

const SYSTEM_INSTRUCTION = `You are an expert full-stack engineer inside Nexora, a live coding room.

Always reply with a single JSON object. No markdown fences. Shape:
{
  "text": "short markdown explanation for the chat",
  "fileTree": {
    "filename.ext": { "file": { "contents": "full file source" } }
  },
  "buildCommand": { "mainItem": "npm", "commands": ["install"] },
  "startCommand": { "mainItem": "npm", "commands": ["start"] }
}

Rules:
- fileTree keys must be root-level files only (no nested folders, never routes/index.js).
- The project must run in a browser WebContainer: Node.js + npm. Prefer Express or a small Node CLI.
- Always include package.json with "start" script when you generate code.
- If the user asks for Java, Python, C++, etc., still generate a Node.js program that does the same thing, and mention the mapping in "text". WebContainer cannot compile those languages.
- Escape JSON strings correctly. Put complete file contents in file.contents.
- For greetings with no coding request, omit fileTree and only return {"text":"..."}.`;

const GEMINI_MODELS = [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-flash-latest",
      "gemini-1.5-flash",
    ].filter(Boolean)
  ),
];

function normalizeFileTree(tree) {
  if (!tree || typeof tree !== "object" || Array.isArray(tree)) {
    return null;
  }

  const out = {};

  for (const [name, node] of Object.entries(tree)) {
    if (!name || name.includes("\\")) continue;

    if (typeof node === "string") {
      out[name] = { file: { contents: node } };
      continue;
    }

    if (node?.file?.contents != null) {
      out[name] = { file: { contents: String(node.file.contents) } };
      continue;
    }

    if (node?.contents != null) {
      out[name] = { file: { contents: String(node.contents) } };
    }
  }

  return Object.keys(out).length ? out : null;
}

function parseModelJson(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { text: text || "The assistant returned an unreadable response." };
  }

  const fileTree = normalizeFileTree(parsed.fileTree);
  return {
    text: parsed.text || "Generated a workspace for this room.",
    ...(fileTree ? { fileTree } : {}),
    ...(parsed.buildCommand ? { buildCommand: parsed.buildCommand } : {}),
    ...(parsed.startCommand ? { startCommand: parsed.startCommand } : {}),
  };
}

function toPayload(raw) {
  return JSON.stringify(parseModelJson(raw));
}

async function generateWithOpenAI(prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 2800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: prompt },
    ],
  });

  return toPayload(completion.choices[0]?.message?.content);
}

let geminiModelCache = { at: 0, names: [] };

async function listGeminiModels(apiKey) {
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const names = (data.models || [])
        .filter((model) =>
          (model.supportedGenerationMethods || []).includes("generateContent")
        )
        .map((model) => String(model.name || "").replace(/^models\//, ""))
        .filter(Boolean);
      if (names.length) return names;
    } catch (error) {
      console.error("Gemini list models failed:", error.message);
    }
  }

  return [];
}

async function cachedGeminiModels(apiKey) {
  if (Date.now() - geminiModelCache.at < 10 * 60 * 1000 && geminiModelCache.names.length) {
    return geminiModelCache.names;
  }
  const names = await listGeminiModels(apiKey);
  if (names.length) {
    geminiModelCache = { at: Date.now(), names };
  }
  return names;
}

function pickGeminiModels(available) {
  const preferred = GEMINI_MODELS.filter((name) => available.includes(name));
  const flash = available.filter((name) => /flash/i.test(name) && !preferred.includes(name));
  const rest = available.filter((name) => !preferred.includes(name) && !flash.includes(name));
  return [...new Set([...preferred, ...flash, ...rest])];
}

async function generateWithGemini(prompt, modelName, apiKey) {
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2800,
      responseMimeType: "application/json",
    },
  };

  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
  ];

  let lastError = new Error(`Gemini model ${modelName} failed`);

  for (const url of urls) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = new Error(data?.error?.message || `Gemini ${modelName} HTTP ${response.status}`);
      continue;
    }
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("");
    if (text) return toPayload(text);
    lastError = new Error(`Gemini ${modelName} returned an empty response`);
  }

  throw lastError;
}

function friendlyAiError(err) {
  const message = err?.message || String(err);
  if (/quota|insufficient|billing|429/i.test(message)) {
    return "The AI provider hit a quota or billing limit. Check the API key plan.";
  }
  if (/api key|unauthorized|401|invalid/i.test(message)) {
    return "The AI API key was rejected. Set OPENAI_API_KEY on the Render service.";
  }
  if (/not found|404|not supported/i.test(message)) {
    return "The AI model is unavailable. The server will try a newer model on the next request.";
  }
  return "The AI assistant could not complete that request. Try again in a moment.";
}

export const generateResult = async (prompt) => {
  const clipped = clipAiPrompt(prompt);
  if (!clipped) {
    return JSON.stringify({ text: "Please send a prompt after @ai." });
  }
  if (isTrivialAiPrompt(clipped)) {
    return JSON.stringify({
      text: "Add a coding task after @ai, or tap a starter in the room. Short greetings do not call the model.",
    });
  }

  const errors = [];

  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateWithOpenAI(clipped);
    } catch (error) {
      console.error("OpenAI generation failed:", error.message);
      errors.push(error);
      if (/quota|insufficient|billing/i.test(error.message || "")) {
        // Skip extra OpenAI retries; Gemini is the fallback if configured.
      }
    }
  }

  if (process.env.GOOGLE_AI_KEY) {
    const apiKey = process.env.GOOGLE_AI_KEY;
    let modelNames = GEMINI_MODELS;
    try {
      const available = await cachedGeminiModels(apiKey);
      if (available.length) {
        modelNames = pickGeminiModels(available);
      }
    } catch (error) {
      console.error("Could not list Gemini models:", error.message);
    }

    for (const modelName of modelNames.slice(0, 3)) {
      try {
        return await generateWithGemini(clipped, modelName, apiKey);
      } catch (error) {
        console.error(`Gemini ${modelName} failed:`, error.message);
        errors.push(error);
      }
    }
  }

  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_KEY) {
    return JSON.stringify({
      text: "AI is not configured yet. Add OPENAI_API_KEY on the Render service (Environment), then restart it.",
    });
  }

  return JSON.stringify({
    text: process.env.OPENAI_API_KEY
      ? friendlyAiError(errors[errors.length - 1])
      : "The old Gemini model is retired. Add OPENAI_API_KEY in Render → Environment, save, wait for the service to restart, then send @ai again.",
  });
};
