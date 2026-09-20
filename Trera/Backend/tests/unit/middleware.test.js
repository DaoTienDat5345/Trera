import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// Mock Prisma
vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../../config/prisma.js";
import { protect } from "../../middleware/auth.js";

describe("Unit Tests: Auth Middleware (protect)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC_UNIT_010: Bị chặn (401) nếu không gửi Authorization header", async () => {
    const req = { headers: {} };
    let statusCode = 200;
    let body = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        body = data;
        return this;
      },
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(statusCode).toBe(401);
    expect(body.message).toContain("Bạn chưa đăng nhập");
    expect(next).not.toHaveBeenCalled();
  });

  it("TC_UNIT_011: Bị chặn (401) nếu Authorization header không có tiền tố Bearer", async () => {
    const req = { headers: { authorization: "Basic some_basic_token" } };
    let statusCode = 200;
    let body = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        body = data;
        return this;
      },
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(statusCode).toBe(401);
    expect(body.message).toContain("Bạn chưa đăng nhập");
    expect(next).not.toHaveBeenCalled();
  });

  it("TC_UNIT_012: Bị chặn (401) nếu token không hợp lệ hoặc hết hạn", async () => {
    const req = { headers: { authorization: "Bearer invalid.expired.token" } };
    let statusCode = 200;
    let body = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        body = data;
        return this;
      },
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(statusCode).toBe(401);
    expect(body.message).toBe("Token không hợp lệ hoặc đã hết hạn.");
    expect(next).not.toHaveBeenCalled();
  });

  it("TC_UNIT_013: Bị chặn (401) nếu token hợp lệ nhưng user đã bị xóa khỏi hệ thống", async () => {
    const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
    const validToken = jwt.sign({ id: "deleted_user_id" }, secret);

    prisma.user.findUnique.mockResolvedValue(null);

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    let statusCode = 200;
    let body = null;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        body = data;
        return this;
      },
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(statusCode).toBe(401);
    expect(body.message).toBe("Người dùng liên kết với token này không còn tồn tại.");
    expect(next).not.toHaveBeenCalled();
  });

  it("TC_UNIT_014: Xác thực thành công: Gán req.user và gọi next()", async () => {
    const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";
    const validToken = jwt.sign({ id: "valid_user_id" }, secret);

    const activeUser = {
      id: "valid_user_id",
      name: "Trera Member",
      email: "member@trera.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.user.findUnique.mockResolvedValue(activeUser);

    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await protect(req, res, next);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "valid_user_id" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(req.user).toEqual(activeUser);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
