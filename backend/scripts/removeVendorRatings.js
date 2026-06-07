/**
 * Removes product reviews left by vendor/admin accounts (e.g. vendor_test1).
 * Recalculates product rating averages.
 *
 * Usage: node scripts/removeVendorRatings.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";
import Notification from "../src/models/Notification.js";
import { recalculateRatingStats } from "../src/utils/ratingHelpers.js";

dotenv.config();

const removeVendorRatings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const blockedUsers = await User.find({
      role: { $in: ["vendor", "admin"] },
    }).select("_id name email role");

    const blockedIds = new Set(blockedUsers.map((u) => u._id.toString()));
    console.log(
      "Blocked reviewer accounts:",
      blockedUsers.map((u) => `${u.name} (${u.role})`).join(", ") || "(none)"
    );

    const products = await Product.find({});
    let productsUpdated = 0;
    let ratingsRemoved = 0;

    for (const product of products) {
      const before = product.ratings.length;
      product.ratings = product.ratings.filter(
        (r) => !blockedIds.has(r.user.toString())
      );
      const removed = before - product.ratings.length;
      if (removed > 0) {
        ratingsRemoved += removed;
        const stats = recalculateRatingStats(product.ratings);
        product.rating = stats.rating;
        product.reviews = stats.reviews;
        await product.save();
        productsUpdated += 1;
        console.log(`  ${product.name}: removed ${removed} invalid review(s)`);
      }
    }

    const notifResult = await Notification.deleteMany({
      type: "product_review",
      userId: { $in: [...blockedIds] },
    });

    console.log("\nDone.");
    console.log(`Products updated: ${productsUpdated}`);
    console.log(`Ratings removed: ${ratingsRemoved}`);
    console.log(`Misrouted notifications deleted: ${notifResult.deletedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
};

removeVendorRatings();
