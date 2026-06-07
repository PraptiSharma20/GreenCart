import Coupon from "../models/Coupon.js";
import { createNotification } from "../controllers/authController.js";
import { sendSMS } from "./sendSMS.js";

const ONLINE_METHODS = new Set(["card", "online", "razorpay", "upi"]);

export function isOnlinePaymentMethod(paymentMethod = "") {
  const m = String(paymentMethod).trim().toLowerCase();
  return ONLINE_METHODS.has(m) || m.includes("card") || m.includes("razorpay");
}

/** COD orders always visible; online only after successful payment */
export function buildCustomerOrdersQuery(userId) {
  return {
    user: userId,
    $or: [
      { paymentMethod: "cod" },
      { paymentMethod: { $exists: false } },
      { paymentStatus: "Paid" },
      { paymentStatus: "Refunded" },
    ],
  };
}

export function buildVendorOrdersQuery(vendorId) {
  return {
    "items.vendor": vendorId,
    $or: [
      { paymentMethod: "cod" },
      { paymentMethod: { $exists: false } },
      { paymentStatus: "Paid" },
      { paymentStatus: "Refunded" },
    ],
  };
}

export async function notifyVendorsNewOrder(order) {
  const vendorIds = [
    ...new Set(
      (order.items || [])
        .map((i) => i.vendor?.toString?.() || i.vendor)
        .filter(Boolean)
    ),
  ];
  const shortId = order._id.toString().slice(-6).toUpperCase();
  for (const vendorId of vendorIds) {
    try {
      await createNotification(
        vendorId,
        "order_update",
        "New Order Received!",
        `You have a new order of ₹${order.totalPrice} - Order #${shortId}`,
        order._id
      );
    } catch (err) {
      console.warn("Failed to create vendor notification:", err);
    }
  }
}

export async function sendCustomerOrderPlacedSms(order) {
  if (!order.phoneNumber) return;
  const shortId = order._id.toString().slice(-6).toUpperCase();
  const message = `Hi! Your GreenCart order #${shortId} for ₹${order.totalPrice} has been placed successfully. Thank you!`;
  await sendSMS(order.phoneNumber, message);
}

export async function revertCouponUsage(couponCode) {
  if (!couponCode) return;
  try {
    await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase() },
      { $inc: { usageCount: -1 } }
    );
  } catch (err) {
    console.warn("Failed to revert coupon usage:", err);
  }
}
