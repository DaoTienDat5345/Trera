import { prisma } from "../config/prisma.js";
import { sendCommentNotificationEmail } from "../services/emailService.js";

/**
 * Lấy danh sách bình luận của một công việc (Issue)
 */
export const getAllComments = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Kiểm tra quyền truy cập dự án
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: issue.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!isMember && issue.project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem bình luận trong dự án này." });
    }

    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Lỗi lấy danh sách bình luận:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy bình luận." });
  }
};

/**
 * Thêm bình luận mới vào một công việc
 */
export const createComment = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống." });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          select: { id: true, name: true, key: true, ownerId: true },
        },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Kiểm tra quyền truy cập dự án
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: issue.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!isMember && issue.project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền bình luận trong dự án này." });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content: content.trim(),
          issueId,
          authorId: req.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await tx.activity.create({
        data: {
          projectId: issue.projectId,
          issueId,
          actorId: req.user.id,
          action: "commented",
          metadata: {
            issueTitle: issue.title,
            preview: content.trim().slice(0, 80),
          },
        },
      });

      return newComment;
    });

    // Gom danh sách người nhận email: assignees + reporter (loại bỏ người bình luận)
    const recipientMap = new Map();

    if (issue.reporter && issue.reporter.id !== req.user.id) {
      recipientMap.set(issue.reporter.id, issue.reporter);
    }

    issue.assignees.forEach(({ user }) => {
      if (user.id !== req.user.id) {
        recipientMap.set(user.id, user);
      }
    });

    const recipients = Array.from(recipientMap.values());
    if (recipients.length > 0) {
      sendCommentNotificationEmail({
        users: recipients,
        comment,
        issue,
        project: issue.project,
        commenterName: req.user.name,
      }).catch((err) => console.error("Lỗi gửi email thông báo bình luận:", err.message));
    }

    return res.status(201).json({
      message: "Đã thêm bình luận thành công!",
      comment,
    });
  } catch (error) {
    console.error("Lỗi thêm bình luận:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm bình luận." });
  }
};

/**
 * Cập nhật nội dung bình luận (Chỉ tác giả)
 */
export const updateComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống." });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại." });
    }

    // Chỉ tác giả mới có quyền sửa bình luận
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({
        message: "Bạn chỉ có thể chỉnh sửa bình luận của chính mình.",
      });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      message: "Đã cập nhật bình luận thành công!",
      comment: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật bình luận:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật bình luận." });
  }
};

/**
 * Xóa bình luận (Tác giả HOẶC Quản trị viên dự án)
 */
export const deleteComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        issue: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: req.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({ message: "Bình luận không tồn tại." });
    }

    const isAuthor = comment.authorId === req.user.id;
    const isOwner = comment.issue.project.ownerId === req.user.id;
    const isAdmin = comment.issue.project.members[0]?.role === "ADMIN";

    if (!isAuthor && !isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Chỉ tác giả bình luận hoặc Quản trị viên dự án mới có quyền xoá bình luận này.",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.status(200).json({
      message: "Đã xoá bình luận thành công!",
    });
  } catch (error) {
    console.error("Lỗi xóa bình luận:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá bình luận." });
  }
};
