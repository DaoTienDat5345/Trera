import { prisma } from "../config/prisma.js";
import { emitToProject } from "../config/socket.js";

/**
 * Thêm mục việc con vào Issue
 */
export const createChecklistItem = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tiêu đề việc con không được để trống." });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Đếm số lượng việc con hiện tại để tính order
    const count = await prisma.checklistItem.count({ where: { issueId } });

    const item = await prisma.checklistItem.create({
      data: {
        title: title.trim(),
        order: count,
        issueId,
      },
      include: {
        attachments: true,
      },
    });

    // Phát sóng real-time cho dự án
    emitToProject(issue.projectId, "issue:checklist:created", {
      issueId,
      item,
    });

    return res.status(201).json({
      message: "Thêm việc con thành công!",
      item,
    });
  } catch (error) {
    console.error("Lỗi tạo checklist item:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm việc con." });
  }
};

/**
 * Cập nhật việc con (title hoặc isCompleted)
 */
export const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isCompleted, order } = req.body;

    const existing = await prisma.checklistItem.findUnique({
      where: { id },
      include: {
        issue: { select: { id: true, projectId: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Mục việc con không tồn tại." });
    }

    const updatedItem = await prisma.checklistItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(isCompleted !== undefined && { isCompleted: Boolean(isCompleted) }),
        ...(order !== undefined && { order: parseInt(order, 10) }),
      },
      include: {
        attachments: true,
      },
    });

    // Phát sóng real-time
    emitToProject(existing.issue.projectId, "issue:checklist:updated", {
      issueId: existing.issueId,
      item: updatedItem,
    });

    return res.status(200).json({
      message: "Cập nhật việc con thành công!",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Lỗi cập nhật checklist item:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật việc con." });
  }
};

/**
 * Xoá việc con
 */
export const deleteChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.checklistItem.findUnique({
      where: { id },
      include: {
        issue: { select: { id: true, projectId: true } },
        attachments: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Mục việc con không tồn tại." });
    }

    await prisma.checklistItem.delete({
      where: { id },
    });

    // Phát sóng real-time
    emitToProject(existing.issue.projectId, "issue:checklist:deleted", {
      issueId: existing.issueId,
      itemId: id,
    });

    return res.status(200).json({
      message: "Đã xoá mục việc con thành công!",
    });
  } catch (error) {
    console.error("Lỗi xoá checklist item:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá việc con." });
  }
};
