import express from "express";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember, checkLeadOrAdmin } from "../../middleware/projectAccess.js";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
} from "../../controllers/WebhookController.js";

const router = express.Router({ mergeParams: true });

router.get("/", protect, checkProjectMember, getWebhooks);
router.post("/", protect, checkProjectMember, checkLeadOrAdmin, createWebhook);
router.put("/:webhookId", protect, checkProjectMember, checkLeadOrAdmin, updateWebhook);
router.delete("/:webhookId", protect, checkProjectMember, checkLeadOrAdmin, deleteWebhook);
router.post("/:webhookId/test", protect, checkProjectMember, checkLeadOrAdmin, testWebhook);

export default router;
