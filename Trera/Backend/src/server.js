import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import AuthRouter from "./router/AuthRouter.js";
import ProjectRouter from "./router/ProjectRouter.js";
import SprintRouter from "./router/SprintRouter.js";
import singleIssueRouter, { projectIssuesRouter } from "./router/IssueRouter.js";
import singleCommentRouter, { issueCommentsRouter } from "./router/CommentRouter.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

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

// Issue routes
app.use("/api/issues", singleIssueRouter);

// Comment routes
app.use("/api/issues/:issueId/comments", issueCommentsRouter);
app.use("/api/comments", singleCommentRouter);

app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
