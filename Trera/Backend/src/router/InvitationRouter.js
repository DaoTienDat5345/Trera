import express from "express";
import {
  getInvitationByToken,
  respondToInvitation,
} from "../../controllers/InvitationController.js";

const router = express.Router();

// Public routes - khong can xac thuc
router.get("/:token", getInvitationByToken);
router.post("/:token/respond", respondToInvitation);

export default router;