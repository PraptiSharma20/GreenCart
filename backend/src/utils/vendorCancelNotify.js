import { createNotification } from "../controllers/authController.js";
import { sendSMS } from "./sendSMS.js";

export function orderShortId(order) {
  return order._id.toString().slice(-6).toUpperCase();
}

/** Short, friendly copy when a vendor cancels a customer order */
export function buildVendorCancelCustomerMessages(order) {
  const id = orderShortId(order);
  return {
    title: "Vendor couldn't take your order",
    message: `Sorry — the vendor can't take order #${id} right now due to operational reasons. We apologize for the inconvenience.`,
    sms: `GreenCart: Order #${id} was cancelled — the vendor can't take this order at the moment. Sorry for the inconvenience.`,
  };
}

export async function notifyCustomerVendorCancelledOrder(order) {
  const { title, message, sms } = buildVendorCancelCustomerMessages(order);

  await createNotification(
    order.user,
    "order_cancelled_by_vendor",
    title,
    message,
    order._id
  );

  if (order.phoneNumber) {
    try {
      await sendSMS(order.phoneNumber, sms);
    } catch (err) {
      console.warn("Vendor cancel SMS failed:", err?.message || err);
    }
  }
}
