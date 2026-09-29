import express from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember, checkCanWriteTest } from "../../middleware/projectAccess.js";
import {
  importJUnitResults,
  importCucumberResults,
  getAutomationSummary,
} from "../../controllers/AutomationController.js";

const router = express.Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

router.post("/junit", protect, checkProjectMember, checkCanWriteTest, upload.single("file"), importJUnitResults);
router.post("/cucumber", protect, checkProjectMember, checkCanWriteTest, upload.single("file"), importCucumberResults);
router.get("/summary", protect, checkProjectMember, getAutomationSummary);

export default router;
