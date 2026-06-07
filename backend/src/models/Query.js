import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    contactType: { 
      type: String, 
      enum: ["Vendor", "Client"], 
      required: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    replies: [
      {
        message: { type: String, required: true },
        adminName: { type: String, default: "Admin" },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Query", querySchema);
