import express from "express";
import {
  getAllComments,
  createComment,
  updateComment,
  deleteComment,
} from "../../controllers/CommentController.js";
import { protect } from "../../middleware/auth.js";

// Router dành cho: /api/issues/:issueId/comments
export const issueCommentsRouter = express.Router({ mergeParams: true });
issueCommentsRouter.use(protect);

issueCommentsRouter.get("/", getAllComments);
issueCommentsRouter.post("/", createComment);

// Router dành cho: /api/comments/:id
export const singleCommentRouter = express.Router();
singleCommentRouter.use(protect);

singleCommentRouter.put("/:id", updateComment);
singleCommentRouter.delete("/:id", deleteComment);

export default singleCommentRouter;
