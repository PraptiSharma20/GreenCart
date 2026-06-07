
import mongoose from "mongoose";
import dotenv from "dotenv";
import Cart from "./src/models/Cart.js";

dotenv.config();

const clearCarts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const result = await Cart.deleteMany({});
    console.log(`Cleared ${result.deletedCount} carts`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error clearing carts:", error);
    process.exit(1);
  }
};

clearCarts();

