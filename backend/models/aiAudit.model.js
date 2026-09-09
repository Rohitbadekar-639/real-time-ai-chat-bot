import mongoose from "mongoose";

const aiAuditSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    email: { type: String },
    projectId: { type: String, index: true },
    promptChars: { type: Number, default: 0 },
    provider: { type: String, default: "none" },
    outcome: { type: String, default: "ok" },
  },
  { timestamps: true }
);

aiAuditSchema.index({ createdAt: -1 });

const AiAudit = mongoose.model("aiAudit", aiAuditSchema);

export async function recordAiAudit(entry) {
  try {
    await AiAudit.create(entry);
  } catch (error) {
    console.error("AI audit write failed:", error.message);
  }
}

export default AiAudit;
