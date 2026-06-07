
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!\n");
    const users = await User.find();
    console.log(`Found ${users.length} users:\n`);
    users.forEach(u => {
      console.log(`- ${u.name} (${u._id})`);
      console.log(`  Email: ${u.email}, Role: ${u.role}`);
      console.log(`  Phone: ${u.phoneNumber || 'N/A'}, Store: ${u.storeName || 'N/A'}\n`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error listing users:", error);
    process.exit(1);
  }
};

listUsers();
