import express from "express";
import {
  getAboutStats,
  getPrivacyMeta,
  getTermsMeta,
} from "../controllers/aboutController.js";

const router = express.Router();

router.get("/stats", getAboutStats);
router.get("/privacy", getPrivacyMeta);
router.get("/terms", getTermsMeta);

export default router;
