export const allowedOrigins = [
  process.env.CLIENT_URL,
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
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
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
