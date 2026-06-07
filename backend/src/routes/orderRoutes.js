import express from "express";
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, getPendingReviews } from "../controllers/orderController.js";
import { cancelOrder, returnOrder } from "../controllers/orderActionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/pending-reviews", authMiddleware, getPendingReviews);
router.post("/:id/cancel", authMiddleware, cancelOrder);
router.post("/:id/return", authMiddleware, returnOrder);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id/status", authMiddleware, updateOrderStatus);

export default router;
