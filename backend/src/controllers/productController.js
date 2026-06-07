import Product from "../models/Product.js";
import { createNotification } from "../utils/notificationHelpers.js";
import { localizeProductDoc } from "../i18n/catalog.js";
import { stripProductOwnershipFields, toIdString } from "../utils/vendorScope.js";
import Order from "../models/Order.js";
import {
  markOrderProductReviewed,
  userHasDeliveredProduct,
} from "../utils/reviewHelpers.js";
import {
  getBlockedReviewerIds,
  sanitizeProductRatings,
  sanitizeProductsList,
} from "../utils/ratingHelpers.js";
import User from "../models/User.js";

export const getProducts = async (req, res) => {
  try {
    const { vendor, category, minPrice, maxPrice, minRating, search, lang } = req.query;
    const filter = {};
    
    if (vendor) filter.vendor = vendor;
    const allCats = ["All Vegetables", "All Products"];
    if (category && !allCats.includes(category)) {
      filter.category =
        category === "Seasonal Products"
          ? { $in: ["Seasonal Products", "Seasonal Vegetables"] }
          : category;
    }
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } }, // case-insensitive search on name
        { description: { $regex: search, $options: "i" } }, // case-insensitive search on description
        { category: { $regex: search, $options: "i" } } // case-insensitive search on category
      ];
    }
    
    let products = await Product.find(filter)
      .populate("vendor", "name storeName")
      .populate("ratings.user", "name role");
    products = await sanitizeProductsList(products);
    if (lang && lang !== "en") {
      products = products.map((p) => localizeProductDoc(p, lang));
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const requestedVendor = req.body.vendor;
    const safeBody = stripProductOwnershipFields(req.body);
    const ownerId =
      req.user.role === "admin" && requestedVendor
        ? requestedVendor
        : req.user.id;
    const product = new Product({
      ...safeBody,
      vendor: ownerId,
      rating: 0,
      reviews: 0,
      ratings: [],
    });
    let createdProduct = await product.save();
    // Populate vendor name before sending back
    createdProduct = await createdProduct.populate("vendor", "name");
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { lang } = req.query;
    let product = await Product.findById(req.params.id)
      .populate("vendor", "name storeName")
      .populate("ratings.user", "name role");
    if (product) {
      const blockedIds = await getBlockedReviewerIds();
      product = sanitizeProductRatings(product, blockedIds);
      if (lang && lang !== "en") {
        product = localizeProductDoc(product, lang);
      }
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (toIdString(product.vendor) !== toIdString(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this product" });
    }

    Object.assign(product, stripProductOwnershipFields(req.body));
    const updatedProduct = await product.save();
    await updatedProduct.populate("vendor", "name");
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Authorization check
    if (toIdString(product.vendor) !== toIdString(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, orderId, surveyAnswers } = req.body;
    const userId = req.user.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const reviewer = await User.findById(userId).select("role");
    if (!reviewer || reviewer.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can leave product reviews. Vendor accounts cannot rate products.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (toIdString(product.vendor) === toIdString(userId)) {
      return res.status(403).json({ message: "You cannot rate your own product" });
    }

    if (!orderId) {
      return res.status(400).json({
        message: "Submit your review from My Orders after delivery",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: "Delivered",
    });
    if (!order) {
      return res.status(400).json({ message: "Invalid order for this review" });
    }
    const inOrder = order.items.some(
      (item) => (item.product?._id || item.product)?.toString() === id
    );
    if (!inOrder) {
      return res.status(400).json({ message: "This product was not in that order" });
    }

    const existingRatingIndex = product.ratings.findIndex(
      (r) =>
        r.user.toString() === userId &&
        r.orderId?.toString() === orderId.toString()
    );
    const isNewReview = existingRatingIndex === -1;

    const hasPurchase = await userHasDeliveredProduct(userId, id, orderId);
    if (!hasPurchase) {
      return res.status(403).json({
        message: "You can only review products from delivered orders",
      });
    }

    const normalizedSurvey = Array.isArray(surveyAnswers)
      ? surveyAnswers
          .filter((s) => s?.question && s?.answer)
          .map((s) => ({ question: String(s.question), answer: String(s.answer) }))
      : [];

    if (existingRatingIndex !== -1) {
      product.ratings[existingRatingIndex].rating = rating;
      if (comment !== undefined) {
        product.ratings[existingRatingIndex].comment = comment;
      }
      if (normalizedSurvey.length) {
        product.ratings[existingRatingIndex].surveyAnswers = normalizedSurvey;
      }
      product.ratings[existingRatingIndex].orderId = orderId;
    } else {
      product.ratings.push({
        user: userId,
        rating,
        comment: comment || "",
        surveyAnswers: normalizedSurvey,
        orderId,
      });
    }

    await markOrderProductReviewed(orderId, id);

    // Recalculate average rating
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.rating = product.ratings.length > 0 ? totalRating / product.ratings.length : 0;
    product.reviews = product.ratings.length;

    await product.save();
    await product.populate("vendor", "name");
    await product.populate("ratings.user", "name role");

    const blockedIds = await getBlockedReviewerIds();
    const sanitized = sanitizeProductRatings(product, blockedIds);

    // Create notification for vendor if this is a new review
    if (isNewReview) {
      const finalRatingIndex = product.ratings.findIndex(r => r.user.toString() === userId);
      const entry = product.ratings[finalRatingIndex];
      const reviewerName = entry?.user?.name || "A customer";
      const surveyText = (entry?.surveyAnswers || [])
        .map((s) => `${s.question}: ${s.answer}`)
        .join(" · ");
      const reviewBody = [surveyText, comment ? `Review: "${comment}"` : ""]
        .filter(Boolean)
        .join(" — ");
      await createNotification(
        product.vendor,
        "product_review",
        `${reviewerName} reviewed ${product.name}`,
        `${reviewerName} gave ${rating} stars${reviewBody ? `. ${reviewBody}` : ""}`,
        orderId,
        product._id
      );
    }

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { id, ratingId } = req.params;
    const { response } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the product's vendor
    if (toIdString(product.vendor) !== toIdString(userId)) {
      return res.status(403).json({ message: "Only product vendor can respond to reviews" });
    }

    const rating = product.ratings.id(ratingId);
    if (!rating) {
      return res.status(404).json({ message: "Review not found" });
    }

    rating.vendorResponse = response;
    rating.vendorResponseDate = new Date();
    rating.vendorThanked = true;

    await product.save();

    const refreshed = await Product.findById(id)
      .populate("vendor", "name storeName")
      .populate("ratings.user", "name email");

    const ratingEntry = refreshed.ratings.id(ratingId);
    const customerId = toIdString(ratingEntry?.user?._id || ratingEntry?.user);
    const vendorId = toIdString(refreshed.vendor?._id || refreshed.vendor);

    if (!customerId) {
      return res.status(400).json({ message: "Could not find the customer who wrote this review" });
    }
    if (customerId === vendorId) {
      return res.status(400).json({ message: "Invalid review: reviewer is not a customer" });
    }

    const customerName = ratingEntry.user?.name || "Customer";
    const vendorName =
      refreshed.vendor?.storeName || refreshed.vendor?.name || "Vendor";

    await createNotification(
      customerId,
      "vendor_thanks",
      `${vendorName} thanked ${customerName}`,
      `${vendorName} appreciated your review for ${refreshed.name}: "${response}"`,
      ratingEntry.orderId || undefined,
      refreshed._id
    );

    res.json(refreshed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetAllProductRatings = async (req, res) => {
  try {
    // Only allow admin to reset ratings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Reset all products
    await Product.updateMany({}, {
      $set: {
        rating: 0,
        reviews: 0,
        ratings: []
      }
    });
    
    res.json({ message: "All product ratings reset successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
