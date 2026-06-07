import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Wishlist from "./src/models/Wishlist.js";

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
    
    console.log("\n1. Removing user.wishlist fields from all users...");
    await User.updateMany({}, { $unset: { wishlist: 1 } });
    
    console.log("\n2. Clearing any existing Wishlist documents...");
    await Wishlist.deleteMany({});
    
    console.log("\n✅ Wishlist cleanup complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
};

cleanup();
