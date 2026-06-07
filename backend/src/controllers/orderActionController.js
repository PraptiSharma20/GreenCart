import Order from "../models/Order.js";
import OrderAction from "../models/OrderAction.js";
import { createNotification } from "./authController.js";
import { sendSMS } from "../utils/sendSMS.js";

const CANCELLABLE = ["pending", "accepted", "preparing"];
import { isWithinReturnWindow, RETURN_WINDOW_HOURS } from "../utils/returnWindow.js";

const orderShortId = (order) => order._id.toString().slice(-6).toUpperCase();

const buildVendorMessage = (actionType, order, action) => {
  const typeLabel = actionType === "cancel" ? "cancelled" : "return requested";
  const qa = (action.questionnaire || [])
    .map((q) => `${q.question}: ${q.answer}`)
    .join(" | ");
  return `Order #${orderShortId(order)} was ${typeLabel} by the customer. Reason: ${action.reasonLabel}.${qa ? ` Details: ${qa}` : ""}${action.additionalComments ? ` Note: "${action.additionalComments}"` : ""}`;
};

const notifyOrderVendors = async (order, type, title, message) => {
  const vendorIds = [
    ...new Set(
      (order.items || [])
        .map((i) => i.vendor?.toString?.() || i.vendor)
        .filter(Boolean)
    ),
  ];
  for (const vendorId of vendorIds) {
    await createNotification(vendorId, type, title, message, order._id);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!CANCELLABLE.includes(order.status.toLowerCase())) {
      return res.status(400).json({
        message: "This order can no longer be cancelled. Contact support if you need help.",
      });
    }

    const { reasonCode, reasonLabel, additionalComments, questionnaire } = req.body;
    if (!reasonCode || !reasonLabel) {
      return res.status(400).json({ message: "Please select a cancellation reason" });
    }

    const refundAmount =
      order.paymentMethod?.toLowerCase() === "online" ? order.totalPrice : 0;

    const action = await OrderAction.create({
      order: order._id,
      user: req.user.id,
      actionType: "cancel",
      reasonCode,
      reasonLabel,
      additionalComments: additionalComments || "",
      questionnaire: questionnaire || [],
      status: "approved",
      refundAmount,
      processedAt: new Date(),
      vendorNotified: true,
    });

    order.status = "Cancelled";
    order.cancelledBy = "customer";
    order.cancelledAt = new Date();
    if (refundAmount > 0) {
      order.paymentStatus = "Refunded";
      order.refundAmount = refundAmount;
      order.refundedAt = new Date();
    }
    await order.save();

    const vendorMsg = buildVendorMessage("cancel", order, action);
    await notifyOrderVendors(
      order,
      "order_cancelled",
      `Order #${orderShortId(order)} cancelled`,
      vendorMsg
    );

    if (refundAmount > 0) {
      await createNotification(
        order.user,
        "refund_successful",
        "Refund successful",
        `₹${refundAmount.toFixed(2)} refunded for order #${orderShortId(order)}. It may take 5–7 business days to reflect in your account.`,
        order._id
      );
      if (order.phoneNumber) {
        await sendSMS(
          order.phoneNumber,
          `GreenCart: Refund of ₹${refundAmount} for order #${orderShortId(order)} is successful.`
        );
      }
    } else {
      await createNotification(
        order.user,
        "order_update",
        "Order cancelled",
        `Your order #${orderShortId(order)} has been cancelled successfully.`,
        order._id
      );
    }

    const populated = await Order.findById(order._id)
      .populate("items.product", "name image price ratings")
      .lean();
    populated.actionDetails = action;

    res.json(populated);
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const returnOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (order.status.toLowerCase() !== "delivered") {
      return res.status(400).json({
        message: "Returns are only available for delivered orders",
      });
    }

    if (!isWithinReturnWindow(order)) {
      return res.status(400).json({
        message: `Return window expired. Returns must be requested within ${RETURN_WINDOW_HOURS} hours of delivery.`,
      });
    }

    const existing = await OrderAction.findOne({
      order: order._id,
      actionType: "return",
      status: { $in: ["submitted", "approved"] },
    });
    if (existing) {
      return res.status(400).json({ message: "A return request already exists for this order" });
    }

    const { reasonCode, reasonLabel, additionalComments, questionnaire } = req.body;
    if (!reasonCode || !reasonLabel) {
      return res.status(400).json({ message: "Please select a return reason" });
    }

    const action = await OrderAction.create({
      order: order._id,
      user: req.user.id,
      actionType: "return",
      reasonCode,
      reasonLabel,
      additionalComments: additionalComments || "",
      questionnaire: questionnaire || [],
      status: "submitted",
      vendorNotified: true,
    });

    order.status = "Return Requested";
    await order.save();

    const vendorMsg = buildVendorMessage("return", order, action);
    await notifyOrderVendors(
      order,
      "order_return_requested",
      `Return requested — Order #${orderShortId(order)}`,
      vendorMsg
    );

    await createNotification(
      order.user,
      "order_update",
      "Return request submitted",
      `We received your return request for order #${orderShortId(order)}. The vendor will review it shortly.`,
      order._id
    );

    const populated = await Order.findById(order._id)
      .populate("items.product", "name image price ratings")
      .lean();
    populated.actionDetails = action;

    res.json(populated);
  } catch (error) {
    console.error("Return order error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const approveReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const vendorId = req.user.id.toString();
    const hasItems = order.items.some(
      (i) => (i.vendor?.toString?.() || i.vendor) === vendorId
    );
    if (!hasItems && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status.toLowerCase() !== "return requested") {
      return res.status(400).json({ message: "No return request pending for this order" });
    }

    const action = await OrderAction.findOne({
      order: order._id,
      actionType: "return",
      status: "submitted",
    }).sort({ createdAt: -1 });

    if (!action) {
      return res.status(404).json({ message: "Return request not found" });
    }

    const refundAmount = order.totalPrice;
    action.status = "approved";
    action.refundAmount = refundAmount;
    action.processedAt = new Date();
    await action.save();

    order.status = "Refunded";
    order.paymentStatus = "Refunded";
    order.refundAmount = refundAmount;
    order.refundedAt = new Date();
    await order.save();

    await createNotification(
      order.user,
      "refund_successful",
      "Refund successful",
      `₹${refundAmount.toFixed(2)} refunded for order #${orderShortId(order)}. Thank you for shopping with GreenCart.`,
      order._id
    );

    if (order.phoneNumber) {
      await sendSMS(
        order.phoneNumber,
        `GreenCart: Refund of ₹${refundAmount} for order #${orderShortId(order)} is successful.`
      );
    }

    res.json({ order, action });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const attachActionsToOrders = async (orders) => {
  if (!orders.length) return orders;
  const ids = orders.map((o) => o._id);
  const actions = await OrderAction.find({ order: { $in: ids } })
    .sort({ createdAt: -1 })
    .lean();

  const byOrder = {};
  for (const action of actions) {
    const key = action.order.toString();
    if (!byOrder[key]) byOrder[key] = action;
  }

  return orders.map((order) => {
    const doc = order.toObject ? order.toObject() : { ...order };
    doc.actionDetails = byOrder[doc._id.toString()] || null;
    return doc;
  });
};
