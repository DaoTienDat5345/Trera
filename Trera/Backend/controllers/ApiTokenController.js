import crypto from "crypto";
import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách API Tokens của dự án
 * GET /api/projects/:projectId/tokens
 */
export const getApiTokens = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tokens = await prisma.apiToken.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        prefix: true,
        role: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ tokens });
  } catch (error) {
    console.error("Lỗi lấy danh sách API Token:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách API Token." });
  }
};

/**
 * Tạo mới API Token cho CI/CD
 * POST /api/projects/:projectId/tokens
 */
export const createApiToken = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, role = "AUTOMATION", expiresInDays } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên token không được để trống." });
    }

    // Sinh raw token với tiền tố chuẩn tre_live_
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawToken = `tre_live_${randomHex}`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const prefix = `${rawToken.substring(0, 16)}...`;

    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(expiresInDays));
      expiresAt = exp;
    }

    const tokenRecord = await prisma.apiToken.create({
      data: {
        name: name.trim(),
        tokenHash,
        prefix,
        role: ["AUTOMATION", "ADMIN", "READ_ONLY"].includes(role) ? role : "AUTOMATION",
        projectId,
        userId: req.user.id,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Trả về rawToken duy nhất 1 lần
    return res.status(201).json({
      message: "Tạo API Token thành công. Hãy sao chép token ngay bây giờ vì token sẽ không hiển thị lại.",
      token: rawToken,
      tokenRecord,
    });
  } catch (error) {
    console.error("Lỗi tạo API Token:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo API Token." });
  }
};

/**
 * Thu hồi / Xóa API Token
 * DELETE /api/projects/:projectId/tokens/:tokenId
 */
export const revokeApiToken = async (req, res) => {
  try {
    const { projectId, tokenId } = req.params;

    const existing = await prisma.apiToken.findFirst({
      where: { id: tokenId, projectId },
    });

    if (!existing) {
      return res.status(404).json({ message: "API Token không tồn tại." });
    }

    await prisma.apiToken.delete({
      where: { id: tokenId },
    });

    return res.status(200).json({ message: "Đã thu hồi API Token thành công." });
  } catch (error) {
    console.error("Lỗi thu hồi API Token:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thu hồi API Token." });
  }
};
