import mongoose from "mongoose";

mongoose.set("bufferCommands", true);
mongoose.set("bufferTimeoutMS", 25000);

let retryTimer = null;
let connecting = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scheduleRetry(ms = 5000) {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect();
  }, ms);
}

export default async function connect() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connecting || mongoose.connection.readyState === 2) {
    return false;
  }

  connecting = true;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    scheduleRetry(5000);
    return false;
  } finally {
    connecting = false;
  }
}

export async function waitForMongo(timeoutMs = 20000) {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (mongoose.connection.readyState !== 2) {
    connect();
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    await delay(400);
  }

  return mongoose.connection.readyState === 1;
}

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected — retrying");
  scheduleRetry(3000);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});
