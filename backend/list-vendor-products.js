
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

const vendorId = "6a1dc61fd2b15641c2e89e1d"; // vendor_test1

const listVendorProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!\n");
    const products = await Product.find({ vendor: vendorId }).populate('vendor', 'name email');
    console.log(`Found ${products.length} products for vendor ${vendorId}:\n`);
    products.forEach(p => {
      console.log(`- ${p.name} (${p._id})`);
      console.log(`  Price: ₹${p.price}, Category: ${p.category}, In Stock: ${p.inStock}`);
      console.log(`  Image: ${p.image}\n`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error listing vendor products:", error);
    process.exit(1);
  }
};

listVendorProducts();
