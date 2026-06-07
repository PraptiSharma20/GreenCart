import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, default: "Admin" },
    targetType: { type: String, default: "" },
    targetId: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("AdminLog", adminLogSchema);
