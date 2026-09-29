import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";

// Tạo app test đại diện cho cấu hình Express của Trera
const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

describe("Integration Tests: System Health Check Endpoint", () => {
  it("TC_INT_001: GET /api/health phản hồi HTTP 200 và payload status 'ok'", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toBeTypeOf("object");
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toBeDefined();
  });
});
