import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách lịch sử hoạt động (Activity Log) của một dự án
 * Hỗ trợ phân trang, lọc theo action type
 */
export const getProjectActivities = async (req, res) => {
  try {
    const projectId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const type = req.query.type || "all";

    const where = {
      projectId,
      ...(type !== "all" ? { action: type } : {}),
    };

    const [activities, totalCount] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          issue: {
            select: { id: true, title: true, status: true, priority: true, type: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return res.status(200).json({
      activities,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử hoạt động:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy lịch sử hoạt động." });
  }
};
