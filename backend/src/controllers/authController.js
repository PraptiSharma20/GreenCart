import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import {
  markStaleOrderNotificationsRead,
  markNotificationGroupRead,
  deduplicateUnreadNotifications,
  createNotification,
} from "../utils/notificationHelpers.js";

export { createNotification };

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const safeRole = role === "vendor" ? "vendor" : "customer";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: safeRole,
      vendorStatus: safeRole === "vendor" ? "pending" : "approved",
    });

    if (safeRole === "vendor") {
      const { logAdminAction } = await import("../utils/adminLog.js");
      await logAdminAction({
        action: "vendor_registered",
        actor: null,
        targetType: "vendor",
        targetId: user._id,
        details: user.email,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist,
        phoneNumber: user.phoneNumber,
        storeName: user.storeName,
        storeDescription: user.storeDescription,
        address: user.address,
        gender: user.gender,
        languagesSpoken: user.languagesSpoken,
        pincode: user.pincode,
        city: user.city,
        state: user.state,
        payoutMethods: user.payoutMethods,
        notifications: user.notifications,
        vendorStatus: user.vendorStatus,
        isSuspended: user.isSuspended,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist,
        phoneNumber: user.phoneNumber,
        storeName: user.storeName,
        storeDescription: user.storeDescription,
        address: user.address,
        gender: user.gender,
        languagesSpoken: user.languagesSpoken,
        pincode: user.pincode,
        city: user.city,
        state: user.state,
        payoutMethods: user.payoutMethods,
        notifications: user.notifications,
        vendorStatus: user.vendorStatus,
        isSuspended: user.isSuspended,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    console.log("toggleWishlist called!");
    console.log("toggleWishlist - User ID from token:", req.user.id);
    const { productId } = req.body;
    console.log("toggleWishlist - Product ID from request:", productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log("toggleWishlist - Product not found!");
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create the user's wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    console.log("toggleWishlist - Found wishlist in DB:", wishlist);
    if (!wishlist) {
      console.log("toggleWishlist - Creating new wishlist document!");
      wishlist = new Wishlist({ userId: req.user.id, items: [] });
    }

    console.log("toggleWishlist - Original wishlist items:", wishlist.items);

    // Check if product already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      console.log("toggleWishlist - Removing product from wishlist");
      // Remove from wishlist
      wishlist.items.splice(existingItemIndex, 1);
    } else {
      console.log("toggleWishlist - Adding product to wishlist");
      // Add to wishlist
      wishlist.items.push({ productId });
    }

    await wishlist.save();

    console.log("toggleWishlist - Saved wishlist to DB:", wishlist);
    console.log("toggleWishlist - Final wishlist items:", wishlist.items);

    // Return just the product IDs (to maintain compatibility with frontend)
    const wishlistProductIds = wishlist.items.map((item) => item.productId);
    res.json({ wishlist: wishlistProductIds });
  } catch (error) {
    console.error("toggleWishlist error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getWishlist = async (req, res) => {
  try {
    console.log("getWishlist - User ID from token:", req.user.id);
    
    // Find user's wishlist and populate product details
    let wishlist = await Wishlist.findOne({ userId: req.user.id }).populate("items.productId");
    
    console.log("getWishlist - Wishlist document from DB:", wishlist);
    
    if (!wishlist) {
      console.log("getWishlist - No wishlist document found, returning empty array");
      return res.json([]);
    }

    console.log("getWishlist - Wishlist items from DB:", wishlist.items);

    // Filter out null/undefined products (deleted products)
    const validWishlistItems = wishlist.items.filter(item => {
      return item.productId && item.productId._id;
    });

    // Extract just the product objects
    const validProducts = validWishlistItems.map(item => item.productId);

    // Clean up invalid items in the DB
    if (validWishlistItems.length !== wishlist.items.length) {
      wishlist.items = validWishlistItems;
      await wishlist.save();
    }

    console.log("getWishlist - Valid products to return:", validProducts);

    res.json(validProducts);
  } catch (error) {
    console.error("getWishlist error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, storeName, storeDescription, address, notifications, gender, languagesSpoken, pincode, city, state } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Phone number validation
    if (phoneNumber) {
      const phoneRegex = /^[+\d\s-]*$/;
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Phone number can only contain digits, spaces, hyphens, and a leading +" });
      }
      if (digitsOnly.length < 10) {
        return res.status(400).json({ message: "Phone number must have at least 10 digits" });
      }
    }

    user.name = name || user.name;
    user.phoneNumber = phoneNumber !== undefined ? phoneNumber : user.phoneNumber;
    user.storeName = storeName !== undefined ? storeName : user.storeName;
    user.storeDescription = storeDescription !== undefined ? storeDescription : user.storeDescription;
    user.address = address !== undefined ? address : user.address;
    user.gender = gender !== undefined ? gender : user.gender;
    user.languagesSpoken = languagesSpoken !== undefined ? languagesSpoken : user.languagesSpoken;
    user.pincode = pincode !== undefined ? pincode : user.pincode;
    user.city = city !== undefined ? city : user.city;
    user.state = state !== undefined ? state : user.state;
    
    if (notifications) {
      user.notifications = {
        ...user.notifications,
        ...notifications
      };
    }

    const updatedUser = await user.save();
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      wishlist: updatedUser.wishlist,
      phoneNumber: updatedUser.phoneNumber,
      storeName: updatedUser.storeName,
      storeDescription: updatedUser.storeDescription,
      address: updatedUser.address,
      gender: updatedUser.gender,
      languagesSpoken: updatedUser.languagesSpoken,
      pincode: updatedUser.pincode,
      city: updatedUser.city,
      state: updatedUser.state,
      notifications: updatedUser.notifications,
      payoutMethods: updatedUser.payoutMethods
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPayoutMethod = async (req, res) => {
  try {
    const { type, bankName, accountHolder, accountNumber, upiId, isPrimary } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMethod = {
      type,
      bankName,
      accountHolder,
      accountNumber,
      upiId,
      isPrimary
    };

    if (isPrimary) {
      user.payoutMethods.forEach(method => {
        method.isPrimary = false;
      });
    }

    user.payoutMethods.push(newMethod);
    await user.save();

    res.json({ payoutMethods: user.payoutMethods });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removePayoutMethod = async (req, res) => {
  try {
    const { methodId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.payoutMethods = user.payoutMethods.filter(method => method._id.toString() !== methodId);
    await user.save();

    res.json({ payoutMethods: user.payoutMethods });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setPrimaryPayoutMethod = async (req, res) => {
  try {
    const { methodId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.payoutMethods.forEach(method => {
      method.isPrimary = method._id.toString() === methodId;
    });
    await user.save();

    res.json({ payoutMethods: user.payoutMethods });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get user's wishlist items (just product IDs for profile)
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    const wishlistProductIds = wishlist 
      ? wishlist.items.map(item => item.productId) 
      : [];

    console.log("getProfile - Wishlist product IDs:", wishlistProductIds);
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      wishlist: wishlistProductIds,
      phoneNumber: user.phoneNumber,
      storeName: user.storeName,
      storeDescription: user.storeDescription,
      address: user.address,
      gender: user.gender,
      languagesSpoken: user.languagesSpoken,
      pincode: user.pincode,
      city: user.city,
      state: user.state,
      notifications: user.notifications,
      payoutMethods: user.payoutMethods,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all notifications for user
export const getNotifications = async (req, res) => {
  try {
    await deduplicateUnreadNotifications(req.user.id);

    const notifications = await Notification.find({ userId: req.user.id })
      .populate("orderId")
      .populate("productId")
      .sort({ createdAt: -1 });

    await markStaleOrderNotificationsRead(notifications);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const markedCount = await markNotificationGroupRead(notification);
    notification.read = true;

    res.json({
      ...notification.toObject(),
      markedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
