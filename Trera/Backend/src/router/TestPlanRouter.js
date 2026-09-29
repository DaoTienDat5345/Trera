import express from "express";
import {
  getTestPlans,
  getTestPlanById,
  createTestPlan,
  updateTestPlan,
  deleteTestPlan,
  updatePlanCaseStatus,
  addCasesToPlan,
  removeCaseFromPlan,
} from "../../controllers/TestPlanController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getTestPlans);
router.post("/", createTestPlan);
router.get("/:planId", getTestPlanById);
router.put("/:planId", updateTestPlan);
router.delete("/:planId", deleteTestPlan);

// Cases inside Test Plan
router.post("/:planId/cases", addCasesToPlan);
router.patch("/:planId/cases/:caseId", updatePlanCaseStatus);
router.delete("/:planId/cases/:caseId", removeCaseFromPlan);

export default router;