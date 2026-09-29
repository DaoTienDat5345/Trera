import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  getEnvironments,
  createEnvironment,
  deleteEnvironment,
} from "../../controllers/TestEnvironmentController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, getEnvironments);
router.post("/", protect, createEnvironment);
router.delete("/:envId", protect, deleteEnvironment);

export default router;
