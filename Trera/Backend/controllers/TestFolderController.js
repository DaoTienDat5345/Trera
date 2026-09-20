import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lấy danh sách cây thư mục của dự án
 * GET /api/projects/:projectId/test-folders
 */
export const getFolders = async (req, res) => {
  try {
    const { projectId } = req.params;

    const folders = await prisma.testFolder.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return res.status(200).json({ folders });
  } catch (error) {
    console.error("Lỗi lấy danh sách thư mục test:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách thư mục." });
  }
};

/**
 * Tạo thư mục test mới
 * POST /api/projects/:projectId/test-folders
 */
export const createFolder = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên thư mục không được để trống." });
    }

    if (parentId) {
      const parent = await prisma.testFolder.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.projectId !== projectId) {
        return res.status(404).json({ message: "Thư mục cha không tồn tại trong dự án." });
      }
    }

    const lastFolder = await prisma.testFolder.findFirst({
      where: { projectId, parentId: parentId || null },
      orderBy: { order: "desc" },
    });
    const order = lastFolder ? lastFolder.order + 1 : 0;

    const folder = await prisma.testFolder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
        order,
        projectId,
      },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
    });

    return res.status(201).json({
      message: "Tạo thư mục thành công!",
      folder,
    });
  } catch (error) {
    console.error("Lỗi tạo thư mục test:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo thư mục." });
  }
};

/**
 * Cập nhật thư mục test
 * PUT /api/projects/:projectId/test-folders/:folderId
 */
export const updateFolder = async (req, res) => {
  try {
    const { projectId, folderId } = req.params;
    const { name, description, parentId, order } = req.body;

    const folder = await prisma.testFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.projectId !== projectId) {
      return res.status(404).json({ message: "Thư mục không tồn tại." });
    }

    // Tránh thư mục trỏ parent vào chính nó
    if (parentId && parentId === folderId) {
      return res.status(400).json({ message: "Thư mục cha không thể là chính nó." });
    }

    const updatedFolder = await prisma.testFolder.update({
      where: { id: folderId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        parentId: parentId !== undefined ? (parentId || null) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
    });

    return res.status(200).json({
      message: "Cập nhật thư mục thành công!",
      folder: updatedFolder,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thư mục test:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thư mục." });
  }
};

/**
 * Xoá thư mục test
 * DELETE /api/projects/:projectId/test-folders/:folderId
 */
export const deleteFolder = async (req, res) => {
  try {
    const { projectId, folderId } = req.params;

    const folder = await prisma.testFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.projectId !== projectId) {
      return res.status(404).json({ message: "Thư mục không tồn tại." });
    }

    await prisma.testFolder.delete({
      where: { id: folderId },
    });

    return res.status(200).json({
      message: "Đã xoá thư mục thành công!",
      folderId,
    });
  } catch (error) {
    console.error("Lỗi xoá thư mục test:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá thư mục." });
  }
};