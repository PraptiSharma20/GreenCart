import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin", "user"],
      default: "customer"
    },
    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "approved",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    ],
    phoneNumber: {
      type: String,
      default: ""
    },
    storeName: {
      type: String,
      default: ""
    },
    storeDescription: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: ""
    },
    languagesSpoken: {
      type: [String],
      default: []
    },
    pincode: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    payoutMethods: [
      {
        type: {
          type: String,
          enum: ["bank", "upi"],
          default: "bank"
        },
        bankName: String,
        accountHolder: String,
        accountNumber: String,
        upiId: String,
        isPrimary: {
          type: Boolean,
          default: false
        }
      }
    ],
    notifications: {
      orderUpdates: {
        type: Boolean,
        default: true
      },
      productReviews: {
        type: Boolean,
        default: true
      },
      paymentAlerts: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);