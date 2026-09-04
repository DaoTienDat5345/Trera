import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import AuthRouter from "./router/AuthRouter.js";

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
// app.use("/api/projects", ProjectRouter);
// app.use("/api/issues",   IssueRouter);
// app.use("/api/sprints",  SprintRouter);
// app.use("/api/comments", CommentRouter);

app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
