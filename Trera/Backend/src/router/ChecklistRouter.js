import express from "express";
import {
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "../../controllers/ChecklistController.js";
import { protect } from "../../middleware/auth.js";

export const issueChecklistRouter = express.Router({ mergeParams: true });
issueChecklistRouter.use(protect);
issueChecklistRouter.post("/", createChecklistItem);

export const singleChecklistRouter = express.Router();
singleChecklistRouter.use(protect);
singleChecklistRouter.put("/:id", updateChecklistItem);
singleChecklistRouter.delete("/:id", deleteChecklistItem);

export default singleChecklistRouter;
