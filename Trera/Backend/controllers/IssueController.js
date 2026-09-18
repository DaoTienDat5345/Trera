import { prisma } from "../config/prisma.js";
import { sendIssueAssignedEmail, sendStatusChangedEmail } from "../services/emailService.js";
import { notifyAssignment, notifyStatusChange } from "../services/notificationService.js";
import { emitToProject } from "../config/socket.js";

/**
 * Lấy danh sách Issue của dự án (hỗ trợ filter, search, sprint)
 */
export const getAllIssues = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { status, priority, type, sprintId, assigneeId, search } = req.query;

    const where = { projectId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    // Lọc theo Sprint: "backlog" hoặc "null" -> sprintId: null
    if (sprintId === "backlog" || sprintId === "null") {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }

    if (assigneeId) {
      where.assignees = { some: { userId: assigneeId } };
    }

    if (search && search.trim()) {
      where.title = { contains: search.trim(), mode: "insensitive" };
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        assignees: {
          select: {
            assignedAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        labels: {
          select: { id: true, label: true },
        },
        checklistItems: {
          select: { id: true, isCompleted: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({ issues });
  } catch (error) {
    console.error("Lỗi lấy danh sách Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách công việc." });
  }
};

/**
 * Tạo Issue mới trong dự án
 */
export const createIssue = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const {
      title,
      description,
      status = "TODO",
      priority = "MEDIUM",
      type = "TASK",
      sprintId,
      assigneeIds = [],
      labels = [],
      dueDate,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tiêu đề công việc không được để trống." });
    }

    // Kiểm tra sprint hợp lệ nếu có
    if (sprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: { id: sprintId, projectId },
      });
      if (!sprint) {
        return res.status(404).json({ message: "Sprint không tồn tại trong dự án này." });
      }
    }

    // Tính toán order cao nhất cho status này
    const highestOrder = await prisma.issue.findFirst({
      where: { projectId, status },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = (highestOrder?.order ?? -1) + 1;

    const newIssue = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          status,
          priority,
          type,
          order: newOrder,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          sprintId: sprintId || null,
          reporterId: req.user.id,
          // Tạo assignees
          assignees: {
            create: assigneeIds.map((userId) => ({ userId })),
          },
          // Tạo labels
          labels: {
            create: labels.map((lbl) => ({ label: lbl.trim().toLowerCase() })),
          },
        },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          reporter: { select: { id: true, name: true, email: true } },
          sprint: { select: { id: true, name: true, status: true } },
          labels: true,
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          issueId: issue.id,
          actorId: req.user.id,
          action: "created_issue",
          metadata: {
            title: issue.title,
            priority: issue.priority,
            type: issue.type,
          },
        },
      });

      return issue;
    });

    // Kích hoạt thông báo In-App + Email cho assignees và Admin
    if (newIssue.assignees && newIssue.assignees.length > 0) {
      notifyAssignment({
        actorId: req.user.id,
        actorName: req.user.name,
        assigneeIds: newIssue.assignees.map((a) => a.user.id),
        issue: newIssue,
        project: req.project,
      }).catch((err) => console.error("Lỗi notifyAssignment createIssue:", err.message));
    }

    // Phát sóng real-time cho các thành viên trong dự án
    emitToProject(projectId, "issue:created", newIssue);

    return res.status(201).json({
      message: "Tạo công việc thành công!",
      issue: newIssue,
    });
  } catch (error) {
    console.error("Lỗi tạo Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo công việc." });
  }
};

/**
 * Lấy chi tiết một Issue (kèm comments, activities, assignees)
 */
export const getIssueById = async (req, res) => {
  try {
    const issueId = req.params.id;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          select: { id: true, name: true, key: true, ownerId: true },
        },
        assignees: {
          select: {
            assignedAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        sprint: {
          select: { id: true, name: true, status: true, startDate: true, endDate: true },
        },
        labels: {
          select: { id: true, label: true },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            actor: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        checklistItems: {
          include: {
            attachments: true,
          },
          orderBy: { order: "asc" },
        },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Kiểm tra user có thuộc project của issue này không
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: issue.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!isMember && issue.project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem công việc trong dự án này." });
    }

    return res.status(200).json({ issue });
  } catch (error) {
    console.error("Lỗi lấy chi tiết Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy chi tiết công việc." });
  }
};

/**
 * Cập nhật Issue (Status, Priority, Assignees, Sprint, Content, ...)
 */
export const updateIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    const {
      title,
      description,
      status,
      priority,
      type,
      sprintId,
      assigneeIds,
      labels,
      dueDate,
      order,
    } = req.body;

    const currentIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: { select: { id: true, name: true, key: true, ownerId: true } },
        assignees: { select: { userId: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!currentIssue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    // Kiểm tra quyền: phải là member của project
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: currentIssue.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!isMember && currentIssue.project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa công việc trong dự án này." });
    }

    // Xử lý ngày hoàn thành
    let completedAt = currentIssue.completedAt;
    if (status && status !== currentIssue.status) {
      if (status === "DONE") completedAt = new Date();
      else if (currentIssue.status === "DONE") completedAt = null;
    }

    const updatedIssue = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Assignees nếu có truyền mảng mới
      if (assigneeIds !== undefined) {
        await tx.issueAssignee.deleteMany({ where: { issueId } });
        if (assigneeIds.length > 0) {
          await tx.issueAssignee.createMany({
            data: assigneeIds.map((uId) => ({ issueId, userId: uId })),
          });
        }
      }

      // 2. Cập nhật Labels nếu có truyền mảng mới
      if (labels !== undefined) {
        await tx.issueLabel.deleteMany({ where: { issueId } });
        if (labels.length > 0) {
          await tx.issueLabel.createMany({
            data: labels.map((lbl) => ({ issueId, label: lbl.trim().toLowerCase() })),
          });
        }
      }

      // 3. Cập nhật các trường chính
      const issue = await tx.issue.update({
        where: { id: issueId },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description ? description.trim() : null }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(type !== undefined && { type }),
          ...(sprintId !== undefined && { sprintId: sprintId || null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(order !== undefined && { order: parseInt(order, 10) }),
          completedAt,
        },
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          reporter: { select: { id: true, name: true, email: true } },
          sprint: { select: { id: true, name: true, status: true } },
          labels: true,
        },
      });

      // 4. Ghi activity log
      await tx.activity.create({
        data: {
          projectId: currentIssue.projectId,
          issueId,
          actorId: req.user.id,
          action: "updated_issue",
          metadata: {
            changes: {
              ...(status && status !== currentIssue.status && { status: { from: currentIssue.status, to: status } }),
              ...(priority && priority !== currentIssue.priority && { priority: { from: currentIssue.priority, to: priority } }),
              ...(title && title !== currentIssue.title && { title }),
            },
          },
        },
      });

      return issue;
    });

    // Thông báo In-App + Email khi status thay đổi
    if (status && status !== currentIssue.status) {
      notifyStatusChange({
        actorId: req.user.id,
        actorName: req.user.name,
        issue: updatedIssue,
        oldStatus: currentIssue.status,
        newStatus: status,
        project: currentIssue.project,
      }).catch((err) => console.error("Lỗi notifyStatusChange updateIssue:", err.message));
    }

    // Thông báo In-App + Email cho những người vừa được assign mới
    if (assigneeIds !== undefined) {
      const oldAssigneeIds = currentIssue.assignees.map((a) => a.userId);
      const newlyAssignedIds = updatedIssue.assignees
        .filter((a) => !oldAssigneeIds.includes(a.user.id))
        .map((a) => a.user.id);

      if (newlyAssignedIds.length > 0) {
        notifyAssignment({
          actorId: req.user.id,
          actorName: req.user.name,
          assigneeIds: newlyAssignedIds,
          issue: updatedIssue,
          project: currentIssue.project,
        }).catch((err) => console.error("Lỗi notifyAssignment updateIssue:", err.message));
      }
    }

    // Phát sóng real-time cho các thành viên trong dự án
    emitToProject(currentIssue.projectId, "issue:updated", updatedIssue);

    return res.status(200).json({
      message: "Cập nhật công việc thành công!",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Lỗi cập nhật Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật công việc." });
  }
};

/**
 * Xóa Issue (Chỉ Reporter hoặc Admin dự án)
 */
export const deleteIssue = async (req, res) => {
  try {
    const issueId = req.params.id;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: req.user.id },
            },
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Công việc không tồn tại." });
    }

    const isReporter = issue.reporterId === req.user.id;
    const isOwner = issue.project.ownerId === req.user.id;
    const isAdmin = issue.project.members[0]?.role === "ADMIN";

    if (!isReporter && !isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Chỉ người tạo công việc (Reporter) hoặc Quản trị viên dự án mới được xoá công việc này.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.issue.delete({
        where: { id: issueId },
      });

      await tx.activity.create({
        data: {
          projectId: issue.projectId,
          actorId: req.user.id,
          action: "deleted_issue",
          metadata: {
            title: issue.title,
          },
        },
      });
    });

    // Phát sóng real-time cho các thành viên trong dự án
    emitToProject(issue.projectId, "issue:deleted", { issueId });

    return res.status(200).json({
      message: `Đã xoá công việc "${issue.title}" thành công!`,
    });
  } catch (error) {
    console.error("Lỗi xóa Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá công việc." });
  }
};

/**
 * Cập nhật hàng loạt vị trí (order & status) sau khi kéo thả Kanban
 */
export const reorderIssues = async (req, res) => {
  try {
    const { updates, clientSocketId } = req.body; // Mảng: [ { id, status, order } ]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Danh sách cập nhật phải là một mảng và không được rỗng." });
    }

    // Kiểm tra những task nào có thay đổi status để ghi log & thông báo
    const statusUpdates = updates.filter((u) => u.status);
    let existingIssuesMap = new Map();
    if (statusUpdates.length > 0) {
      const existing = await prisma.issue.findMany({
        where: { id: { in: statusUpdates.map((u) => u.id) } },
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
          reporter: { select: { id: true, name: true, email: true } },
        },
      });
      existing.forEach((iss) => existingIssuesMap.set(iss.id, iss));
    }

    // Thực hiện cập nhật trong transaction
    await prisma.$transaction(
      updates.map((item) =>
        prisma.issue.update({
          where: { id: item.id },
          data: {
            ...(item.status && {
              status: item.status,
              completedAt: item.status === "DONE" ? new Date() : null,
            }),
            ...(item.order !== undefined && { order: item.order }),
          },
        })
      )
    );

    // Ghi Activity log & Bắn thông báo cho các task đổi trạng thái
    for (const item of statusUpdates) {
      const existing = existingIssuesMap.get(item.id);
      if (existing && existing.status !== item.status) {
        prisma.activity.create({
          data: {
            projectId: existing.projectId,
            issueId: existing.id,
            actorId: req.user.id,
            action: "changed_status",
            metadata: {
              title: existing.title,
              from: existing.status,
              to: item.status,
            },
          },
        }).catch((e) => console.error("Lỗi ghi activity reorder:", e.message));

        notifyStatusChange({
          actorId: req.user.id,
          actorName: req.user.name,
          issue: { ...existing, status: item.status },
          oldStatus: existing.status,
          newStatus: item.status,
          project: existing.project,
        }).catch((e) => console.error("Lỗi notifyStatusChange reorder:", e.message));
      }
    }

    // Phát sóng real-time cho các thành viên trong dự án
    const targetProjectId = req.params.projectId || req.project?.id || existingIssuesMap.values().next().value?.projectId;
    if (targetProjectId) {
      emitToProject(targetProjectId, "issue:reordered", { updates, actorId: req.user.id }, clientSocketId);
    }

    return res.status(200).json({
      message: "Cập nhật vị trí các công việc thành công!",
    });
  } catch (error) {
    console.error("Lỗi sắp xếp Issue:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thứ tự công việc." });
  }
};
