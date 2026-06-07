
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";
import User from "./src/models/User.js";

dotenv.config();

const listProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!\n");
    const products = await Product.find().populate('vendor', 'name email');
    console.log(`Found ${products.length} products:\n`);
    products.forEach(p => {
      console.log(`- ${p.name} (${p._id})`);
      console.log(`  Price: ₹${p.price}, Category: ${p.category}, In Stock: ${p.inStock}`);
      console.log(`  Vendor: ${p.vendor ? p.vendor.name : 'No vendor'}, Vendor ID: ${p.vendor}`);
      console.log(`  Image: ${p.image}\n`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error listing products:", error);
    process.exit(1);
  }
};

listProducts();
