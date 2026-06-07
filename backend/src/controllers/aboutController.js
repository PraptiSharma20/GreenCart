import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// @desc    Public stats for About page
// @route   GET /api/about/stats
// @access  Public
export const getAboutStats = async (req, res) => {
  try {
    const [vendorsCount, customersCount, productsCount, deliveredOrders, products] =
      await Promise.all([
        User.countDocuments({ role: "vendor" }),
        User.countDocuments({ role: "customer" }),
        Product.countDocuments(),
        Order.countDocuments({ status: "Delivered" }),
        Product.find({}, "name category description inStock rating"),
      ]);

    const organicCount = products.filter(
      (p) =>
        /organic/i.test(p.name || "") ||
        /organic/i.test(p.category || "") ||
        /organic/i.test(p.description || "")
    ).length;

    const inStockCount = products.filter((p) => p.inStock).length;
    const organicPercent = products.length
      ? Math.round((organicCount / products.length) * 100)
      : 0;
    const freshAvailabilityPercent = products.length
      ? Math.round((inStockCount / products.length) * 100)
      : 100;

    const rated = products.filter((p) => (p.rating || 0) > 0);
    const averageRating =
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, p) => sum + p.rating, 0) / rated.length) * 10
          ) / 10
        : 0;

    res.json({
      vendorsCount,
      customersCount,
      productsCount,
      deliveredOrders,
      organicPercent,
      freshAvailabilityPercent,
      averageRating,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const POLICY_LAST_UPDATED =
  process.env.PRIVACY_LAST_UPDATED || "2026-06-03T00:00:00.000Z";

const TERMS_LAST_UPDATED =
  process.env.TERMS_LAST_UPDATED || "2026-06-03T00:00:00.000Z";

async function getLegalCounts() {
  const [customersCount, vendorsCount, ordersCount, productsCount] =
    await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "vendor" }),
      Order.countDocuments(),
      Product.countDocuments(),
    ]);
  return { customersCount, vendorsCount, ordersCount, productsCount };
}

// @desc    Privacy policy metadata (public)
// @route   GET /api/about/privacy
// @access  Public
export const getPrivacyMeta = async (req, res) => {
  try {
    const counts = await getLegalCounts();
    res.json({
      lastUpdated: POLICY_LAST_UPDATED,
      version: "1.1",
      ...counts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Terms of service metadata (public)
// @route   GET /api/about/terms
// @access  Public
export const getTermsMeta = async (req, res) => {
  try {
    const counts = await getLegalCounts();
    res.json({
      lastUpdated: TERMS_LAST_UPDATED,
      version: "1.0",
      ...counts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
