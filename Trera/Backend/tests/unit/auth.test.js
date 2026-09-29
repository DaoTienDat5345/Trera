import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock các dependency bên ngoài (Prisma & EmailService)
vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../../services/emailService.js", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

import { prisma } from "../../config/prisma.js";
import { register, login } from "../../controllers/AuthController.js";

// Helper tạo mock req & res
const createMockReqRes = (body = {}) => {
  const req = { body };
  const res = {
    statusCode: 200,
    bodyData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      return this;
    },
  };
  return { req, res };
};

describe("Unit Tests: Auth Controller (Mocking Database & Services)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register()", () => {
    it("TC_UNIT_001: Trả về lỗi 400 nếu thiếu tên người dùng", async () => {
      const { req, res } = createMockReqRes({
        name: "",
        email: "test@trera.com",
        password: "password123",
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.bodyData.message).toBe("Vui lòng nhập họ và tên.");
    });

    it("TC_UNIT_002: Trả về lỗi 400 nếu email không đúng định dạng", async () => {
      const { req, res } = createMockReqRes({
        name: "Nguyễn Văn A",
        email: "invalid-email-format",
        password: "password123",
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.bodyData.message).toBe("Địa chỉ email không đúng định dạng.");
    });

    it("TC_UNIT_003: Trả về lỗi 400 nếu mật khẩu ngắn hơn 6 ký tự", async () => {
      const { req, res } = createMockReqRes({
        name: "Nguyễn Văn A",
        email: "test@trera.com",
        password: "123",
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.bodyData.message).toBe("Mật khẩu phải chứa ít nhất 6 ký tự.");
    });

    it("TC_UNIT_004: Trả về lỗi 409 nếu email đã được đăng ký", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "usr_123",
        email: "existing@trera.com",
      });

      const { req, res } = createMockReqRes({
        name: "Người Dùng Cũ",
        email: "existing@trera.com",
        password: "password123",
      });

      await register(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "existing@trera.com" },
      });
      expect(res.statusCode).toBe(409);
      expect(res.bodyData.message).toBe("Email này đã được đăng ký tài khoản.");
    });

    it("TC_UNIT_005: Đăng ký thành công trả về HTTP 201 và JWT token", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const fakeCreatedUser = {
        id: "usr_new_999",
        name: "Nguyễn Văn B",
        email: "newuser@trera.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(fakeCreatedUser);

      const { req, res } = createMockReqRes({
        name: "Nguyễn Văn B",
        email: "newuser@trera.com",
        password: "password123",
      });

      await register(req, res);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(res.statusCode).toBe(201);
      expect(res.bodyData.message).toBe("Đăng ký tài khoản thành công!");
      expect(res.bodyData.token).toBeDefined();
      expect(res.bodyData.user.email).toBe("newuser@trera.com");
    });
  });

  describe("login()", () => {
    it("TC_UNIT_006: Trả về lỗi 400 nếu thiếu email hoặc mật khẩu", async () => {
      const { req, res } = createMockReqRes({
        email: "",
        password: "",
      });

      await login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.bodyData.message).toBe("Vui lòng nhập đầy đủ email và mật khẩu.");
    });

    it("TC_UNIT_007: Trả về lỗi 401 nếu email không tồn tại trong hệ thống", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const { req, res } = createMockReqRes({
        email: "notfound@trera.com",
        password: "password123",
      });

      await login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.bodyData.message).toBe("Email hoặc mật khẩu không chính xác.");
    });

    it("TC_UNIT_008: Trả về lỗi 401 nếu mật khẩu không chính xác", async () => {
      const hashedPassword = await bcrypt.hash("correct_password", 10);
      prisma.user.findUnique.mockResolvedValue({
        id: "usr_login_1",
        email: "user@trera.com",
        password: hashedPassword,
      });

      const { req, res } = createMockReqRes({
        email: "user@trera.com",
        password: "wrong_password",
      });

      await login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.bodyData.message).toBe("Email hoặc mật khẩu không chính xác.");
    });

    it("TC_UNIT_009: Đăng nhập thành công trả về HTTP 200, JWT token và user info", async () => {
      const rawPassword = "password123";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const mockUser = {
        id: "usr_admin_01",
        name: "Admin Trera",
        email: "admin@trera.com",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const { req, res } = createMockReqRes({
        email: "admin@trera.com",
        password: rawPassword,
      });

      await login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.bodyData.message).toBe("Đăng nhập thành công!");
      expect(res.bodyData.token).toBeDefined();
      expect(res.bodyData.user.id).toBe("usr_admin_01");
      expect(res.bodyData.user.password).toBeUndefined();
    });
  });
});
