import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ vendor: 1, phone: 1 });

export default mongoose.model("DeliveryPartner", deliveryPartnerSchema);
