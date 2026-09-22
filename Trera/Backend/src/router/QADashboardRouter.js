import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  getQAMetrics,
  getFlakyTests,
} from "../../controllers/QADashboardController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, getQAMetrics);
router.get("/flaky-tests", protect, getFlakyTests);

export default router;
