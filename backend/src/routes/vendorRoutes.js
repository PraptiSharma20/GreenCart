import express from "express";
import { 
  getVendorStats, 
  getVendorOrders, 
  updateVendorOrderStatus, 
  getVendorProducts,
  refundVendorOrder
} from "../controllers/vendorController.js";
import { approveReturn } from "../controllers/orderActionController.js";
import {
  listDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  dispatchOrderWithPartner,
  confirmPartnerDelivery,
} from "../controllers/deliveryPartnerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import vendorMiddleware from "../middleware/vendorMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(vendorMiddleware);

router.get("/stats", getVendorStats);
router.get("/orders", getVendorOrders);
router.put("/orders/:id/status", updateVendorOrderStatus);
router.put("/orders/:id/refund", refundVendorOrder);
router.put("/orders/:id/approve-return", approveReturn);
router.get("/products", getVendorProducts);

router.get("/delivery-partners", listDeliveryPartners);
router.post("/delivery-partners", createDeliveryPartner);
router.put("/delivery-partners/:id", updateDeliveryPartner);
router.put("/orders/:id/dispatch", dispatchOrderWithPartner);
router.put("/orders/:id/confirm-delivery", confirmPartnerDelivery);

export default router;
