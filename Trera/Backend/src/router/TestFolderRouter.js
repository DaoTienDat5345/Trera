import express from "express";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../../controllers/TestFolderController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(checkProjectMember);

router.get("/", getFolders);
router.post("/", createFolder);
router.put("/:folderId", updateFolder);
router.delete("/:folderId", deleteFolder);

export default router;