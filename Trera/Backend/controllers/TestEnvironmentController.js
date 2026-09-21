import { prisma } from "../config/prisma.js";

const DEFAULT_ENVIRONMENTS = [
  { name: "Staging (Web Chrome)", category: "Web" },
  { name: "Production (Web)", category: "Web" },
  { name: "Mobile Staging (iOS / Android)", category: "Mobile" },
  { name: "API / Backend Staging", category: "API" },
];

/**
 * Lấy danh sách môi trường kiểm thử (tự động khởi tạo nếu chưa có)
 */
export const getEnvironments = async (req, res) => {
  try {
    const { projectId } = req.params;

    let environments = await prisma.testEnvironment.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    if (environments.length === 0) {
      // Tự động seed các môi trường mặc định
      await prisma.testEnvironment.createMany({
        data: DEFAULT_ENVIRONMENTS.map((env) => ({
          ...env,
          projectId,
        })),
      });

      environments = await prisma.testEnvironment.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });
    }

    res.status(200).json({ environments });
  } catch (error) {
    console.error("Lỗi lấy danh sách môi trường:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách môi trường kiểm thử." });
  }
};

/**
 * Tạo môi trường kiểm thử mới
 */
export const createEnvironment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên môi trường kiểm thử là bắt buộc." });
    }

    const environment = await prisma.testEnvironment.create({
      data: {
        name: name.trim(),
        category: category?.trim() || null,
        projectId,
      },
    });

    res.status(201).json({
      message: "Tạo môi trường kiểm thử thành công.",
      environment,
    });
  } catch (error) {
    console.error("Lỗi tạo môi trường:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo môi trường kiểm thử." });
  }
};

/**
 * Xóa môi trường kiểm thử
 */
export const deleteEnvironment = async (req, res) => {
  try {
    const { envId } = req.params;

    await prisma.testEnvironment.delete({
      where: { id: envId },
    });

    res.status(200).json({ message: "Đã xóa môi trường kiểm thử thành công." });
  } catch (error) {
    console.error("Lỗi xóa môi trường:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xóa môi trường kiểm thử." });
  }
};
