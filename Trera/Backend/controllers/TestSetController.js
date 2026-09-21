import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lấy danh sách Test Sets của dự án
 * GET /api/projects/:projectId/test-sets
 */
export const getTestSets = async (req, res) => {
  try {
    const { projectId } = req.params;

    const testSets = await prisma.testSet.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { testCases: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ testSets });
  } catch (error) {
    console.error("Lỗi lấy danh sách Test Sets:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách Test Sets." });
  }
};

/**
 * Lấy chi tiết một Test Set cùng danh sách test cases
 * GET /api/projects/:projectId/test-sets/:setId
 */
export const getTestSetById = async (req, res) => {
  try {
    const { projectId, setId } = req.params;

    const testSet = await prisma.testSet.findUnique({
      where: { id: setId },
      include: {
        testCases: {
          include: {
            testCase: {
              include: {
                folder: { select: { id: true, name: true } },
                author: { select: { id: true, name: true, avatar: true } },
                _count: { select: { steps: true } },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!testSet || testSet.projectId !== projectId) {
      return res.status(404).json({ message: "Test Set không tồn tại." });
    }

    return res.status(200).json({ testSet });
  } catch (error) {
    console.error("Lỗi lấy chi tiết Test Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy chi tiết Test Set." });
  }
};

/**
 * Tạo Test Set mới
 * POST /api/projects/:projectId/test-sets
 */
export const createTestSet = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, testCaseIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên Test Set không được để trống." });
    }

    const testSet = await prisma.$transaction(async (tx) => {
      const created = await tx.testSet.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          projectId,
        },
      });

      if (Array.isArray(testCaseIds) && testCaseIds.length > 0) {
        // Lọc testCaseIds thuộc đúng project
        const validCases = await tx.testCase.findMany({
          where: { id: { in: testCaseIds }, projectId },
          select: { id: true },
        });

        if (validCases.length > 0) {
          await tx.testSetCase.createMany({
            data: validCases.map((c, idx) => ({
              testSetId: created.id,
              testCaseId: c.id,
              order: idx + 1,
            })),
          });
        }
      }

      return created;
    });

    const fullSet = await prisma.testSet.findUnique({
      where: { id: testSet.id },
      include: {
        _count: { select: { testCases: true } },
      },
    });

    return res.status(201).json({
      message: `Đã tạo Test Set "${fullSet.name}" thành công!`,
      testSet: fullSet,
    });
  } catch (error) {
    console.error("Lỗi tạo Test Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo Test Set." });
  }
};

/**
 * Cập nhật Test Set
 * PUT /api/projects/:projectId/test-sets/:setId
 */
export const updateTestSet = async (req, res) => {
  try {
    const { projectId, setId } = req.params;
    const { name, description, testCaseIds } = req.body;

    const existing = await prisma.testSet.findUnique({
      where: { id: setId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test Set không tồn tại." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.testSet.update({
        where: { id: setId },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          description: description !== undefined ? (description?.trim() || null) : undefined,
        },
      });

      // Nếu truyền testCaseIds thì đồng bộ lại
      if (Array.isArray(testCaseIds)) {
        await tx.testSetCase.deleteMany({ where: { testSetId: setId } });

        if (testCaseIds.length > 0) {
          const validCases = await tx.testCase.findMany({
            where: { id: { in: testCaseIds }, projectId },
            select: { id: true },
          });

          if (validCases.length > 0) {
            await tx.testSetCase.createMany({
              data: validCases.map((c, idx) => ({
                testSetId: setId,
                testCaseId: c.id,
                order: idx + 1,
              })),
            });
          }
        }
      }
    });

    const updated = await prisma.testSet.findUnique({
      where: { id: setId },
      include: {
        _count: { select: { testCases: true } },
      },
    });

    return res.status(200).json({
      message: "Cập nhật Test Set thành công!",
      testSet: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật Test Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật Test Set." });
  }
};

/**
 * Xoá Test Set
 * DELETE /api/projects/:projectId/test-sets/:setId
 */
export const deleteTestSet = async (req, res) => {
  try {
    const { projectId, setId } = req.params;

    const existing = await prisma.testSet.findUnique({
      where: { id: setId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test Set không tồn tại." });
    }

    await prisma.testSet.delete({
      where: { id: setId },
    });

    return res.status(200).json({
      message: `Đã xoá Test Set "${existing.name}" thành công!`,
      setId,
    });
  } catch (error) {
    console.error("Lỗi xoá Test Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá Test Set." });
  }
};

/**
 * Thêm các test case vào Test Set
 * POST /api/projects/:projectId/test-sets/:setId/cases
 */
export const addCasesToSet = async (req, res) => {
  try {
    const { projectId, setId } = req.params;
    const { testCaseIds } = req.body;

    if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất một test case." });
    }

    const testSet = await prisma.testSet.findUnique({ where: { id: setId } });
    if (!testSet || testSet.projectId !== projectId) {
      return res.status(404).json({ message: "Test Set không tồn tại." });
    }

    // Lọc các case chưa có trong set
    const existingLinks = await prisma.testSetCase.findMany({
      where: { testSetId: setId, testCaseId: { in: testCaseIds } },
      select: { testCaseId: true },
    });
    const existingIds = new Set(existingLinks.map((l) => l.testCaseId));
    const newCaseIds = testCaseIds.filter((id) => !existingIds.has(id));

    if (newCaseIds.length > 0) {
      const highestOrder = await prisma.testSetCase.findFirst({
        where: { testSetId: setId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const startOrder = highestOrder ? highestOrder.order + 1 : 1;

      await prisma.testSetCase.createMany({
        data: newCaseIds.map((cId, idx) => ({
          testSetId: setId,
          testCaseId: cId,
          order: startOrder + idx,
        })),
      });
    }

    return res.status(200).json({
      message: `Đã thêm ${newCaseIds.length} test case vào Test Set.`,
      addedCount: newCaseIds.length,
    });
  } catch (error) {
    console.error("Lỗi thêm test cases vào Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm test cases vào Set." });
  }
};

/**
 * Gỡ một test case khỏi Test Set
 * DELETE /api/projects/:projectId/test-sets/:setId/cases/:caseId
 */
export const removeCaseFromSet = async (req, res) => {
  try {
    const { projectId, setId, caseId } = req.params;

    const testSet = await prisma.testSet.findUnique({ where: { id: setId } });
    if (!testSet || testSet.projectId !== projectId) {
      return res.status(404).json({ message: "Test Set không tồn tại." });
    }

    await prisma.testSetCase.deleteMany({
      where: { testSetId: setId, testCaseId: caseId },
    });

    return res.status(200).json({
      message: "Đã gỡ test case khỏi Test Set thành công!",
      caseId,
    });
  } catch (error) {
    console.error("Lỗi gỡ test case khỏi Set:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gỡ test case khỏi Set." });
  }
};