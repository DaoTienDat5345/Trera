import { prisma } from "../config/prisma.js";

/**
 * Middleware kiểm tra người dùng có phải thành viên của project không (hoặc là chủ sở hữu)
 */
export const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user?.id;

    if (!projectId) {
      return res.status(400).json({ message: "Thiếu ID dự án." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại." });
    }

    const isOwner = project.ownerId === userId;
    const memberRecord = project.members[0];

    if (!isOwner && !memberRecord) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập vào dự án này." });
    }

    req.project = project;
    req.userRole = isOwner ? "ADMIN" : memberRecord?.role;
    req.isOwner = isOwner;

    next();
  } catch (error) {
    console.error("Lỗi kiểm tra quyền thành viên dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra quyền truy cập." });
  }
};

/**
 * Middleware yêu cầu quyền ADMIN trong dự án (hoặc Owner)
 */
export const checkProjectAdmin = async (req, res, next) => {
  // Phải chạy sau checkProjectMember
  if (req.userRole !== "ADMIN" && !req.isOwner) {
    return res.status(403).json({
      message: "Bạn không có quyền quản trị (Admin) trong dự án này.",
    });
  }
  next();
};

/**
 * Middleware yêu cầu quyền OWNER (chủ sở hữu tạo ra dự án)
 */
export const checkProjectOwner = async (req, res, next) => {
  if (!req.isOwner) {
    return res.status(403).json({
      message: "Chỉ chủ sở hữu (Owner) của dự án mới có quyền thực hiện thao tác này.",
    });
  }
  next();
};
