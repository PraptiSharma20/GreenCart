import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import { toIdString } from "../utils/vendorScope.js";
import { buildActiveCouponsFilter } from "../utils/couponHelpers.js";

// Create a new coupon (vendor only)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      productId,
      usageLimit
    } = req.body;

    const vendorId = req.user.id;

    if (type === "product" && productId) {
      const owned = await Product.findOne({ _id: productId, vendor: vendorId });
      if (!owned) {
        return res.status(403).json({ message: "You can only create coupons for your own products" });
      }
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || 0,
      validFrom: validFrom || Date.now(),
      validUntil,
      productId,
      vendorId,
      usageLimit: usageLimit || 0,
      status: "active",
    });

    await coupon.populate('vendorId', 'name storeName');

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get coupons for a vendor
export const getVendorCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ vendorId: req.user.id })
      .populate('productId', 'name')
      .populate('vendorId', 'name storeName')
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a coupon (vendor only)
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (toIdString(coupon.vendorId) !== toIdString(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      code,
      type,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      productId,
      usageLimit
    } = req.body;

    const nextType = type || coupon.type;
    const nextProductId = productId !== undefined ? productId : coupon.productId;
    if (nextType === "product" && nextProductId) {
      const owned = await Product.findOne({ _id: nextProductId, vendor: req.user.id });
      if (!owned) {
        return res.status(403).json({ message: "You can only link coupons to your own products" });
      }
    }

    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
      coupon.code = code.toUpperCase();
    }

    if (type) coupon.type = type;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (validFrom) coupon.validFrom = validFrom;
    if (validUntil) coupon.validUntil = validUntil;
    if (productId !== undefined) coupon.productId = productId;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

    await coupon.save();
    await coupon.populate('productId', 'name');
    await coupon.populate('vendorId', 'name storeName');

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a coupon (vendor only)
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (toIdString(coupon.vendorId) !== toIdString(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all coupons for admin approval
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('productId', 'name')
      .populate('vendorId', 'name storeName')
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve a coupon (admin only)
export const approveCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.status = 'active';
    await coupon.save();
    await coupon.populate('productId', 'name');
    await coupon.populate('vendorId', 'name storeName');

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Disable a coupon (admin only)
export const disableCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.status = 'disabled';
    await coupon.save();
    await coupon.populate('productId', 'name');
    await coupon.populate('vendorId', 'name storeName');

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active coupons for customers (all vendors, valid & usable)
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find(buildActiveCouponsFilter(now))
      .populate("productId", "name image")
      .populate("vendorId", "name storeName")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lightweight count for offers badge (customers only)
export const getActiveCouponsCount = async (req, res) => {
  try {
    const now = new Date();
    const count = await Coupon.countDocuments(buildActiveCouponsFilter(now));
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get coupon by code
export const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      code: req.params.code.toUpperCase(),
      status: { $in: ["active", "pending"] },
    })
      .populate('productId', 'name')
      .populate('vendorId', 'name storeName');

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const now = new Date();
    if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
      return res.status(400).json({ message: "Coupon expired or not yet valid" });
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
