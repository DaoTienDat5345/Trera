import express from "express";
import {
  getAllProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from "../../controllers/ProjectController.js";
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
router.put("/:id", checkProjectMember, checkProjectAdmin, updateProject);
router.delete("/:id", checkProjectMember, checkProjectOwner, deleteProject);

// Quản lý thành viên trong dự án
router.post("/:id/members", checkProjectMember, checkProjectAdmin, addMember);
router.delete("/:id/members/:userId", checkProjectMember, removeMember);

export default router;
