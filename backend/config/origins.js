export const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://nexora-coding.vercel.app",
  "https://realaichatbotapp.vercel.app",
  "https://real-time-ai-powered-chat-app-with-mern-stack-and-google-gemini.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
].filter(Boolean);

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (protocol === "https:" && hostname.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
