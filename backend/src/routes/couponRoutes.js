
import express from "express";
import {
  createCoupon,
  getVendorCoupons,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  approveCoupon,
  disableCoupon,
  getActiveCoupons,
  getActiveCouponsCount,
  getCouponByCode
} from "../controllers/couponController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import vendorMiddleware from "../middleware/vendorMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Customer routes (public)
router.get("/active", getActiveCoupons);
router.get("/active/count", getActiveCouponsCount);
router.get("/code/:code", getCouponByCode);

// Vendor routes (protected)
router.post("/", authMiddleware, vendorMiddleware, createCoupon);
router.get("/vendor", authMiddleware, vendorMiddleware, getVendorCoupons);
router.put("/:id", authMiddleware, vendorMiddleware, updateCoupon);
router.delete("/:id", authMiddleware, vendorMiddleware, deleteCoupon);

// Admin routes (protected)
router.get("/admin", authMiddleware, adminMiddleware, getAllCoupons);
router.put("/:id/approve", authMiddleware, adminMiddleware, approveCoupon);
router.put("/:id/disable", authMiddleware, adminMiddleware, disableCoupon);

export default router;
