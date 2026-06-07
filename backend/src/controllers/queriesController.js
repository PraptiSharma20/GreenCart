import Query from "../models/Query.js";
import { createNotification } from "./authController.js";
import {
  authUserId,
  resolveQueryRecipientId,
  findUserIdByEmail,
} from "../utils/queryRecipient.js";

export const createQuery = async (req, res) => {
  try {
    const { name, email, subject, message, contactType } = req.body;
    let userId = authUserId(req.user);
    if (!userId && email) {
      userId = await findUserIdByEmail(email);
    }
    
    const newQuery = new Query({ 
      name, 
      email, 
      subject, 
      message, 
      contactType,
      user: userId
    });
    await newQuery.save();
    res.status(201).json(newQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllQueries = async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    await Promise.all(
      queries.map(async (q) => {
        if (!q.user && q.email) {
          const uid = await findUserIdByEmail(q.email);
          if (uid) {
            q.user = uid;
            await q.save();
          }
        }
      })
    );
    await Query.populate(queries, { path: "user", select: "name email role" });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (query) {
      query.status = "resolved";
      await query.save();
      res.json(query);
    } else {
      res.status(404).json({ message: "Query not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuery = async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ message: "Query deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyToQuery = async (req, res) => {
  try {
    const { message, markResolved } = req.body;
    const text = (message || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    query.replies = query.replies || [];
    query.replies.push({
      message: text,
      adminName: req.user?.name || "Admin",
      adminId: req.user?._id || null,
    });

    if (markResolved) {
      query.status = "resolved";
    }

    const recipientId = await resolveQueryRecipientId(query);
    if (recipientId && String(query.user || "") !== String(recipientId)) {
      query.user = recipientId;
    }

    await query.save();

    let notifiedInApp = false;
    if (recipientId) {
      const preview =
        text.length > 120 ? `${text.slice(0, 117)}...` : text;
      await createNotification(
        recipientId,
        "support_reply",
        `Reply: ${query.subject}`,
        preview
      );
      notifiedInApp = true;
    }

    const updated = await Query.findById(query._id).populate("user", "name email role");
    const payload = updated.toObject();
    payload.notifiedInApp = notifiedInApp;
    payload.canReachInApp = Boolean(recipientId);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
