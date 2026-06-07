import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Query from "../models/Query.js";
import Coupon from "../models/Coupon.js";
import AdminLog from "../models/AdminLog.js";
import Announcement from "../models/Announcement.js";
import { createNotification } from "./authController.js";
import { logAdminAction } from "../utils/adminLog.js";

const revenueEligibleQuery = {
  status: { $nin: ["Cancelled"] },
  paymentStatus: { $ne: "Failed" },
};

export const getAdminInsights = async (req, res) => {
  try {
    const [
      recentOrders,
      recentUsers,
      recentProducts,
      pendingVendors,
      pendingCoupons,
      pendingQueries,
      pendingOrders,
    ] = await Promise.all([
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate("user", "name")
        .select("status totalPrice createdAt user")
        .lean(),
      User.find({}).sort({ createdAt: -1 }).limit(3).select("name role createdAt vendorStatus").lean(),
      Product.find({}).sort({ createdAt: -1 }).limit(3).select("name createdAt").lean(),
      User.countDocuments({ role: "vendor", vendorStatus: "pending" }),
      Coupon.countDocuments({ status: "pending" }),
      Query.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "Pending" }),
    ]);

    const refundPending = await Order.countDocuments({
      $or: [
        { status: "Return Requested" },
        { status: "Cancelled", paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" },
      ],
    });

    const activity = [
      ...recentOrders.map((o) => ({
        type: "order",
        id: o._id,
        title: `Order #${o._id.toString().slice(-6).toUpperCase()}`,
        subtitle: o.user?.name || "Guest",
        meta: o.status,
        amount: o.totalPrice,
        at: o.createdAt,
      })),
      ...recentUsers.map((u) => ({
        type: "user",
        id: u._id,
        title: u.name,
        subtitle: u.role,
        meta: u.role === "vendor" ? u.vendorStatus : "",
        at: u.createdAt,
      })),
      ...recentProducts.map((p) => ({
        type: "product",
        id: p._id,
        title: p.name,
        subtitle: "New product",
        at: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 12);

    const topVendors = await Order.aggregate([
      { $match: revenueEligibleQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.vendor",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const vendorIds = topVendors.map((v) => v._id).filter(Boolean);
    const vendorDocs = await User.find({ _id: { $in: vendorIds } }).select("name storeName email vendorStatus");
    const vendorMap = Object.fromEntries(vendorDocs.map((v) => [v._id.toString(), v]));

    const topProducts = await Order.aggregate([
      { $match: revenueEligibleQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldQty: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { soldQty: -1 } },
      { $limit: 5 },
    ]);

    const productIds = topProducts.map((p) => p._id).filter(Boolean);
    const productDocs = await Product.find({ _id: { $in: productIds } }).select("name image inStock stock");
    const productMap = Object.fromEntries(productDocs.map((p) => [p._id.toString(), p]));

    const allProducts = await Product.find({}).select("name inStock stock lowStockThreshold vendor").populate("vendor", "name storeName");
    const inventoryAlerts = allProducts
      .filter((p) => {
        if (p.stock != null && p.stock <= (p.lowStockThreshold ?? 5)) return true;
        return p.inStock === false;
      })
      .slice(0, 15)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        inStock: p.inStock,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        vendorName: p.vendor?.storeName || p.vendor?.name || "—",
      }));

    const coupons = await Coupon.find({});
    const couponAnalytics = {
      total: coupons.length,
      active: coupons.filter((c) => c.status === "active").length,
      pending: coupons.filter((c) => c.status === "pending").length,
      disabled: coupons.filter((c) => c.status === "disabled").length,
      totalRedemptions: coupons.reduce((s, c) => s + (c.usageCount || 0), 0),
    };

    res.json({
      activity,
      topVendors: topVendors.map((v) => ({
        vendorId: v._id,
        name: vendorMap[v._id?.toString()]?.storeName || vendorMap[v._id?.toString()]?.name || "Unknown",
        email: vendorMap[v._id?.toString()]?.email || "",
        revenue: Math.round(v.revenue || 0),
        orderCount: v.orderCount,
        vendorStatus: vendorMap[v._id?.toString()]?.vendorStatus,
      })),
      topProducts: topProducts.map((p) => ({
        productId: p._id,
        name: productMap[p._id?.toString()]?.name || "Unknown",
        soldQty: p.soldQty,
        revenue: Math.round(p.revenue || 0),
        inStock: productMap[p._id?.toString()]?.inStock,
      })),
      inventoryAlerts,
      notificationCounts: {
        pendingOrders,
        pendingQueries,
        pendingVendors,
        pendingCoupons,
        refundPending,
        lowStock: inventoryAlerts.length,
      },
      couponAnalytics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" })
      .select("-password")
      .sort({ createdAt: -1 });
    const vendorIds = vendors.map((v) => v._id);
    const stats = await Order.aggregate([
      { $match: { "items.vendor": { $in: vendorIds } } },
      { $unwind: "$items" },
      { $match: { "items.vendor": { $in: vendorIds } } },
      {
        $group: {
          _id: "$items.vendor",
          orders: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);
    const statsMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));
    res.json(
      vendors.map((v) => ({
        ...v.toObject(),
        orderCount: statsMap[v._id.toString()]?.orders || 0,
        revenue: Math.round(statsMap[v._id.toString()]?.revenue || 0),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid vendor status" });
    }
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }
    vendor.vendorStatus = status;
    if (status === "suspended") vendor.isSuspended = true;
    if (status === "approved") vendor.isSuspended = false;
    await vendor.save();

    if (status === "approved") {
      await createNotification(
        vendor._id,
        "admin_announcement",
        "Vendor account approved",
        "Your GreenCart vendor account is approved. You can now manage products and orders."
      );
    }

    await logAdminAction({
      action: `vendor_${status}`,
      actor: req.user,
      targetType: "vendor",
      targetId: vendor._id,
      details: vendor.email,
    });

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin" && req.body.isSuspended) {
      return res.status(400).json({ message: "Cannot suspend admin" });
    }
    if (typeof req.body.isSuspended === "boolean") {
      user.isSuspended = req.body.isSuspended;
    }
    if (req.body.role) user.role = req.body.role;
    await user.save();
    await logAdminAction({
      action: req.body.isSuspended ? "user_suspended" : "user_updated",
      actor: req.user,
      targetType: "user",
      targetId: user._id,
      details: user.email,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminNotificationCenter = async (req, res) => {
  try {
    const insights = await getAdminInsightsData();
    const items = [];
    if (insights.notificationCounts.pendingOrders > 0) {
      items.push({
        type: "orders",
        count: insights.notificationCounts.pendingOrders,
        label: "Pending orders",
        tab: "orders",
      });
    }
    if (insights.notificationCounts.pendingVendors > 0) {
      items.push({
        type: "vendors",
        count: insights.notificationCounts.pendingVendors,
        label: "Vendor approvals",
        tab: "vendors",
      });
    }
    if (insights.notificationCounts.pendingQueries > 0) {
      items.push({
        type: "queries",
        count: insights.notificationCounts.pendingQueries,
        label: "Support queries",
        tab: "queries",
      });
    }
    if (insights.notificationCounts.pendingCoupons > 0) {
      items.push({
        type: "coupons",
        count: insights.notificationCounts.pendingCoupons,
        label: "Coupon approvals",
        tab: "coupons",
      });
    }
    if (insights.notificationCounts.refundPending > 0) {
      items.push({
        type: "refunds",
        count: insights.notificationCounts.refundPending,
        label: "Refund requests",
        tab: "refunds",
      });
    }
    if (insights.notificationCounts.lowStock > 0) {
      items.push({
        type: "inventory",
        count: insights.notificationCounts.lowStock,
        label: "Low stock alerts",
        tab: "overview",
      });
    }
    res.json({ counts: insights.notificationCounts, items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function getAdminInsightsData() {
  const pendingVendors = await User.countDocuments({ role: "vendor", vendorStatus: "pending" });
  const pendingCoupons = await Coupon.countDocuments({ status: "pending" });
  const pendingQueries = await Query.countDocuments({ status: "pending" });
  const pendingOrders = await Order.countDocuments({ status: "Pending" });
  const refundPending = await Order.countDocuments({
    $or: [
      { status: "Return Requested" },
      { status: "Cancelled", paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" },
    ],
  });
  const allProducts = await Product.find({}).select("inStock stock lowStockThreshold");
  const lowStock = allProducts.filter((p) => {
    if (p.stock != null && p.stock <= (p.lowStockThreshold ?? 5)) return true;
    return p.inStock === false;
  }).length;
  return {
    notificationCounts: {
      pendingOrders,
      pendingQueries,
      pendingVendors,
      pendingCoupons,
      refundPending,
      lowStock,
    },
  };
}

export const getAdminRefunds = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { status: "Return Requested" },
        { status: "Refunded" },
        { status: "Cancelled", paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" },
      ],
    })
      .populate("user", "name email")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const processAdminRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    order.status = "Refunded";
    order.paymentStatus = "Refunded";
    order.refundAmount = order.totalPrice;
    order.refundedAt = new Date();
    await order.save();
    if (order.user) {
      await createNotification(
        order.user,
        "refund_successful",
        "Refund processed",
        `₹${(order.totalPrice || 0).toFixed(2)} refunded for order #${order._id.toString().slice(-6).toUpperCase()}.`,
        order._id
      );
    }
    await logAdminAction({
      action: "refund_processed",
      actor: req.user,
      targetType: "order",
      targetId: order._id,
      details: `₹${order.totalPrice}`,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const products = await Product.find({ "ratings.0": { $exists: true } })
      .populate("vendor", "name storeName")
      .populate("ratings.user", "name email")
      .select("name ratings vendor");
    const rows = [];
    for (const product of products) {
      for (const rating of product.ratings || []) {
        rows.push({
          ratingId: rating._id,
          productId: product._id,
          productName: product.name,
          vendorName: product.vendor?.storeName || product.vendor?.name,
          customerName: rating.user?.name || "Anonymous",
          customerEmail: rating.user?.email || "",
          rating: rating.rating,
          comment: rating.comment || "",
          ratedAt: rating.ratedAt,
        });
      }
    }
    rows.sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const before = product.ratings.length;
    product.ratings = product.ratings.filter(
      (r) => r._id.toString() !== req.params.ratingId
    );
    if (product.ratings.length === before) {
      return res.status(404).json({ message: "Review not found" });
    }
    const avg =
      product.ratings.length > 0
        ? product.ratings.reduce((s, r) => s + r.rating, 0) / product.ratings.length
        : 0;
    product.rating = Math.round(avg * 10) / 10;
    product.reviews = product.ratings.length;
    await product.save();
    await logAdminAction({
      action: "review_removed",
      actor: req.user,
      targetType: "product",
      targetId: product._id,
      details: req.params.ratingId,
    });
    res.json({ message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminReports = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();
    const productsCount = await Product.countDocuments();
    const revenueOrders = await Order.find(revenueEligibleQuery);
    const totalRevenue = revenueOrders.reduce((a, o) => a + (o.totalPrice || 0), 0);
    const vendors = await User.countDocuments({ role: "vendor" });
    const customers = await User.countDocuments({ role: "customer" });
    const byStatus = {};
    for (const s of ["Pending", "Accepted", "Delivered", "Cancelled", "Refunded"]) {
      byStatus[s] = await Order.countDocuments({ status: s });
    }
    const monthly = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);
    res.json({
      usersCount,
      ordersCount,
      productsCount,
      totalRevenue: Math.round(totalRevenue),
      vendors,
      customers,
      ordersByStatus: byStatus,
      monthly: monthly.map((row) => ({
        label: `${row._id.y}-${String(row._id.m).padStart(2, "0")}`,
        orders: row.orders,
        revenue: Math.round(row.revenue || 0),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCouponAnalytics = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).populate("vendorId", "name storeName").sort({ usageCount: -1 });
    res.json({
      total: coupons.length,
      active: coupons.filter((c) => c.status === "active").length,
      pending: coupons.filter((c) => c.status === "pending").length,
      disabled: coupons.filter((c) => c.status === "disabled").length,
      totalRedemptions: coupons.reduce((s, c) => s + (c.usageCount || 0), 0),
      topCoupons: coupons.slice(0, 10).map((c) => ({
        _id: c._id,
        code: c.code,
        status: c.status,
        usageCount: c.usageCount,
        vendorName: c.vendorId?.storeName || c.vendorId?.name,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, message, audience } = req.body;
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    const aud = ["all", "customers", "vendors"].includes(audience) ? audience : "all";
    let filter = {};
    if (aud === "customers") filter = { role: "customer" };
    if (aud === "vendors") filter = { role: "vendor" };
    const users = await User.find({ ...filter, role: { $ne: "admin" } }).select("_id");
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      audience: aud,
      createdBy: req.user._id,
      recipientCount: users.length,
    });
    for (const u of users) {
      await createNotification(u._id, "admin_announcement", title.trim(), message.trim());
    }
    await logAdminAction({
      action: "broadcast",
      actor: req.user,
      targetType: "announcement",
      targetId: announcement._id,
      details: `${aud} (${users.length} users)`,
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find({}).sort({ createdAt: -1 }).limit(20).lean();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
