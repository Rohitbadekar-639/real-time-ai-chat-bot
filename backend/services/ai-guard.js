const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map();
const inflight = new Set();

export function isTrivialAiPrompt(prompt) {
  const text = String(prompt || "").trim();
  if (text.length < 8) return true;
  return /^(hi+|hello|hey|yo|thanks|thank you|ok|okay|test)[\s!.]*$/i.test(text);
}

export function clipAiPrompt(prompt, max = 2000) {
  const text = String(prompt || "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max);
}

export function beginAiJob(userId) {
  const key = String(userId || "");
  if (!key) return false;
  if (inflight.has(key)) return false;
  inflight.add(key);
  return true;
}

export function endAiJob(userId) {
  inflight.delete(String(userId || ""));
}

export function assertAiBudget(userId) {
  const key = String(userId || "anon");
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    const retryMins = Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 60000));
    return { ok: false, retryMins };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, remaining: MAX_PER_WINDOW - recent.length };
}

export function sanitizeAttachment(raw) {
  if (!raw || typeof raw !== "object") return null;
  const mime = String(raw.mime || "").toLowerCase();
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowed.has(mime)) return null;

  let data = String(raw.data || "");
  const prefix = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;
  if (prefix.test(data)) {
    data = data.replace(prefix, "");
  }
  data = data.replace(/\s/g, "");
  if (!data || data.length > 1_100_000) return null;
  if (!/^[A-Za-z0-9+/]+=*$/.test(data)) return null;

  const name = String(raw.name || "image")
    .replace(/[^\w.\- ]+/g, "")
    .slice(0, 80) || "image";

  return { kind: "image", name, mime, data };
}
