import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ProjectModel from "./models/project.model.js";
import Message from "./models/message.model.js";
import { generateResult } from "./services/ai.service.js";
import { isAllowedOrigin } from "./config/origins.js";

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    socket.project = await ProjectModel.findById(projectId);

    if (!socket.project) {
      return next(new Error("Project not found"));
    }

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
});

async function persistMessage({ projectId, message, sender }) {
  try {
    await Message.create({
      project: projectId,
      message,
      sender: {
        _id: String(sender?._id || "unknown"),
        email: sender?.email || "unknown",
      },
    });
  } catch (error) {
    console.error("Failed to persist message:", error.message);
  }
}

io.on("connection", async (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log("a user connected");
  socket.join(socket.roomId);

  try {
    const history = await Message.find({ project: socket.project._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    socket.emit("message-history", history);
  } catch (error) {
    console.error("Failed to load message history:", error.message);
  }

  socket.on("project-message", async (data) => {
    const message = data?.message;
    if (!message || !String(message).trim()) {
      return;
    }

    const payload = {
      message,
      sender: data.sender || {
        _id: socket.user._id,
        email: socket.user.email,
      },
    };

    socket.broadcast.to(socket.roomId).emit("project-message", payload);
    await persistMessage({
      projectId: socket.project._id,
      message,
      sender: payload.sender,
    });

    const aiIsPresentInMessage = message.includes("@ai");
    if (!aiIsPresentInMessage) {
      return;
    }

    const prompt = message.replace(/@ai/gi, "").trim();

    try {
      const result = await generateResult(prompt);
      const aiPayload = {
        message: result,
        sender: {
          _id: "ai",
          email: "AI",
        },
      };
      io.to(socket.roomId).emit("project-message", aiPayload);
      await persistMessage({
        projectId: socket.project._id,
        message: result,
        sender: aiPayload.sender,
      });

      try {
        const parsed = JSON.parse(result);
        if (parsed?.fileTree && typeof parsed.fileTree === "object") {
          await ProjectModel.findByIdAndUpdate(socket.project._id, {
            fileTree: parsed.fileTree,
          });
        }
      } catch (persistTreeError) {
        console.error("Failed to persist file tree:", persistTreeError.message);
      }
    } catch (error) {
      console.error("AI generation failed:", error.message);
      const aiPayload = {
        message: JSON.stringify({
          text: "The AI assistant hit a snag. Please try again in a moment.",
        }),
        sender: {
          _id: "ai",
          email: "AI",
        },
      };
      io.to(socket.roomId).emit("project-message", aiPayload);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
