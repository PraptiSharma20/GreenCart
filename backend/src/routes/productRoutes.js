import express from "express";
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct, rateProduct, respondToReview, resetAllProductRatings } from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import vendorOrAdminMiddleware from "../middleware/vendorOrAdminMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", authMiddleware, vendorOrAdminMiddleware, createProduct);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, vendorOrAdminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, vendorOrAdminMiddleware, deleteProduct);
router.post("/:id/rate", authMiddleware, rateProduct);
router.put("/:id/reviews/:ratingId/respond", authMiddleware, vendorOrAdminMiddleware, respondToReview);
router.post("/reset-ratings", authMiddleware, resetAllProductRatings);

// Image upload route
router.post("/upload", authMiddleware, vendorOrAdminMiddleware, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.send({
      message: "Image uploaded successfully",
      image: `/${req.file.path.replace(/\\/g, "/")}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

export default router;
