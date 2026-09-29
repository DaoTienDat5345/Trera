import { prisma } from "../config/prisma.js";

/**
 * Lấy danh sách thông báo của người dùng hiện tại
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const unreadOnly = req.query.unread === "true";

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, totalCount, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return res.status(200).json({
      notifications,
      unreadCount,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông báo." });
  }
};

/**
 * Đánh dấu 1 thông báo đã đọc
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo." });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật thông báo này." });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: "Đã đánh dấu đã đọc.",
      notification: updated,
    });
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông báo." });
  }
};

/**
 * Đánh dấu TẤT CẢ thông báo là đã đọc
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      message: "Đã đánh dấu tất cả là đã đọc.",
      count: result.count,
    });
  } catch (error) {
    console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông báo." });
  }
};

/**
 * Xóa 1 thông báo
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo." });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa thông báo này." });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Đã xóa thông báo thành công.",
    });
  } catch (error) {
    console.error("Lỗi xóa thông báo:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa thông báo." });
  }
};
