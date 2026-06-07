import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: [
        "order_update",
        "product_review",
        "payment_alert",
        "review_request",
        "vendor_thanks",
        "order_cancelled",
        "order_cancelled_by_vendor",
        "order_return_requested",
        "refund_successful",
        "support_reply",
        "admin_announcement",
      ], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, orderId: 1, title: 1 });

export default mongoose.model("Notification", notificationSchema);
