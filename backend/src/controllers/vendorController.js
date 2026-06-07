import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createNotification } from "./authController.js";
import { sendSMS } from "../utils/sendSMS.js";
import { scopeOrderForVendor, toIdString, itemBelongsToVendor } from "../utils/vendorScope.js";
import { notifyReviewRequest } from "../utils/reviewHelpers.js";
import { attachActionsToOrders } from "./orderActionController.js";
import {
  VENDOR_ALLOWED_STATUSES,
  isValidVendorStatusTransition,
} from "../utils/orderStatusWorkflow.js";
import { validateVendorRefund } from "../utils/vendorRefundRules.js";
import { buildVendorOrdersQuery } from "../utils/orderPaymentHelpers.js";
import { sanitizeProductsList } from "../utils/ratingHelpers.js";
import { notifyCustomerVendorCancelledOrder } from "../utils/vendorCancelNotify.js";

const CATEGORY_CHART_COLORS = {
  Vegetables: "#10b981",
  Fruits: "#f97316",
  Dairy: "#3b82f6",
  Grains: "#8b5cf6",
  "Root Vegetables": "#84cc16",
  "Leafy Greens": "#059669",
  "Green Vegetables": "#22c55e",
  "Seasonal Vegetables": "#14b8a6",
  Other: "#6b7280",
};

function buildVendorStatsBuckets(timeframe, now) {
  const buckets = [];
  const endNow = new Date(now);
  endNow.setHours(23, 59, 59, 999);

  switch (timeframe) {
    case "30d": {
      const rangeStart = new Date(now);
      rangeStart.setDate(now.getDate() - 30);
      rangeStart.setHours(0, 0, 0, 0);
      for (let i = 4; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 6);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 5);
        start.setHours(0, 0, 0, 0);
        if (start < rangeStart) start.setTime(rangeStart.getTime());
        buckets.push({
          key: `30d-${i}`,
          label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          start,
          end,
        });
      }
      break;
    }
    case "90d": {
      const rangeStart = new Date(now);
      rangeStart.setDate(now.getDate() - 90);
      rangeStart.setHours(0, 0, 0, 0);
      for (let i = 2; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 30);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        if (start < rangeStart) start.setTime(rangeStart.getTime());
        buckets.push({
          key: `90d-${i}`,
          label: start.toLocaleDateString("en-US", { month: "short" }),
          start,
          end,
        });
      }
      break;
    }
    case "1y": {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        let end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        if (i === 0) end = new Date(Math.min(end.getTime(), endNow.getTime()));
        buckets.push({
          key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
          label: start.toLocaleDateString("en-US", { month: "short" }),
          start,
          end,
        });
      }
      break;
    }
    case "7d":
    default: {
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        buckets.push({
          key: start.toISOString().slice(0, 10),
          label: start.toLocaleDateString("en-US", { weekday: "short" }),
          start,
          end,
        });
      }
      break;
    }
  }

  return buckets;
}

function findVendorStatsBucket(orderDate, buckets) {
  const t = new Date(orderDate).getTime();
  for (const bucket of buckets) {
    if (t >= bucket.start.getTime() && t <= bucket.end.getTime()) return bucket.key;
  }
  return null;
}

export const getVendorStats = async (req, res) => {
  try {
    const vendorId = toIdString(req.user.id);
    const timeframe = req.query.timeframe || "7d";
    const now = new Date();
    const buckets = buildVendorStatsBuckets(timeframe, now);
    const startDate = buckets[0]?.start ?? new Date(now.getTime() - 7 * 86400000);

    const totalProducts = await Product.countDocuments({ vendor: req.user.id });

    const orders = await Order.find({
      "items.vendor": req.user.id,
      createdAt: { $gte: startDate },
    }).populate("items.product", "category name");

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "Pending").length;

    let totalRevenue = 0;
    let totalRefunds = 0;
    const categoryMap = {};
    const periodStats = {};

    buckets.forEach((bucket) => {
      periodStats[bucket.key] = { revenue: 0, orders: 0, refunds: 0 };
    });

    orders.forEach((order) => {
      const bucketKey = findVendorStatsBucket(order.createdAt, buckets);
      if (!bucketKey || !periodStats[bucketKey]) return;

      const isRefunded =
        order.status === "Refunded" || order.paymentStatus === "Refunded";
      let hasVendorItems = false;

      order.items.forEach((item) => {
        if (!itemBelongsToVendor(item, vendorId)) return;
        hasVendorItems = true;
        const itemTotal = item.price * item.quantity;

        if (isRefunded) {
          totalRefunds += itemTotal;
          periodStats[bucketKey].refunds += itemTotal;
        } else {
          totalRevenue += itemTotal;
          periodStats[bucketKey].revenue += itemTotal;
          const category = item.product?.category || "Other";
          categoryMap[category] = (categoryMap[category] || 0) + itemTotal;
        }
      });

      if (hasVendorItems) {
        periodStats[bucketKey].orders += 1;
      }
    });

    const revenueHistory = buckets.map((bucket) => ({
      name: bucket.label,
      revenue: Math.round(periodStats[bucket.key]?.revenue || 0),
      orders: periodStats[bucket.key]?.orders || 0,
    }));

    const categoryStats = Object.entries(categoryMap)
      .map(([name, total]) => {
        const roundedTotal = Math.round(total);
        const percentage =
          totalRevenue > 0 ? Math.round((total / totalRevenue) * 100) : 0;
        return {
          name,
          value: percentage,
          color: CATEGORY_CHART_COLORS[name] || CATEGORY_CHART_COLORS.Other,
          total: roundedTotal,
        };
      })
      .sort((a, b) => b.total - a.total);

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      totalRefunds: Math.round(totalRefunds),
      pendingOrders,
      revenueHistory,
      categoryStats,
      timeframe,
    });
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = toIdString(req.user.id);
    const orders = await Order.find(buildVendorOrdersQuery(req.user.id))
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    // Each vendor sees only their line items and subtotal, not other vendors' products
    const scoped = orders.map((order) => scopeOrderForVendor(order, vendorId));
    const withActions = await attachActionsToOrders(scoped);
    res.json(withActions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!VENDOR_ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status for vendor update" });
    }

    // Check if vendor has items in this order
    const vendorId = toIdString(req.user.id);
    const hasVendorItems = order.items.some((item) => itemBelongsToVendor(item, vendorId));
    if (!hasVendorItems && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this order" });
    }

    const oldStatus = order.status;
    if (!isValidVendorStatusTransition(oldStatus, status)) {
      return res.status(400).json({
        message: "Cannot move order back to a previous status",
      });
    }

    if (status === "Out for Delivery" && oldStatus !== "Out for Delivery") {
      return res.status(400).json({
        message:
          "Assign a delivery partner before marking the order out for delivery",
      });
    }

    if (status === "Delivered" && oldStatus !== "Delivered") {
      if (!order.deliveryAssignment?.partnerReportedAt) {
        return res.status(400).json({
          message:
            "Confirm delivery partner reported delivery before marking as delivered",
        });
      }
    }

    order.status = status;
    if (status === "Delivered" && oldStatus !== "Delivered") {
      order.deliveredAt = new Date();
    }
    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      order.cancelledBy = "vendor";
      order.cancelledAt = new Date();
    }
    await order.save();

    // Create notification for customer
    let notificationTitle = '';
    let notificationMessage = '';
    if (status === "Accepted" && oldStatus !== "Accepted") {
      notificationTitle = "Order Accepted!";
      notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} has been accepted by the vendor and is being prepared.`;
    } else if (status === "Out for Delivery" && oldStatus !== "Out for Delivery") {
      notificationTitle = "Order Out for Delivery!";
      notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} is out for delivery!`;
    } else if (status === "Delivered" && oldStatus !== "Delivered") {
      notificationTitle = "Order Delivered!";
      notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered. Enjoy your fresh vegetables!`;
    }

    if (notificationTitle) {
      try {
        await createNotification(
          order.user,
          'order_update',
          notificationTitle,
          notificationMessage,
          order._id
        );
      } catch (notificationError) {
        console.warn("Error creating customer notification:", notificationError);
      }
    }

    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      try {
        await notifyCustomerVendorCancelledOrder(order);
      } catch (notificationError) {
        console.warn("Error notifying customer of vendor cancel:", notificationError);
      }
    }

    if (status === "Delivered" && oldStatus !== "Delivered") {
      await notifyReviewRequest(order);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVendorProducts = async (req, res) => {
  try {
    let products = await Product.find({ vendor: req.user.id })
      .populate("vendor", "name storeName")
      .populate("ratings.user", "name email role")
      .sort({ createdAt: -1 });
    products = await sanitizeProductsList(products);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refundVendorOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if vendor has items in this order
    const vendorId = toIdString(req.user.id);
    const hasVendorItems = order.items.some((item) => itemBelongsToVendor(item, vendorId));
    if (!hasVendorItems && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to refund this order" });
    }

    const refundCheck = validateVendorRefund(order);
    if (!refundCheck.allowed) {
      return res.status(400).json({ message: refundCheck.message });
    }

    order.status = "Refunded";
    order.paymentStatus = "Refunded";
    order.refundAmount = order.totalPrice;
    order.refundedAt = new Date();
    await order.save();
    
    // Send SMS notification
    if (order.phoneNumber) {
      try {
        const message = `Your GreenCart order #${order._id.toString().slice(-6).toUpperCase()} has been refunded. The amount will be credited to your account shortly.`;
        await sendSMS(order.phoneNumber, message);
      } catch (smsError) {
        console.warn("Failed to send refund SMS:", smsError);
      }
    }

    // Create notification for customer
    try {
      await createNotification(
        order.user,
        "refund_successful",
        "Refund successful",
        `₹${order.totalPrice.toFixed(2)} refunded for order #${order._id.toString().slice(-6).toUpperCase()}.`,
        order._id
      );
    } catch (notificationError) {
      console.warn("Failed to create refund notification:", notificationError);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
