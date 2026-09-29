import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lấy danh sách Test Case theo bộ lọc
 * GET /api/projects/:projectId/test-cases
 */
export const getTestCases = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { folderId, type, priority, search } = req.query;

    const where = { projectId };

    if (folderId !== undefined) {
      if (folderId === "root" || folderId === "null") {
        where.folderId = null;
      } else if (folderId !== "all" && folderId.trim() !== "") {
        where.folderId = folderId;
      }
    }

    if (type && ["MANUAL", "BDD"].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    if (priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority.toUpperCase())) {
      where.priority = priority.toUpperCase();
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { key: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { steps: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({ testCases });
  } catch (error) {
    console.error("Lỗi lấy danh sách test case:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách test case." });
  }
};

/**
 * Lấy chi tiết một Test Case
 * GET /api/projects/:projectId/test-cases/:testCaseId
 */
export const getTestCaseById = async (req, res) => {
  try {
    const { projectId, testCaseId } = req.params;

    const testCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        folder: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, avatar: true, email: true } },
        steps: {
          orderBy: { order: "asc" },
        },
        sharedStepLinks: {
          include: { sharedStep: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!testCase || testCase.projectId !== projectId) {
      return res.status(404).json({ message: "Test case không tồn tại." });
    }

    return res.status(200).json({ testCase });
  } catch (error) {
    console.error("Lỗi lấy chi tiết test case:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy chi tiết test case." });
  }
};

/**
 * Tạo Test Case mới
 * POST /api/projects/:projectId/test-cases
 */
export const createTestCase = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      type = "MANUAL",
      priority = "MEDIUM",
      preconditions,
      gherkinContent,
      folderId,
      steps = [],
      sharedStepIds = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Tiêu đề test case không được để trống." });
    }

    const cleanType = type.toUpperCase() === "BDD" ? "BDD" : "MANUAL";
    const cleanPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority?.toUpperCase())
      ? priority.toUpperCase()
      : "MEDIUM";

    // Lấy project để lấy key
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại." });
    }

    // Kiểm tra folder nếu có
    if (folderId) {
      const folder = await prisma.testFolder.findUnique({ where: { id: folderId } });
      if (!folder || folder.projectId !== projectId) {
        return res.status(404).json({ message: "Thư mục không tồn tại trong dự án." });
      }
    }

    // Đếm số test case hiện tại để sinh key duy nhất TRE-TC-1, TRE-TC-2...
    const count = await prisma.testCase.count({ where: { projectId } });
    const key = `${project.key}-TC-${count + 1}`;

    const newTestCase = await prisma.$transaction(async (tx) => {
      const createdCase = await tx.testCase.create({
        data: {
          key,
          title: title.trim(),
          description: description?.trim() || null,
          type: cleanType,
          priority: cleanPriority,
          preconditions: preconditions?.trim() || null,
          gherkinContent: cleanType === "BDD" ? (gherkinContent?.trim() || null) : null,
          folderId: folderId || null,
          projectId,
          authorId: req.user.id,
        },
      });

      // Tạo các steps nếu là MANUAL test
      if (cleanType === "MANUAL" && Array.isArray(steps) && steps.length > 0) {
        const stepsData = steps.map((step, idx) => ({
          testCaseId: createdCase.id,
          order: step.order !== undefined ? step.order : idx + 1,
          action: step.action || "",
          testData: step.testData || null,
          expectedResult: step.expectedResult || "",
        }));

        await tx.testStep.createMany({
          data: stepsData,
        });
      }

      // Gắn shared steps nếu có
      if (Array.isArray(sharedStepIds) && sharedStepIds.length > 0) {
        const linkData = sharedStepIds.map((sharedStepId, idx) => ({
          testCaseId: createdCase.id,
          sharedStepId,
          order: idx + 1,
        }));
        await tx.testCaseSharedStep.createMany({
          data: linkData,
        });
      }

      return createdCase;
    });

    // Lấy dữ liệu đầy đủ sau tạo
    const fullTestCase = await prisma.testCase.findUnique({
      where: { id: newTestCase.id },
      include: {
        folder: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, avatar: true } },
        steps: { orderBy: { order: "asc" } },
        sharedStepLinks: { include: { sharedStep: true } },
      },
    });

    return res.status(201).json({
      message: `Đã tạo test case ${key} thành công!`,
      testCase: fullTestCase,
    });
  } catch (error) {
    console.error("Lỗi tạo test case:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo test case." });
  }
};

/**
 * Cập nhật Test Case
 * PUT /api/projects/:projectId/test-cases/:testCaseId
 */
export const updateTestCase = async (req, res) => {
  try {
    const { projectId, testCaseId } = req.params;
    const {
      title,
      description,
      type,
      priority,
      preconditions,
      gherkinContent,
      folderId,
      order,
      steps,
      sharedStepIds,
    } = req.body;

    const existing = await prisma.testCase.findUnique({
      where: { id: testCaseId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test case không tồn tại." });
    }

    const cleanType = type ? (type.toUpperCase() === "BDD" ? "BDD" : "MANUAL") : undefined;
    const cleanPriority = priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority.toUpperCase())
      ? priority.toUpperCase()
      : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.testCase.update({
        where: { id: testCaseId },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          description: description !== undefined ? (description?.trim() || null) : undefined,
          type: cleanType,
          priority: cleanPriority,
          preconditions: preconditions !== undefined ? (preconditions?.trim() || null) : undefined,
          gherkinContent: gherkinContent !== undefined ? (gherkinContent?.trim() || null) : undefined,
          folderId: folderId !== undefined ? (folderId || null) : undefined,
          order: order !== undefined ? Number(order) : undefined,
        },
      });

      // Nếu có cập nhật danh sách steps
      if (Array.isArray(steps)) {
        await tx.testStep.deleteMany({ where: { testCaseId } });
        if (steps.length > 0) {
          await tx.testStep.createMany({
            data: steps.map((s, idx) => ({
              testCaseId,
              order: s.order !== undefined ? s.order : idx + 1,
              action: s.action || "",
              testData: s.testData || null,
              expectedResult: s.expectedResult || "",
            })),
          });
        }
      }

      // Nếu có cập nhật sharedStepIds
      if (Array.isArray(sharedStepIds)) {
        await tx.testCaseSharedStep.deleteMany({ where: { testCaseId } });
        if (sharedStepIds.length > 0) {
          await tx.testCaseSharedStep.createMany({
            data: sharedStepIds.map((sId, idx) => ({
              testCaseId,
              sharedStepId: sId,
              order: idx + 1,
            })),
          });
        }
      }
    });

    const updatedTestCase = await prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        folder: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, avatar: true } },
        steps: { orderBy: { order: "asc" } },
        sharedStepLinks: { include: { sharedStep: true } },
      },
    });

    return res.status(200).json({
      message: "Cập nhật test case thành công!",
      testCase: updatedTestCase,
    });
  } catch (error) {
    console.error("Lỗi cập nhật test case:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật test case." });
  }
};

/**
 * Xoá Test Case
 * DELETE /api/projects/:projectId/test-cases/:testCaseId
 */
export const deleteTestCase = async (req, res) => {
  try {
    const { projectId, testCaseId } = req.params;

    const existing = await prisma.testCase.findUnique({
      where: { id: testCaseId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test case không tồn tại." });
    }

    await prisma.testCase.delete({
      where: { id: testCaseId },
    });

    return res.status(200).json({
      message: `Đã xoá test case ${existing.key} thành công!`,
      testCaseId,
    });
  } catch (error) {
    console.error("Lỗi xoá test case:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá test case." });
  }
};