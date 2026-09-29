import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadMiddleware } from "../../config/upload.js";
import {
  getTestRuns,
  getTestRunById,
  createTestRun,
  updateTestRun,
  deleteTestRun,
} from "../../controllers/TestRunController.js";
import {
  executeTestCase,
  logDefectFromRun,
  uploadStepAttachment,
} from "../../controllers/TestExecutionController.js";

const router = express.Router({ mergeParams: true });

// Test Runs CRUD
router.get("/", protect, getTestRuns);
router.post("/", protect, createTestRun);
router.get("/:runId", protect, getTestRunById);
router.put("/:runId", protect, updateTestRun);
router.delete("/:runId", protect, deleteTestRun);

// Execution & Defect Logging
router.post("/:runId/results/:caseId", protect, executeTestCase);
router.post("/:runId/results/:caseId/defect", protect, logDefectFromRun);
router.post(
  "/:runId/results/:caseId/steps/:stepId/attachment",
  protect,
  uploadMiddleware.single("file"),
  uploadStepAttachment
);

export default router;
