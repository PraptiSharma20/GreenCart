import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  cancelPayment,
} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createRazorpayOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/cancel/:orderId", authMiddleware, cancelPayment);

export default router;
