import express from "express";
import {
  getAllIssues,
  createIssue,
  getIssueById,
  updateIssue,
  deleteIssue,
  reorderIssues,
} from "../../controllers/IssueController.js";
import { protect } from "../../middleware/auth.js";
import { checkProjectMember } from "../../middleware/projectAccess.js";

// Router dành cho: /api/projects/:projectId/issues
export const projectIssuesRouter = express.Router({ mergeParams: true });
projectIssuesRouter.use(protect);
projectIssuesRouter.use(checkProjectMember);

projectIssuesRouter.get("/", getAllIssues);
projectIssuesRouter.post("/", createIssue);
projectIssuesRouter.patch("/reorder", reorderIssues);

// Router dành cho: /api/issues/:id
export const singleIssueRouter = express.Router();
singleIssueRouter.use(protect);

singleIssueRouter.get("/:id", getIssueById);
singleIssueRouter.put("/:id", updateIssue);
singleIssueRouter.delete("/:id", deleteIssue);

export default singleIssueRouter;
