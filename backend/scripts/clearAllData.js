import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";
import Cart from "../src/models/Cart.js";
import Wishlist from "../src/models/Wishlist.js";
import Order from "../src/models/Order.js";
import Notification from "../src/models/Notification.js";

// Load environment variables
dotenv.config();

const clearAllData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete all products
    const productsDeleted = await Product.deleteMany({});
    console.log(`Deleted ${productsDeleted.deletedCount} products`);

    // Delete all carts
    const cartsDeleted = await Cart.deleteMany({});
    console.log(`Deleted ${cartsDeleted.deletedCount} carts`);

    // Delete all wishlists
    const wishlistsDeleted = await Wishlist.deleteMany({});
    console.log(`Deleted ${wishlistsDeleted.deletedCount} wishlists`);

    // Delete all orders
    const ordersDeleted = await Order.deleteMany({});
    console.log(`Deleted ${ordersDeleted.deletedCount} orders`);

    // Delete all notifications
    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`Deleted ${notificationsDeleted.deletedCount} notifications`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  }
};

// Run the script
clearAllData();
