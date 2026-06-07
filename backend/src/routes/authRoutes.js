import express from "express";
import { 
  registerUser, 
  loginUser, 
  toggleWishlist, 
  getWishlist, 
  updateProfile, 
  getProfile, 
  addPayoutMethod, 
  removePayoutMethod, 
  setPrimaryPayoutMethod,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/wishlist", authMiddleware, toggleWishlist);
router.get("/wishlist", authMiddleware, getWishlist);
router.put("/profile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);
router.post("/payout", authMiddleware, addPayoutMethod);
router.delete("/payout", authMiddleware, removePayoutMethod);
router.put("/payout/primary", authMiddleware, setPrimaryPayoutMethod);

// Notification routes
router.get("/notifications", authMiddleware, getNotifications);
router.put("/notifications/:id/read", authMiddleware, markNotificationRead);
router.put("/notifications/mark-all-read", authMiddleware, markAllNotificationsRead);

export default router;