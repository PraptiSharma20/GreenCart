import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { sendSMS } from "../utils/sendSMS.js";
import { createNotification } from "./authController.js";
import {
  getPendingReviewItemsForUser,
  notifyReviewRequest,
} from "../utils/reviewHelpers.js";
import { notifyCustomerVendorCancelledOrder } from "../utils/vendorCancelNotify.js";
import { attachActionsToOrders } from "./orderActionController.js";
import {
  isOnlinePaymentMethod,
  buildCustomerOrdersQuery,
  notifyVendorsNewOrder,
  sendCustomerOrderPlacedSms,
} from "../utils/orderPaymentHelpers.js";

export const createOrder = async (req, res) => {
  try {
    const { items, totalPrice, shippingAddress, paymentMethod, phoneNumber, couponCode } = req.body;

    // Fetch product details to get vendor IDs
    const itemsWithVendors = await Promise.all(items.map(async (item) => {
      try {
        const product = await Product.findById(item.product);
        return {
          ...item,
          vendor: product ? product.vendor : null
        };
      } catch (err) {
        console.warn("Error fetching product for order item:", err);
        return { ...item, vendor: null };
      }
    }));

    const isOnline = isOnlinePaymentMethod(paymentMethod);

    const order = new Order({
      user: req.user.id,
      items: itemsWithVendors,
      totalPrice,
      shippingAddress,
      phoneNumber,
      paymentMethod,
      couponCode,
      status: "Pending",
      paymentStatus: isOnline ? "Pending" : "Pending",
    });
    const createdOrder = await order.save();

    // Increment coupon usage count if a coupon was used
    if (couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: couponCode.toUpperCase() },
          { $inc: { usageCount: 1 } }
        );
      } catch (couponErr) {
        console.warn("Failed to increment coupon usage count:", couponErr);
      }
    }

    // COD: notify customer & vendors immediately. Online: wait until Razorpay payment succeeds.
    if (!isOnline) {
      await sendCustomerOrderPlacedSms(createdOrder);
      await notifyVendorsNewOrder(createdOrder);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin' || req.user.role === 'vendor') {
      // For admin and vendor, show all orders
      // In a real app, we might filter vendor orders by items belonging to them
      orders = await Order.find({}).populate("user", "name email").populate("items.product").sort({ createdAt: -1 });
    } else {
      // For customers, show only their own orders
      orders = await Order.find(buildCustomerOrdersQuery(req.user.id))
        .populate("items.product", "name image price ratings")
        .sort({ createdAt: -1 });
    }
    if (orders?.length) {
      orders = await attachActionsToOrders(orders);
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (order && order.user.toString() === req.user.id) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      if (status === "Delivered" && oldStatus !== "Delivered") {
        order.deliveredAt = new Date();
      }
      if (status === "Cancelled" && oldStatus !== "Cancelled") {
        const isVendorActor =
          req.user.role === "vendor" || req.user.role === "admin";
        if (isVendorActor && !order.cancelledBy) {
          order.cancelledBy = "vendor";
          order.cancelledAt = new Date();
        }
      }
      await order.save();

      // Send SMS when vendor accepts order or status changes to Delivered
      if (order.phoneNumber) {
        let message = "";
        if (status === "Accepted" && oldStatus === "Pending") {
          message = `Great news! Your GreenCart order #${order._id.toString().slice(-6).toUpperCase()} has been accepted by the vendor and is being prepared.`;
        } else if (status === "Delivered") {
          message = `Your GreenCart order #${order._id.toString().slice(-6).toUpperCase()} has been delivered. Enjoy your fresh vegetables!`;
        }

        if (message) {
          await sendSMS(order.phoneNumber, message);
        }
      }

      // Create notification for customer (only on forward transitions)
      let notificationTitle = '';
      let notificationMessage = '';
      if (status === "Accepted" && oldStatus === "Pending") {
        notificationTitle = "Order Accepted!";
        notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} has been accepted by the vendor.`;
      } else if (status === "Out for Delivery" && oldStatus !== "Out for Delivery") {
        notificationTitle = "Order Out for Delivery!";
        notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} is out for delivery!`;
      } else if (status === "Delivered" && oldStatus !== "Delivered") {
        notificationTitle = "Order Delivered!";
        notificationMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered. Enjoy your fresh vegetables!`;
      }

      if (notificationTitle) {
        await createNotification(
          order.user,
          "order_update",
          notificationTitle,
          notificationMessage,
          order._id
        );
      }

      if (
        status === "Cancelled" &&
        oldStatus !== "Cancelled" &&
        order.cancelledBy === "vendor"
      ) {
        await notifyCustomerVendorCancelledOrder(order);
      }

      if (status === "Delivered" && oldStatus !== "Delivered") {
        await notifyReviewRequest(order);
      }

      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingReviews = async (req, res) => {
  try {
    if (req.user.role === "vendor" || req.user.role === "admin") {
      return res.json([]);
    }
    const pending = await getPendingReviewItemsForUser(req.user.id);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refundOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = "Refunded";
      await order.save();
      
      // Send SMS notification
      if (order.phoneNumber) {
        const message = `Your GreenCart order #${order._id.toString().slice(-6).toUpperCase()} has been refunded. The amount will be credited to your account shortly.`;
        await sendSMS(order.phoneNumber, message);
      }

      // Create notification for customer
      await createNotification(
        order.user,
        'order_update',
        'Order Refunded!',
        `Your order #${order._id.toString().slice(-6).toUpperCase()} has been refunded successfully.`,
        order._id
      );

      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
