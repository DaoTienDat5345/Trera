import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lấy danh sách bước dùng chung (Shared Steps) của dự án
 * GET /api/projects/:projectId/test-shared-steps
 */
export const getSharedSteps = async (req, res) => {
  try {
    const { projectId } = req.params;

    const sharedSteps = await prisma.testSharedStep.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ sharedSteps });
  } catch (error) {
    console.error("Lỗi lấy danh sách bước dùng chung:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy bước dùng chung." });
  }
};

/**
 * Tạo bước dùng chung mới
 * POST /api/projects/:projectId/test-shared-steps
 */
export const createSharedStep = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, action, testData, expectedResult } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tên bước dùng chung không được để trống." });
    }
    if (!action || !action.trim()) {
      return res.status(400).json({ message: "Hành động (Action) không được để trống." });
    }

    const sharedStep = await prisma.testSharedStep.create({
      data: {
        title: title.trim(),
        action: action.trim(),
        testData: testData?.trim() || null,
        expectedResult: expectedResult?.trim() || "",
        projectId,
      },
    });

    return res.status(201).json({
      message: "Tạo bước dùng chung thành công!",
      sharedStep,
    });
  } catch (error) {
    console.error("Lỗi tạo bước dùng chung:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo bước dùng chung." });
  }
};

/**
 * Cập nhật bước dùng chung
 * PUT /api/projects/:projectId/test-shared-steps/:stepId
 */
export const updateSharedStep = async (req, res) => {
  try {
    const { projectId, stepId } = req.params;
    const { title, action, testData, expectedResult } = req.body;

    const existing = await prisma.testSharedStep.findUnique({
      where: { id: stepId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Bước dùng chung không tồn tại." });
    }

    const updated = await prisma.testSharedStep.update({
      where: { id: stepId },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        action: action !== undefined ? action.trim() : undefined,
        testData: testData !== undefined ? (testData?.trim() || null) : undefined,
        expectedResult: expectedResult !== undefined ? expectedResult.trim() : undefined,
      },
    });

    return res.status(200).json({
      message: "Cập nhật bước dùng chung thành công!",
      sharedStep: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật bước dùng chung:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật bước dùng chung." });
  }
};

/**
 * Xoá bước dùng chung
 * DELETE /api/projects/:projectId/test-shared-steps/:stepId
 */
export const deleteSharedStep = async (req, res) => {
  try {
    const { projectId, stepId } = req.params;

    const existing = await prisma.testSharedStep.findUnique({
      where: { id: stepId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Bước dùng chung không tồn tại." });
    }

    await prisma.testSharedStep.delete({
      where: { id: stepId },
    });

    return res.status(200).json({
      message: "Đã xoá bước dùng chung thành công!",
      stepId,
    });
  } catch (error) {
    console.error("Lỗi xoá bước dùng chung:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá bước dùng chung." });
  }
};