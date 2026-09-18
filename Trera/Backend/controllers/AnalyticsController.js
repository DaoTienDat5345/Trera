import { prisma } from "../config/prisma.js";

/**
 * Thống kê & Báo cáo tổng quan dự án (Burndown Chart, Tiến độ, Workload)
 * GET /api/projects/:id/analytics?sprintId=all|active|<id>
 */
export const getProjectAnalytics = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { sprintId } = req.query;

    // 1. Kiểm tra dự án và lấy danh sách thành viên
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          select: {
            role: true,
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại." });
    }

    // 2. Lấy danh sách tất cả Sprint của dự án
    const allSprints = await prisma.sprint.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        goal: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Xác định Sprint được chọn
    let targetSprint = null;
    let issueFilter = { projectId };

    if (sprintId === "all") {
      targetSprint = null; // Xem toàn bộ dự án
    } else if (sprintId && sprintId !== "active") {
      targetSprint = allSprints.find((s) => s.id === sprintId) || null;
      if (targetSprint) {
        issueFilter.sprintId = targetSprint.id;
      }
    } else {
      // Mặc định: chọn sprint ACTIVE, nếu không có thì lấy sprint mới nhất
      targetSprint = allSprints.find((s) => s.status === "ACTIVE") || allSprints[0] || null;
      if (targetSprint) {
        issueFilter.sprintId = targetSprint.id;
      }
    }

    // 4. Lấy danh sách Issue theo bộ lọc
    const issues = await prisma.issue.findMany({
      where: issueFilter,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        assignees: {
          select: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();
    const total = issues.length;
    const completed = issues.filter((i) => i.status === "DONE").length;
    const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const inReview = issues.filter((i) => i.status === "IN_REVIEW").length;
    const todo = issues.filter((i) => i.status === "TODO").length;
    const overdue = issues.filter(
      (i) => i.dueDate && new Date(i.dueDate) < now && i.status !== "DONE"
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 5. Thống kê theo Trạng thái
    const byStatus = [
      {
        status: "TODO",
        label: "Cần làm",
        count: todo,
        percentage: total > 0 ? Math.round((todo / total) * 100) : 0,
        color: "#94a3b8", // slate-400
      },
      {
        status: "IN_PROGRESS",
        label: "Đang làm",
        count: inProgress,
        percentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
        color: "#6366f1", // indigo-500
      },
      {
        status: "IN_REVIEW",
        label: "Đang review",
        count: inReview,
        percentage: total > 0 ? Math.round((inReview / total) * 100) : 0,
        color: "#f59e0b", // amber-500
      },
      {
        status: "DONE",
        label: "Hoàn thành",
        count: completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        color: "#10b981", // emerald-500
      },
    ];

    // 6. Thống kê theo Độ ưu tiên
    const priorityLabels = {
      URGENT: { label: "Khẩn cấp", color: "#ef4444" },
      HIGH: { label: "Cao", color: "#f97316" },
      MEDIUM: { label: "Trung bình", color: "#eab308" },
      LOW: { label: "Thấp", color: "#38bdf8" },
    };
    const byPriority = Object.keys(priorityLabels).map((p) => {
      const count = issues.filter((i) => i.priority === p).length;
      return {
        priority: p,
        label: priorityLabels[p].label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: priorityLabels[p].color,
      };
    });

    // 7. Thống kê theo Loại công việc
    const typeLabels = {
      TASK: { label: "Công việc", color: "#6366f1" },
      BUG: { label: "Lỗi (Bug)", color: "#ef4444" },
      FEATURE: { label: "Tính năng", color: "#10b981" },
      IMPROVEMENT: { label: "Cải tiến", color: "#a855f7" },
    };
    const byType = Object.keys(typeLabels).map((t) => {
      const count = issues.filter((i) => i.type === t).length;
      return {
        type: t,
        label: typeLabels[t].label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: typeLabels[t].color,
      };
    });

    // 8. Thống kê khối lượng công việc theo Thành viên (Team Workload)
    const membersMap = new Map();

    // Thêm Owner vào danh sách
    membersMap.set(project.owner.id, {
      user: project.owner,
      role: "OWNER",
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
    });

    // Thêm các Member khác
    project.members.forEach((m) => {
      if (!membersMap.has(m.user.id)) {
        membersMap.set(m.user.id, {
          user: m.user,
          role: m.role,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
        });
      }
    });

    let unassignedCount = 0;

    issues.forEach((issue) => {
      if (!issue.assignees || issue.assignees.length === 0) {
        unassignedCount++;
      } else {
        issue.assignees.forEach(({ user }) => {
          if (membersMap.has(user.id)) {
            const m = membersMap.get(user.id);
            m.total++;
            if (issue.status === "DONE") m.completed++;
            else if (issue.status === "IN_PROGRESS" || issue.status === "IN_REVIEW") m.inProgress++;
            else m.todo++;
          }
        });
      }
    });

    const memberWorkload = Array.from(membersMap.values()).map((m) => ({
      ...m,
      completionRate: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // 9. Tính toán dữ liệu Burndown Chart
    let burndownDays = [];
    let idealLine = [];
    let actualLine = [];

    // Xác định mốc thời gian bắt đầu và kết thúc
    let startDate = targetSprint?.startDate ? new Date(targetSprint.startDate) : null;
    let endDate = targetSprint?.endDate ? new Date(targetSprint.endDate) : null;

    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      // Nếu sprint chưa đặt ngày hoặc xem All, lấy khoảng 14 ngày gần nhất
      const dEnd = new Date();
      const dStart = new Date();
      dStart.setDate(dEnd.getDate() - 13);
      startDate = dStart;
      endDate = dEnd;
    }

    // Đảm bảo startDate <= endDate
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Tạo danh sách các ngày
    const dayDiff = Math.max(1, Math.min(60, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))));
    const idealStep = total / dayDiff;

    for (let i = 0; i <= dayDiff; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLabel = `${String(currentDay.getDate()).padStart(2, "0")}/${String(currentDay.getMonth() + 1).padStart(2, "0")}`;
      burndownDays.push(dayLabel);

      // Đường lý tưởng giảm đều về 0
      const idealRemaining = Math.max(0, Math.round((total - i * idealStep) * 10) / 10);
      idealLine.push(idealRemaining);

      // Đường thực tế: số task chưa hoàn thành tính đến cuối ngày đó
      if (dayEnd <= now || i === 0) {
        // Chỉ tính cho những ngày đã hoặc đang diễn ra
        const remainingCount = issues.filter((iss) => {
          if (!iss.completedAt) return true; // Chưa hoàn thành bao giờ
          const compDate = new Date(iss.completedAt);
          return compDate > dayEnd; // Hoàn thành sau ngày này
        }).length;
        actualLine.push(remainingCount);
      } else {
        // Ngày trong tương lai -> không vẽ actual
        actualLine.push(null);
      }
    }

    return res.status(200).json({
      summary: {
        total,
        completed,
        inProgress,
        inReview,
        todo,
        overdue,
        completionRate,
        unassignedCount,
      },
      byStatus,
      byPriority,
      byType,
      memberWorkload,
      burndown: {
        days: burndownDays,
        ideal: idealLine,
        actual: actualLine,
      },
      selectedSprint: targetSprint,
      sprints: allSprints,
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu thống kê dự án:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy báo cáo thống kê." });
  }
};