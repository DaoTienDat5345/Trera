import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const calculatePlanMetrics = (planCases = []) => {
  const total = planCases.length;
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  let skipped = 0;
  let untested = 0;

  for (const c of planCases) {
    switch (c.status) {
      case "PASSED":
        passed++;
        break;
      case "FAILED":
        failed++;
        break;
      case "BLOCKED":
        blocked++;
        break;
      case "SKIPPED":
        skipped++;
        break;
      default:
        untested++;
        break;
    }
  }

  const completed = passed + failed + blocked + skipped;
  const passPercentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  const failPercentage = total > 0 ? Math.round((failed / total) * 100) : 0;
  const blockedPercentage = total > 0 ? Math.round((blocked / total) * 100) : 0;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    passed,
    failed,
    blocked,
    skipped,
    untested,
    completed,
    passPercentage,
    failPercentage,
    blockedPercentage,
    completionPercentage,
  };
};

/**
 * Lấy danh sách Test Plans của dự án
 * GET /api/projects/:projectId/test-plans
 */
export const getTestPlans = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, sprintId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (sprintId) where.sprintId = sprintId;

    const testPlans = await prisma.testPlan.findMany({
      where,
      include: {
        sprint: { select: { id: true, name: true, status: true } },
        testCases: {
          select: { status: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const plansWithMetrics = testPlans.map((plan) => {
      const metrics = calculatePlanMetrics(plan.testCases);
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        dueDate: plan.dueDate,
        projectId: plan.projectId,
        sprint: plan.sprint,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        metrics,
      };
    });

    return res.status(200).json({ testPlans: plansWithMetrics });
  } catch (error) {
    console.error("Lỗi lấy danh sách Test Plans:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách Test Plans." });
  }
};

/**
 * Lấy chi tiết một Test Plan kèm danh sách test cases & metrics
 * GET /api/projects/:projectId/test-plans/:planId
 */
export const getTestPlanById = async (req, res) => {
  try {
    const { projectId, planId } = req.params;

    const testPlan = await prisma.testPlan.findUnique({
      where: { id: planId },
      include: {
        sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        testCases: {
          include: {
            testCase: {
              include: {
                folder: { select: { id: true, name: true } },
                author: { select: { id: true, name: true, avatar: true } },
                steps: { orderBy: { order: "asc" } },
                _count: { select: { steps: true } },
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!testPlan || testPlan.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    const metrics = calculatePlanMetrics(testPlan.testCases);

    return res.status(200).json({
      testPlan: {
        ...testPlan,
        metrics,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết Test Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy chi tiết Test Plan." });
  }
};

/**
 * Tạo Test Plan mới
 * POST /api/projects/:projectId/test-plans
 */
export const createTestPlan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      status = "DRAFT",
      dueDate,
      sprintId,
      testCaseIds = [],
      testSetIds = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên Kế hoạch kiểm thử không được để trống." });
    }

    // Nếu có truyền testSetIds, tự động thu thập testCaseIds từ các Sets đó
    const collectedCaseIds = new Set(Array.isArray(testCaseIds) ? testCaseIds : []);

    if (Array.isArray(testSetIds) && testSetIds.length > 0) {
      const setCases = await prisma.testSetCase.findMany({
        where: { testSetId: { in: testSetIds } },
        select: { testCaseId: true },
      });
      for (const sc of setCases) {
        collectedCaseIds.add(sc.testCaseId);
      }
    }

    const finalCaseIds = Array.from(collectedCaseIds);

    const testPlan = await prisma.$transaction(async (tx) => {
      const created = await tx.testPlan.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          status: ["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"].includes(status?.toUpperCase())
            ? status.toUpperCase()
            : "DRAFT",
          dueDate: dueDate ? new Date(dueDate) : null,
          sprintId: sprintId || null,
          projectId,
        },
      });

      if (finalCaseIds.length > 0) {
        // Đảm bảo các test case thuộc dự án
        const validCases = await tx.testCase.findMany({
          where: { id: { in: finalCaseIds }, projectId },
          select: { id: true },
        });

        if (validCases.length > 0) {
          await tx.testPlanCase.createMany({
            data: validCases.map((c, idx) => ({
              testPlanId: created.id,
              testCaseId: c.id,
              status: "UNTESTED",
              order: idx + 1,
            })),
          });
        }
      }

      return created;
    });

    const fullPlan = await prisma.testPlan.findUnique({
      where: { id: testPlan.id },
      include: {
        sprint: { select: { id: true, name: true } },
        testCases: { select: { status: true } },
      },
    });

    return res.status(201).json({
      message: `Đã tạo Kế hoạch kiểm thử "${fullPlan.name}" thành công!`,
      testPlan: {
        ...fullPlan,
        metrics: calculatePlanMetrics(fullPlan.testCases),
      },
    });
  } catch (error) {
    console.error("Lỗi tạo Test Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tạo Kế hoạch kiểm thử." });
  }
};

/**
 * Cập nhật Test Plan
 * PUT /api/projects/:projectId/test-plans/:planId
 */
export const updateTestPlan = async (req, res) => {
  try {
    const { projectId, planId } = req.params;
    const { name, description, status, dueDate, sprintId, testCaseIds } = req.body;

    const existing = await prisma.testPlan.findUnique({
      where: { id: planId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.testPlan.update({
        where: { id: planId },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          description: description !== undefined ? (description?.trim() || null) : undefined,
          status: status !== undefined ? status : undefined,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
          sprintId: sprintId !== undefined ? (sprintId || null) : undefined,
        },
      });

      // Nếu có đồng bộ lại testCaseIds
      if (Array.isArray(testCaseIds)) {
        // Giữ lại trạng thái kết quả của các case đang có
        const currentCases = await tx.testPlanCase.findMany({
          where: { testPlanId: planId },
        });
        const currentStatusMap = new Map(currentCases.map((c) => [c.testCaseId, c]));

        await tx.testPlanCase.deleteMany({ where: { testPlanId: planId } });

        if (testCaseIds.length > 0) {
          const validCases = await tx.testCase.findMany({
            where: { id: { in: testCaseIds }, projectId },
            select: { id: true },
          });

          await tx.testPlanCase.createMany({
            data: validCases.map((c, idx) => {
              const old = currentStatusMap.get(c.id);
              return {
                testPlanId: planId,
                testCaseId: c.id,
                status: old ? old.status : "UNTESTED",
                note: old ? old.note : null,
                executedAt: old ? old.executedAt : null,
                order: idx + 1,
              };
            }),
          });
        }
      }
    });

    const updated = await prisma.testPlan.findUnique({
      where: { id: planId },
      include: {
        sprint: { select: { id: true, name: true } },
        testCases: { select: { status: true } },
      },
    });

    return res.status(200).json({
      message: "Cập nhật Kế hoạch kiểm thử thành công!",
      testPlan: {
        ...updated,
        metrics: calculatePlanMetrics(updated.testCases),
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật Test Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật Test Plan." });
  }
};

/**
 * Xoá Test Plan
 * DELETE /api/projects/:projectId/test-plans/:planId
 */
export const deleteTestPlan = async (req, res) => {
  try {
    const { projectId, planId } = req.params;

    const existing = await prisma.testPlan.findUnique({
      where: { id: planId },
    });

    if (!existing || existing.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    await prisma.testPlan.delete({
      where: { id: planId },
    });

    return res.status(200).json({
      message: `Đã xoá Kế hoạch kiểm thử "${existing.name}" thành công!`,
      planId,
    });
  } catch (error) {
    console.error("Lỗi xoá Test Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá Test Plan." });
  }
};

/**
 * Cập nhật kết quả kiểm thử cho 1 test case trong Plan
 * PATCH /api/projects/:projectId/test-plans/:planId/cases/:caseId
 */
export const updatePlanCaseStatus = async (req, res) => {
  try {
    const { projectId, planId, caseId } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["UNTESTED", "PASSED", "FAILED", "BLOCKED", "SKIPPED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ. Phải là PASSED, FAILED, BLOCKED, SKIPPED hoặc UNTESTED." });
    }

    const testPlan = await prisma.testPlan.findUnique({ where: { id: planId } });
    if (!testPlan || testPlan.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    const cleanStatus = status.toUpperCase();
    const executedAt = cleanStatus === "UNTESTED" ? null : new Date();

    const updatedPlanCase = await prisma.testPlanCase.update({
      where: {
        testPlanId_testCaseId: {
          testPlanId: planId,
          testCaseId: caseId,
        },
      },
      data: {
        status: cleanStatus,
        note: note !== undefined ? note : undefined,
        executedAt,
      },
      include: {
        testCase: {
          include: {
            folder: { select: { id: true, name: true } },
            author: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Lấy lại danh sách test cases của plan để trả về metrics mới
    const allCases = await prisma.testPlanCase.findMany({
      where: { testPlanId: planId },
      select: { status: true },
    });
    const metrics = calculatePlanMetrics(allCases);

    return res.status(200).json({
      message: `Đã cập nhật trạng thái test case sang "${cleanStatus}".`,
      planCase: updatedPlanCase,
      metrics,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái test case trong plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật kết quả test." });
  }
};

/**
 * Thêm test cases vào Test Plan (từ testCaseIds hoặc từ testSetId)
 * POST /api/projects/:projectId/test-plans/:planId/cases
 */
export const addCasesToPlan = async (req, res) => {
  try {
    const { projectId, planId } = req.params;
    const { testCaseIds = [], testSetId } = req.body;

    const testPlan = await prisma.testPlan.findUnique({ where: { id: planId } });
    if (!testPlan || testPlan.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    const collectedCaseIds = new Set(Array.isArray(testCaseIds) ? testCaseIds : []);

    if (testSetId) {
      const setCases = await prisma.testSetCase.findMany({
        where: { testSetId },
        select: { testCaseId: true },
      });
      for (const sc of setCases) {
        collectedCaseIds.add(sc.testCaseId);
      }
    }

    const caseIdsArray = Array.from(collectedCaseIds);
    if (caseIdsArray.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất một test case hoặc Test Set." });
    }

    // Lọc các case chưa có trong plan
    const existingLinks = await prisma.testPlanCase.findMany({
      where: { testPlanId: planId, testCaseId: { in: caseIdsArray } },
      select: { testCaseId: true },
    });
    const existingIds = new Set(existingLinks.map((l) => l.testCaseId));
    const newCaseIds = caseIdsArray.filter((id) => !existingIds.has(id));

    if (newCaseIds.length > 0) {
      const highestOrder = await prisma.testPlanCase.findFirst({
        where: { testPlanId: planId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const startOrder = highestOrder ? highestOrder.order + 1 : 1;

      await prisma.testPlanCase.createMany({
        data: newCaseIds.map((cId, idx) => ({
          testPlanId: planId,
          testCaseId: cId,
          status: "UNTESTED",
          order: startOrder + idx,
        })),
      });
    }

    return res.status(200).json({
      message: `Đã thêm ${newCaseIds.length} test case vào Kế hoạch kiểm thử.`,
      addedCount: newCaseIds.length,
    });
  } catch (error) {
    console.error("Lỗi thêm test cases vào Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm test cases vào Plan." });
  }
};

/**
 * Gỡ test case khỏi Test Plan
 * DELETE /api/projects/:projectId/test-plans/:planId/cases/:caseId
 */
export const removeCaseFromPlan = async (req, res) => {
  try {
    const { projectId, planId, caseId } = req.params;

    const testPlan = await prisma.testPlan.findUnique({ where: { id: planId } });
    if (!testPlan || testPlan.projectId !== projectId) {
      return res.status(404).json({ message: "Test Plan không tồn tại." });
    }

    await prisma.testPlanCase.deleteMany({
      where: { testPlanId: planId, testCaseId: caseId },
    });

    return res.status(200).json({
      message: "Đã gỡ test case khỏi Kế hoạch kiểm thử thành công!",
      caseId,
    });
  } catch (error) {
    console.error("Lỗi gỡ test case khỏi Plan:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gỡ test case khỏi Plan." });
  }
};