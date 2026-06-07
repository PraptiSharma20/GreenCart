import express from "express";
import {
  createQuery,
  getAllQueries,
  resolveQuery,
  deleteQuery,
  replyToQuery,
} from "../controllers/queriesController.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Optional auth: attach user when token is valid; guest submit still works
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next();
  }
};

router.post("/", optionalAuth, createQuery);
router.get("/", authMiddleware, adminMiddleware, getAllQueries);
router.put("/:id/resolve", authMiddleware, adminMiddleware, resolveQuery);
router.post("/:id/reply", authMiddleware, adminMiddleware, replyToQuery);
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuery);

export default router;
