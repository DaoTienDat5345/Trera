import express from "express";
import {
  getAllSprints,
  createSprint,
  updateSprint,
  startSprint,
  completeSprint,
  deleteSprint,
} from "../../controllers/SprintController.js";
import { protect } from "../../middleware/auth.js";
import {
  checkProjectMember,
  checkProjectAdmin,
} from "../../middleware/projectAccess.js";

// mergeParams: true giúp truy cập :projectId từ router cha
const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getAllSprints);
router.post("/", checkProjectAdmin, createSprint);
router.put("/:id", checkProjectAdmin, updateSprint);
router.patch("/:id/start", checkProjectAdmin, startSprint);
router.patch("/:id/complete", checkProjectAdmin, completeSprint);
router.delete("/:id", checkProjectAdmin, deleteSprint);

export default router;
