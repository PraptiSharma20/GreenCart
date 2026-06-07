import mongoose from "mongoose";

const orderActionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionType: {
      type: String,
      enum: ["cancel", "return"],
      required: true,
    },
    reasonCode: { type: String, required: true },
    reasonLabel: { type: String, required: true },
    additionalComments: { type: String, default: "" },
    questionnaire: [
      {
        question: String,
        answer: String,
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "approved", "rejected"],
      default: "submitted",
    },
    refundAmount: { type: Number },
    processedAt: { type: Date },
    vendorNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("OrderAction", orderActionSchema);
