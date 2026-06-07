import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        quantity: Number,
        price: Number
      }
    ],
    totalPrice: Number,
    shippingAddress: String,
    phoneNumber: String,
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Return Requested",
        "Cancelled",
        "Refunded",
      ],
      default: "Pending",
    },
    refundAmount: { type: Number },
    refundedAt: { type: Date },
    deliveredAt: { type: Date },
    couponCode: String,
    reviewedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    reviewNotificationSent: { type: Boolean, default: false },
    cancelledBy: {
      type: String,
      enum: ["customer", "vendor", "system"],
    },
    cancelledAt: { type: Date },
    deliveryAssignment: {
      deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryPartner",
      },
      partnerName: { type: String, trim: true },
      partnerPhone: { type: String, trim: true },
      partnerEmail: { type: String, trim: true },
      notes: { type: String, trim: true },
      assignedAt: { type: Date },
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      outForDeliveryAt: { type: Date },
      partnerReportedAt: { type: Date },
      partnerReportedVia: {
        type: String,
        enum: ["vendor_confirmed"],
        default: "vendor_confirmed",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);