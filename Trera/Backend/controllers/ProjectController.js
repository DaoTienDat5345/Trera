import { prisma } from "../config/prisma.js";
import { sendProjectInviteEmail } from "../services/emailService.js";

/**
 * Lấy danh sách dự án mà người dùng tham gia (là Owner hoặc Member)
 */
export const getAllProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            issues: true,
            sprints: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Lỗi lấy danh sách dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách dự án." });
  }
};

/**
 * Tạo dự án mới
 */
export const createProject = async (req, res) => {
  try {
    const { name, description, key } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tên dự án." });
    }

    if (!key || !key.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập mã định danh dự án (Key)." });
    }

    const cleanKey = key.trim().toUpperCase();
    const keyRegex = /^[A-Z0-9]{2,6}$/;
    if (!keyRegex.test(cleanKey)) {
      return res.status(400).json({
        message: "Key dự án chỉ được chứa từ 2 đến 6 ký tự chữ hoa hoặc chữ số (VD: TRE, JIRA, P1).",
      });
    }

    // Kiểm tra trùng Key
    const existingKey = await prisma.project.findUnique({
      where: { key: cleanKey },
    });

    if (existingKey) {
      return res.status(409).json({ message: `Mã dự án "${cleanKey}" đã được sử dụng. Vui lòng chọn mã khác.` });
    }

    // Thực hiện trong transaction
    const newProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          key: cleanKey,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: "ADMIN",
            },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      await tx.activity.create({
        data: {
          projectId: project.id,
          actorId: userId,
          action: "created_project",
          metadata: {
            projectName: project.name,
            key: project.key,
          },
        },
      });

      return project;
    });

    return res.status(201).json({
      message: "Tạo dự án thành công!",
      project: newProject,
    });
  } catch (error) {
    console.error("Lỗi tạo dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo dự án." });
  }
};

/**
 * Lấy chi tiết một dự án
 */
export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            issues: true,
            sprints: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại." });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error("Lỗi lấy chi tiết dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy chi tiết dự án." });
  }
};

/**
 * Cập nhật thông tin dự án (Tên, Mô tả)
 */
export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Tên dự án không được để trống." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description ? description.trim() : null }),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "updated_project",
          metadata: {
            updatedFields: {
              ...(name !== undefined && { name: name.trim() }),
              ...(description !== undefined && { description: description?.trim() }),
            },
          },
        },
      });

      return project;
    });

    return res.status(200).json({
      message: "Cập nhật thông tin dự án thành công!",
      project: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật dự án." });
  }
};

/**
 * Xóa dự án (Chỉ Owner mới được thực hiện)
 */
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    await prisma.project.delete({
      where: { id: projectId },
    });

    return res.status(200).json({
      message: "Đã xoá dự án và toàn bộ dữ liệu liên quan thành công!",
    });
  } catch (error) {
    console.error("Lỗi xóa dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá dự án." });
  }
};

/**
 * Mời/Thêm thành viên vào dự án qua email
 */
export const addMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email, role = "MEMBER" } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ email của thành viên." });
    }

    const cleanRole = role.toUpperCase();
    if (!["ADMIN", "MEMBER"].includes(cleanRole)) {
      return res.status(400).json({ message: "Vai trò chỉ có thể là ADMIN hoặc MEMBER." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Tìm người dùng trong DB
    const targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng với email này. Người dùng cần đăng ký tài khoản Trera trước.",
      });
    }

    // Kiểm tra đã là member chưa
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ message: "Người dùng này đã là thành viên của dự án." });
    }

    // Thêm member và tạo log
    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.projectMember.create({
        data: {
          projectId,
          userId: targetUser.id,
          role: cleanRole,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "added_member",
          metadata: {
            memberId: targetUser.id,
            memberName: targetUser.name,
            role: cleanRole,
          },
        },
      });

      return newMember;
    });

    // Gửi email thông báo không đồng bộ
    sendProjectInviteEmail({
      invitedUser: targetUser,
      project: req.project,
      inviterName: req.user.name,
      role: cleanRole,
    }).catch((err) => console.error("Lỗi gửi email mời dự án:", err.message));

    return res.status(201).json({
      message: `Đã thêm thành viên "${targetUser.name}" vào dự án thành công!`,
      member,
    });
  } catch (error) {
    console.error("Lỗi thêm thành viên:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm thành viên." });
  }
};

/**
 * Xóa thành viên khỏi dự án
 */
export const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu ID của thành viên cần xoá." });
    }

    // Không được xoá Owner
    if (userId === req.project.ownerId) {
      return res.status(403).json({ message: "Không thể xoá chủ sở hữu (Owner) khỏi dự án." });
    }

    // Người dùng được phép tự rời dự án, hoặc người gọi phải là ADMIN
    const isSelfLeaving = userId === req.user.id;
    if (!isSelfLeaving && req.userRole !== "ADMIN" && !req.isOwner) {
      return res.status(403).json({ message: "Chỉ Admin mới có quyền xoá thành viên khác khỏi dự án." });
    }

    const memberToDelete = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!memberToDelete) {
      return res.status(404).json({ message: "Thành viên này không tồn tại trong dự án." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: isSelfLeaving ? "member_left" : "removed_member",
          metadata: {
            targetUserId: userId,
            targetUserName: memberToDelete.user.name,
          },
        },
      });
    });

    return res.status(200).json({
      message: isSelfLeaving
        ? "Bạn đã rời khỏi dự án thành công."
        : `Đã xoá thành viên "${memberToDelete.user.name}" khỏi dự án.`,
    });
  } catch (error) {
    console.error("Lỗi xoá thành viên dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá thành viên." });
  }
};
