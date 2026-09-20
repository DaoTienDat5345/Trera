import express from "express";
import {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  removeMember,
} from "../../controllers/ProjectController.js";
import {
  sendInvitation,
  getProjectInvitations,
  cancelInvitation,
} from "../../controllers/InvitationController.js";
import { getProjectAnalytics } from "../../controllers/AnalyticsController.js";
import { getProjectActivities } from "../../controllers/ActivityController.js";
import { protect } from "../../middleware/auth.js";
import {
  checkProjectMember,
  checkProjectAdmin,
  checkProjectOwner,
} from "../../middleware/projectAccess.js";

const router = express.Router();

// Tất cả các route bên dưới đều cần xác thực đăng nhập
router.use(protect);

router.get("/", getAllProjects);
router.post("/", createProject);

router.get("/:id", checkProjectMember, getProjectById);
router.get("/:id/analytics", checkProjectMember, getProjectAnalytics);
router.get("/:id/activities", checkProjectMember, getProjectActivities);
router.put("/:id", checkProjectMember, checkProjectAdmin, updateProject);
router.delete("/:id", checkProjectMember, checkProjectOwner, deleteProject);

// Quản lý thành viên trong dự án
router.post("/:id/members", checkProjectMember, checkProjectAdmin, sendInvitation);
router.delete("/:id/members/:userId", checkProjectMember, removeMember);

// Quản lý lời mời
router.get("/:id/invitations", checkProjectMember, checkProjectAdmin, getProjectInvitations);
router.delete("/:id/invitations/:invitationId", checkProjectMember, checkProjectAdmin, cancelInvitation);

export default router;
