import express from "express";
import {
  getTestSets,
  getTestSetById,
  createTestSet,
  updateTestSet,
  deleteTestSet,
  addCasesToSet,
  removeCaseFromSet,
} from "../../controllers/TestSetController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getTestSets);
router.post("/", createTestSet);
router.get("/:setId", getTestSetById);
router.put("/:setId", updateTestSet);
router.delete("/:setId", deleteTestSet);

// Cases inside Test Set
router.post("/:setId/cases", addCasesToSet);
router.delete("/:setId/cases/:caseId", removeCaseFromSet);

export default router;