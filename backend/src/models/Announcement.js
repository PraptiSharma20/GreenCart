import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: {
      type: String,
      enum: ["all", "customers", "vendors"],
      default: "all",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
