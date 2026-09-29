import express from "express";
import {
  getInvitationByToken,
  respondToInvitation,
} from "../../controllers/InvitationController.js";
import { invitationResponseLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// Public routes - khong can xac thuc
router.get("/:token", getInvitationByToken);
router.post("/:token/respond", invitationResponseLimiter, respondToInvitation);

export default router;