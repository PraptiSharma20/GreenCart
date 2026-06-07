import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import { createNotification } from "./authController.js";
import { toIdString, itemBelongsToVendor } from "../utils/vendorScope.js";
import { isValidVendorStatusTransition } from "../utils/orderStatusWorkflow.js";
import {
  isValidIndianPhone,
  isValidEmailOptional,
  normalizePhone,
} from "../utils/deliveryValidation.js";

function buildAssignmentPayload(body, vendorId) {
  const {
    deliveryPartnerId,
    partnerName,
    partnerPhone,
    partnerEmail,
    notes,
    savePartner,
  } = body;

  return {
    deliveryPartnerId,
    partnerName: String(partnerName || "").trim(),
    partnerPhone: normalizePhone(partnerPhone),
    partnerEmail: String(partnerEmail || "").trim().toLowerCase(),
    notes: String(notes || "").trim(),
    savePartner: Boolean(savePartner),
    vendorId,
  };
}

async function resolvePartnerRecord(payload) {
  const { deliveryPartnerId, partnerName, partnerPhone, partnerEmail, notes, savePartner, vendorId } =
    payload;

  if (deliveryPartnerId) {
    const existing = await DeliveryPartner.findOne({
      _id: deliveryPartnerId,
      vendor: vendorId,
    });
    if (!existing) {
      const err = new Error("Delivery partner not found");
      err.status = 404;
      throw err;
    }
    return {
      deliveryPartnerId: existing._id,
      partnerName: existing.name,
      partnerPhone: existing.phone,
      partnerEmail: existing.email || "",
      notes: notes || existing.notes || "",
    };
  }

  if (!partnerName || !partnerPhone) {
    const err = new Error("Delivery partner name and phone are required");
    err.status = 400;
    throw err;
  }

  if (!isValidIndianPhone(partnerPhone)) {
    const err = new Error("Enter a valid 10-digit Indian mobile number");
    err.status = 400;
    throw err;
  }

  if (!isValidEmailOptional(partnerEmail)) {
    const err = new Error("Enter a valid email address");
    err.status = 400;
    throw err;
  }

  let savedPartnerId = null;
  if (savePartner) {
    let partner = await DeliveryPartner.findOne({
      vendor: vendorId,
      phone: partnerPhone,
    });
    if (partner) {
      partner.name = partnerName;
      partner.email = partnerEmail;
      if (notes) partner.notes = notes;
      partner.isActive = true;
      await partner.save();
    } else {
      partner = await DeliveryPartner.create({
        vendor: vendorId,
        name: partnerName,
        phone: partnerPhone,
        email: partnerEmail,
        notes,
      });
    }
    savedPartnerId = partner._id;
  }

  return {
    deliveryPartnerId: savedPartnerId,
    partnerName,
    partnerPhone,
    partnerEmail,
    notes,
  };
}

export const listDeliveryPartners = async (req, res) => {
  try {
    const includeInactive = req.query.all === "true";
    const filter = { vendor: req.user.id };
    if (!includeInactive) filter.isActive = true;

    const partners = await DeliveryPartner.find(filter).sort({ name: 1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDeliveryPartner = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = normalizePhone(req.body.phone);
    const email = String(req.body.email || "").trim().toLowerCase();
    const notes = String(req.body.notes || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!isValidIndianPhone(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
    }
    if (!isValidEmailOptional(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const existing = await DeliveryPartner.findOne({
      vendor: req.user.id,
      phone,
    });
    if (existing) {
      existing.name = name;
      existing.email = email;
      existing.notes = notes;
      existing.isActive = true;
      await existing.save();
      return res.json(existing);
    }

    const partner = await DeliveryPartner.create({
      vendor: req.user.id,
      name,
      phone,
      email,
      notes,
    });
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({
      _id: req.params.id,
      vendor: req.user.id,
    });
    if (!partner) {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: "Name is required" });
      partner.name = name;
    }
    if (req.body.phone !== undefined) {
      const phone = normalizePhone(req.body.phone);
      if (!isValidIndianPhone(phone)) {
        return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
      }
      partner.phone = phone;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!isValidEmailOptional(email)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      partner.email = email;
    }
    if (req.body.notes !== undefined) {
      partner.notes = String(req.body.notes).trim();
    }
    if (req.body.isActive !== undefined) {
      partner.isActive = Boolean(req.body.isActive);
    }

    await partner.save();
    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dispatchOrderWithPartner = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const vendorId = toIdString(req.user.id);
    const hasVendorItems = order.items.some((item) =>
      itemBelongsToVendor(item, vendorId)
    );
    if (!hasVendorItems && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this order" });
    }

    if (order.status === "Out for Delivery") {
      return res.status(400).json({
        message: "This order is already out for delivery",
      });
    }

    if (!isValidVendorStatusTransition(order.status, "Out for Delivery")) {
      return res.status(400).json({
        message: "Order must be accepted before dispatching for delivery",
      });
    }

    const assignment = await resolvePartnerRecord(
      buildAssignmentPayload(req.body, req.user.id)
    );

    const now = new Date();
    order.deliveryAssignment = {
      ...assignment,
      assignedAt: now,
      assignedBy: req.user.id,
      outForDeliveryAt: now,
      partnerReportedAt: null,
      partnerReportedVia: "vendor_confirmed",
    };
    order.status = "Out for Delivery";
    await order.save();

    try {
      await createNotification(
        order.user,
        "order_update",
        "Order Out for Delivery!",
        `Your order #${order._id.toString().slice(-6).toUpperCase()} is out for delivery!`,
        order._id
      );
    } catch (notificationError) {
      console.warn("Dispatch notification error:", notificationError);
    }

    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const confirmPartnerDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const vendorId = toIdString(req.user.id);
    const hasVendorItems = order.items.some((item) =>
      itemBelongsToVendor(item, vendorId)
    );
    if (!hasVendorItems && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.status !== "Out for Delivery") {
      return res.status(400).json({
        message: "Only out-for-delivery orders can be confirmed by the partner",
      });
    }

    if (!order.deliveryAssignment?.partnerName) {
      return res.status(400).json({
        message: "No delivery partner assigned to this order",
      });
    }

    if (order.deliveryAssignment.partnerReportedAt) {
      return res.json(order);
    }

    order.deliveryAssignment.partnerReportedAt = new Date();
    order.deliveryAssignment.partnerReportedVia = "vendor_confirmed";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
