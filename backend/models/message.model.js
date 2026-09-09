import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    sender: {
      _id: { type: String, required: true },
      email: { type: String, required: true },
    },
    attachment: {
      kind: { type: String, enum: ["image"] },
      name: String,
      mime: String,
      data: String,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("message", messageSchema);

export default Message;
