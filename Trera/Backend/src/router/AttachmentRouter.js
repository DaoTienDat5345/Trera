import express from "express";
import {
  uploadAttachment,
  deleteAttachment,
} from "../../controllers/AttachmentController.js";
import { protect } from "../../middleware/auth.js";
import { uploadMiddleware } from "../../config/upload.js";

export const issueAttachmentRouter = express.Router({ mergeParams: true });
issueAttachmentRouter.use(protect);
issueAttachmentRouter.post("/", uploadMiddleware.single("file"), uploadAttachment);

export const singleAttachmentRouter = express.Router();
singleAttachmentRouter.use(protect);
singleAttachmentRouter.delete("/:id", deleteAttachment);

export default singleAttachmentRouter;
