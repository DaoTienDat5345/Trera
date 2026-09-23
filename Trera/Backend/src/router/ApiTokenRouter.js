import express from "express";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember, checkLeadOrAdmin } from "../../middleware/projectAccess.js";
import {
  getApiTokens,
  createApiToken,
  revokeApiToken,
} from "../../controllers/ApiTokenController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, checkProjectMember, getApiTokens);
router.post("/", protect, checkProjectMember, checkLeadOrAdmin, createApiToken);
router.delete("/:tokenId", protect, checkProjectMember, checkLeadOrAdmin, revokeApiToken);

export default router;
