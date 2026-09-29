import express from "express";
import {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from "../../controllers/TestCaseController.js";
import {
  exportTestCases,
  importTestCases,
} from "../../controllers/TestImportExportController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getTestCases);
router.post("/", createTestCase);

// Import & Export routes (must be before :testCaseId)
router.get("/export", exportTestCases);
router.post("/import", importTestCases);

router.get("/:testCaseId", getTestCaseById);
router.put("/:testCaseId", updateTestCase);
router.delete("/:testCaseId", deleteTestCase);

export default router;