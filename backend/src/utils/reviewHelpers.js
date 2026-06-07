import Notification from "../models/Notification.js";
import { createNotification } from "./notificationHelpers.js";

export const toProductId = (item) => {
  const p = item?.product;
  if (!p) return null;
  return (p._id || p).toString();
};

export const isProductReviewedOnOrder = (order, productId) =>
  (order.reviewedProductIds || []).some((id) => id.toString() === productId);

/** One review prompt notification per delivered order (avoids duplicates). */
export const notifyReviewRequest = async (order) => {
  try {
    const Order = (await import("../models/Order.js")).default;
    const orderDoc = await Order.findById(order._id);
    if (!orderDoc || orderDoc.reviewNotificationSent) {
      return;
    }

    const existing = await Notification.findOne({
      userId: orderDoc.user,
      orderId: orderDoc._id,
      type: "review_request",
    });
    if (existing) {
      orderDoc.reviewNotificationSent = true;
      await orderDoc.save();
      return;
    }

    await createNotification(
      orderDoc.user,
      "review_request",
      "Order delivered — rate your products",
      `Order #${orderDoc._id.toString().slice(-6).toUpperCase()} was delivered. Open My Orders to rate what you received.`,
      orderDoc._id
    );

    orderDoc.reviewNotificationSent = true;
    await orderDoc.save();
  } catch (err) {
    console.warn("Failed to create review request notification:", err);
  }
};

export const getPendingReviewItemsForUser = async (userId) => {
  const Order = (await import("../models/Order.js")).default;
  const orders = await Order.find({ user: userId, status: "Delivered" })
    .populate("items.product", "name image ratings")
    .populate("items.product.ratings.user", "name role")
    .sort({ updatedAt: -1 });

  const pending = [];
  const seen = new Set();

  for (const order of orders) {
    for (const item of order.items || []) {
      const productId = toProductId(item);
      if (!productId || seen.has(`${order._id}-${productId}`)) continue;

      const product = item.product;
      const userRating = product?.ratings?.find((r) => {
        const reviewerId = r.user?._id || r.user;
        const reviewerRole = r.user?.role;
        if (reviewerRole && reviewerRole !== "customer") return false;
        return (
          reviewerId?.toString() === userId.toString() &&
          r.orderId?.toString() === order._id.toString()
        );
      });
      if (userRating) {
        continue;
      }

      seen.add(`${order._id}-${productId}`);
      pending.push({
        orderId: order._id,
        orderShortId: order._id.toString().slice(-6).toUpperCase(),
        productId,
        productName: product?.name || "Product",
        productImage: product?.image || "",
        deliveredAt: order.updatedAt,
      });
    }
  }

  return pending;
};

export const userHasDeliveredProduct = async (userId, productId, orderId = null) => {
  const Order = (await import("../models/Order.js")).default;
  const filter = { user: userId, status: "Delivered", "items.product": productId };
  if (orderId) filter._id = orderId;
  const order = await Order.findOne(filter);
  return !!order;
};

export const markOrderProductReviewed = async (orderId, productId) => {
  const Order = (await import("../models/Order.js")).default;
  await Order.findByIdAndUpdate(orderId, {
    $addToSet: { reviewedProductIds: productId },
  });
};
