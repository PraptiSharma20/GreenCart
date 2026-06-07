import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";

// Load environment variables
dotenv.config();

const deleteAllProducts = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete all products
    const result = await Product.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} products!`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error deleting products:", error);
    process.exit(1);
  }
};

// Run the script
deleteAllProducts();
