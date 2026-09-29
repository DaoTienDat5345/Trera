import express from "express";
import {
  getSharedSteps,
  createSharedStep,
  updateSharedStep,
  deleteSharedStep,
} from "../../controllers/TestSharedStepController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getSharedSteps);
router.post("/", createSharedStep);
router.put("/:stepId", updateSharedStep);
router.delete("/:stepId", deleteSharedStep);

export default router;