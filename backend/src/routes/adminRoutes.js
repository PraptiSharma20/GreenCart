import express from "express";
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/adminController.js";
import {
  getAdminInsights,
  getAdminVendors,
  updateVendorStatus,
  updateUserAccount,
  getAdminNotificationCenter,
  getAdminRefunds,
  processAdminRefund,
  getAdminReviews,
  deleteAdminReview,
  getAdminLogs,
  getAdminReports,
  getCouponAnalytics,
  broadcastAnnouncement,
  getAnnouncements,
} from "../controllers/adminExtendedController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

router.get("/insights", getAdminInsights);
router.get("/vendors", getAdminVendors);
router.put("/vendors/:id/status", updateVendorStatus);
router.put("/users/:id/account", updateUserAccount);
router.get("/notifications", getAdminNotificationCenter);
router.get("/refunds", getAdminRefunds);
router.put("/refunds/:id/process", processAdminRefund);
router.get("/reviews", getAdminReviews);
router.delete("/reviews/:productId/:ratingId", deleteAdminReview);
router.get("/logs", getAdminLogs);
router.get("/reports", getAdminReports);
router.get("/coupon-analytics", getCouponAnalytics);
router.post("/broadcast", broadcastAnnouncement);
router.get("/announcements", getAnnouncements);

export default router;
