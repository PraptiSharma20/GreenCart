
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

const vendorId = "6a1dc61fd2b15641c2e89e1d"; // vendor_test1

const createProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!\n");
    const product = new Product({
      name: "Vendor's Fresh Apples",
      category: "Fruits",
      price: 180,
      unit: "per kg",
      image: "https://images.unsplash.com/photo-1568702846914-96b305d216cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description: "Fresh, crisp apples from local farms.",
      inStock: true,
      vendor: vendorId,
      rating: 4.7,
      reviews: 42
    });
    const savedProduct = await product.save();
    console.log("✅ Product created successfully!");
    console.log(savedProduct);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error creating product:", error);
    process.exit(1);
  }
};

createProduct();
