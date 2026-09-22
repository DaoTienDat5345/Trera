import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  getTraceabilityMatrix,
  linkTestCaseToIssue,
  unlinkTestCaseFromIssue,
} from "../../controllers/TraceabilityController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, getTraceabilityMatrix);
router.post("/link", protect, linkTestCaseToIssue);
router.delete("/link", protect, unlinkTestCaseFromIssue);

export default router;
