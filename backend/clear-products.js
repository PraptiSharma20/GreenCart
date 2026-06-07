
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import connectDB from "./src/config/db.js";

dotenv.config();
connectDB();

const clearProducts = async () => {
  try {
    await Product.deleteMany();
    console.log("All Products Cleared!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

clearProducts();
