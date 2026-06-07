
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.js";
import connectDB from "./src/config/db.js";

dotenv.config();
connectDB();

const clearOrders = async () => {
  try {
    await Order.deleteMany();
    console.log("All orders cleared!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

clearOrders();
