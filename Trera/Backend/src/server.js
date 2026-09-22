import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "../config/passport.js";
import { initSocket } from "../config/socket.js";

import AuthRouter from "./router/AuthRouter.js";
import ProjectRouter from "./router/ProjectRouter.js";
import SprintRouter from "./router/SprintRouter.js";
import path from "path";
import singleIssueRouter, { projectIssuesRouter } from "./router/IssueRouter.js";
import singleCommentRouter, { issueCommentsRouter } from "./router/CommentRouter.js";
import singleChecklistRouter, { issueChecklistRouter } from "./router/ChecklistRouter.js";
import singleAttachmentRouter, { issueAttachmentRouter } from "./router/AttachmentRouter.js";
import NotificationRouter from "./router/NotificationRouter.js";
import InvitationRouter from "./router/InvitationRouter.js";
import TestFolderRouter from "./router/TestFolderRouter.js";
import TestCaseRouter from "./router/TestCaseRouter.js";
import TestSharedStepRouter from "./router/TestSharedStepRouter.js";
import TestSetRouter from "./router/TestSetRouter.js";
import TestPlanRouter from "./router/TestPlanRouter.js";
import TestEnvironmentRouter from "./router/TestEnvironmentRouter.js";
import TestRunRouter from "./router/TestRunRouter.js";
import TraceabilityRouter from "./router/TraceabilityRouter.js";
import QADashboardRouter from "./router/QADashboardRouter.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Phục vụ tệp tĩnh tải lên (Local fallback)
app.use("/uploads", express.static(path.resolve("uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Authentication routes
app.use("/api/auth", AuthRouter);

// Project routes
app.use("/api/projects", ProjectRouter);

// Nested routes inside Project
app.use("/api/projects/:projectId/sprints", SprintRouter);
app.use("/api/projects/:projectId/issues", projectIssuesRouter);

// Test Management routes (Phase 1 & Phase 2)
app.use("/api/projects/:projectId/test-folders", TestFolderRouter);
app.use("/api/projects/:projectId/test-cases", TestCaseRouter);
app.use("/api/projects/:projectId/test-shared-steps", TestSharedStepRouter);
app.use("/api/projects/:projectId/test-sets", TestSetRouter);
app.use("/api/projects/:projectId/test-plans", TestPlanRouter);
app.use("/api/projects/:projectId/test-environments", TestEnvironmentRouter);
app.use("/api/projects/:projectId/test-runs", TestRunRouter);
app.use("/api/projects/:projectId/traceability", TraceabilityRouter);
app.use("/api/projects/:projectId/qa-metrics", QADashboardRouter);

// Issue routes
app.use("/api/issues", singleIssueRouter);

// Checklist routes
app.use("/api/issues/:issueId/checklist", issueChecklistRouter);
app.use("/api/checklist", singleChecklistRouter);

// Attachment routes
app.use("/api/issues/:issueId/attachments", issueAttachmentRouter);
app.use("/api/attachments", singleAttachmentRouter);

// Comment routes
app.use("/api/issues/:issueId/comments", issueCommentsRouter);
app.use("/api/comments", singleCommentRouter);

// Notification routes
app.use("/api/notifications", NotificationRouter);

// Invitation routes (public - no auth needed)
app.use("/api/invitations", InvitationRouter);

const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
