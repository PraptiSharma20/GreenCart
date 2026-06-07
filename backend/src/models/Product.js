import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    unit: { type: String, default: "per kg" },
    image: String,
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    stock: { type: Number, default: null },
    lowStockThreshold: { type: Number, default: 5 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: { type: String, default: "" },
        surveyAnswers: [
          {
            question: { type: String, default: "" },
            answer: { type: String, default: "" },
          },
        ],
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        vendorResponse: { type: String, default: "" },
        vendorResponseDate: { type: Date },
        vendorThanked: { type: Boolean, default: false },
        ratedAt: { type: Date, default: Date.now }
      }
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);