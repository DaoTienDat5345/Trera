import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách tất cả Sprint của dự án
 */
export const getAllSprints = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { issues: true },
        },
        issues: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PLANNING, ACTIVE, COMPLETED (enum sorting hoặc xử lý custom)
        { createdAt: "desc" },
      ],
    });

    // Tính toán số lượng task theo từng trạng thái cho mỗi sprint
    const sprintsWithStats = sprints.map((sprint) => {
      const stats = {
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        total: sprint.issues.length,
      };

      sprint.issues.forEach((issue) => {
        if (issue.status === "TODO") stats.todo++;
        else if (issue.status === "IN_PROGRESS") stats.inProgress++;
        else if (issue.status === "IN_REVIEW") stats.inReview++;
        else if (issue.status === "DONE") stats.done++;
      });

      const { issues, ...sprintData } = sprint;
      return {
        ...sprintData,
        stats,
      };
    });

    return res.status(200).json({ sprints: sprintsWithStats });
  } catch (error) {
    console.error("Lỗi lấy danh sách Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách Sprint." });
  }
};

/**
 * Tạo Sprint mới (mặc định status: PLANNING)
 */
export const createSprint = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { name, goal, startDate, endDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tên Sprint." });
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu." });
    }

    const sprint = await prisma.$transaction(async (tx) => {
      const newSprint = await tx.sprint.create({
        data: {
          projectId,
          name: name.trim(),
          goal: goal ? goal.trim() : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: "PLANNING",
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "created_sprint",
          metadata: {
            sprintId: newSprint.id,
            sprintName: newSprint.name,
          },
        },
      });

      return newSprint;
    });

    return res.status(201).json({
      message: "Tạo Sprint thành công!",
      sprint,
    });
  } catch (error) {
    console.error("Lỗi tạo Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo Sprint." });
  }
};

/**
 * Cập nhật Sprint
 */
export const updateSprint = async (req, res) => {
  try {
    const { id: sprintId, projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    const existingSprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
    });

    if (!existingSprint) {
      return res.status(404).json({ message: "Sprint không tồn tại trong dự án này." });
    }

    if (existingSprint.status === "COMPLETED") {
      return res.status(422).json({ message: "Không thể chỉnh sửa Sprint đã hoàn thành." });
    }

    const parsedStart = startDate ? new Date(startDate) : existingSprint.startDate;
    const parsedEnd = endDate ? new Date(endDate) : existingSprint.endDate;

    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.sprint.update({
        where: { id: sprintId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(goal !== undefined && { goal: goal ? goal.trim() : null }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "updated_sprint",
          metadata: {
            sprintId,
            sprintName: s.name,
          },
        },
      });

      return s;
    });

    return res.status(200).json({
      message: "Cập nhật Sprint thành công!",
      sprint: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật Sprint." });
  }
};

/**
 * Bắt đầu Sprint (status -> ACTIVE)
 */
export const startSprint = async (req, res) => {
  try {
    const { id: sprintId, projectId } = req.params;

    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint không tồn tại trong dự án." });
    }

    if (sprint.status !== "PLANNING") {
      return res.status(422).json({ message: "Chỉ có thể bắt đầu Sprint đang ở trạng thái lập kế hoạch (Planning)." });
    }

    // Kiểm tra xem đã có sprint nào đang active chưa
    const activeSprint = await prisma.sprint.findFirst({
      where: {
        projectId,
        status: "ACTIVE",
      },
    });

    if (activeSprint) {
      return res.status(409).json({
        message: `Dự án đang có Sprint "${activeSprint.name}" đang hoạt động. Vui lòng hoàn thành Sprint đó trước khi bắt đầu Sprint mới.`,
      });
    }

    const startedSprint = await prisma.$transaction(async (tx) => {
      const s = await tx.sprint.update({
        where: { id: sprintId },
        data: {
          status: "ACTIVE",
          startDate: sprint.startDate || new Date(),
        },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "started_sprint",
          metadata: {
            sprintId,
            sprintName: s.name,
          },
        },
      });

      return s;
    });

    return res.status(200).json({
      message: `Sprint "${startedSprint.name}" đã bắt đầu!`,
      sprint: startedSprint,
    });
  } catch (error) {
    console.error("Lỗi bắt đầu Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi bắt đầu Sprint." });
  }
};

/**
 * Kết thúc Sprint (status -> COMPLETED, chuyển các issue chưa DONE về Backlog)
 */
export const completeSprint = async (req, res) => {
  try {
    const { id: sprintId, projectId } = req.params;

    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint không tồn tại trong dự án." });
    }

    if (sprint.status !== "ACTIVE") {
      return res.status(422).json({ message: "Chỉ có thể kết thúc Sprint đang hoạt động (Active)." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Chuyển tất cả issue chưa DONE trong sprint này về backlog (sprintId = null)
      const movedIssues = await tx.issue.updateMany({
        where: {
          sprintId,
          status: { not: "DONE" },
        },
        data: {
          sprintId: null,
        },
      });

      // 2. Cập nhật trạng thái sprint sang COMPLETED
      const completed = await tx.sprint.update({
        where: { id: sprintId },
        data: {
          status: "COMPLETED",
          endDate: new Date(),
        },
      });

      // 3. Ghi activity log
      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "completed_sprint",
          metadata: {
            sprintId,
            sprintName: completed.name,
            movedIssuesToBacklog: movedIssues.count,
          },
        },
      });

      return { completed, movedCount: movedIssues.count };
    });

    return res.status(200).json({
      message: `Đã hoàn thành Sprint "${result.completed.name}" thành công!`,
      sprint: result.completed,
      movedToBacklogCount: result.movedCount,
    });
  } catch (error) {
    console.error("Lỗi kết thúc Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi kết thúc Sprint." });
  }
};

/**
 * Xóa Sprint (chỉ áp dụng với Sprint ở trạng thái PLANNING)
 */
export const deleteSprint = async (req, res) => {
  try {
    const { id: sprintId, projectId } = req.params;

    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
    });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint không tồn tại trong dự án." });
    }

    if (sprint.status !== "PLANNING") {
      return res.status(422).json({
        message: "Chỉ có thể xoá Sprint đang ở trạng thái lập kế hoạch (Planning). Không thể xoá Sprint đang chạy hoặc đã kết thúc.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Đưa các issue trong sprint này về backlog
      await tx.issue.updateMany({
        where: { sprintId },
        data: { sprintId: null },
      });

      await tx.sprint.delete({
        where: { id: sprintId },
      });

      await tx.activity.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: "deleted_sprint",
          metadata: {
            sprintName: sprint.name,
          },
        },
      });
    });

    return res.status(200).json({
      message: `Đã xoá Sprint "${sprint.name}" thành công. Các công việc liên quan đã được chuyển về Backlog.`,
    });
  } catch (error) {
    console.error("Lỗi xóa Sprint:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá Sprint." });
  }
};
