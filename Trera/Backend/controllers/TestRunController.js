import { prisma } from "../config/prisma.js";

/**
 * Tính toán bộ chỉ số thực thi (Run Metrics)
 */
export const calculateRunMetrics = (results = []) => {
  const total = results.length;
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  let skipped = 0;
  let untested = 0;

  for (const r of results) {
    switch (r.status) {
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
      case "UNTESTED":
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
 * Lấy danh sách Test Runs của dự án
 */
export const getTestRuns = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { planId, status } = req.query;

    const where = { projectId };
    if (planId) where.planId = planId;
    if (status && status !== "ALL") where.status = status;

    const testRuns = await prisma.testRun.findMany({
      where,
      include: {
        environment: { select: { id: true, name: true, category: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        plan: { select: { id: true, name: true } },
        results: {
          select: {
            id: true,
            status: true,
            testCaseId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedRuns = testRuns.map((run) => {
      const metrics = calculateRunMetrics(run.results);
      return {
        ...run,
        metrics,
      };
    });

    res.status(200).json({ testRuns: enrichedRuns });
  } catch (error) {
    console.error("Lỗi lấy danh sách Test Runs:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách đợt thực thi." });
  }
};

/**
 * Lấy chi tiết một Test Run kèm danh sách kết quả ca test & chi tiết bước
 */
export const getTestRunById = async (req, res) => {
  try {
    const { projectId, runId } = req.params;

    const testRun = await prisma.testRun.findFirst({
      where: { id: runId, projectId },
      include: {
        environment: true,
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        plan: {
          select: {
            id: true,
            name: true,
            sprint: { select: { id: true, name: true, status: true } },
          },
        },
        results: {
          include: {
            testCase: {
              include: {
                steps: { orderBy: { order: "asc" } },
                folder: { select: { id: true, name: true } },
              },
            },
            executedBy: { select: { id: true, name: true, avatar: true } },
            stepResults: {
              include: {
                attachments: true,
              },
              orderBy: { stepOrder: "asc" },
            },
            defects: {
              include: {
                issue: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!testRun) {
      return res.status(404).json({ message: "Không tìm thấy đợt thực thi kiểm thử." });
    }

    const metrics = calculateRunMetrics(testRun.results);

    res.status(200).json({ testRun, metrics });
  } catch (error) {
    console.error("Lỗi lấy chi tiết Test Run:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết đợt thực thi." });
  }
};

/**
 * Tạo một Test Run mới
 */
export const createTestRun = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      planId,
      environmentId,
      assignedToId,
      testCaseIds = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên đợt thực thi kiểm thử là bắt buộc." });
    }

    let finalCaseIds = [...new Set(testCaseIds)];

    // Nếu chọn TestPlan mà không truyền caseIds, lấy toàn bộ ca test từ Plan
    if (planId && finalCaseIds.length === 0) {
      const planCases = await prisma.testPlanCase.findMany({
        where: { testPlanId: planId },
        select: { testCaseId: true },
      });
      finalCaseIds = planCases.map((pc) => pc.testCaseId);
    }

    if (finalCaseIds.length === 0) {
      return res.status(400).json({
        message: "Vui lòng chọn kế hoạch kiểm thử có ca test hoặc chọn ít nhất một ca test.",
      });
    }

    // Lấy thông tin các ca test và các bước của chúng
    const testCases = await prisma.testCase.findMany({
      where: { id: { in: finalCaseIds }, projectId },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    });

    // Tạo TestRun và khởi tạo TestRunResult trong một transaction
    const newRun = await prisma.$transaction(async (tx) => {
      const run = await tx.testRun.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          status: "IN_PROGRESS",
          projectId,
          planId: planId || null,
          environmentId: environmentId || null,
          assignedToId: assignedToId || req.user.id,
        },
      });

      // Tạo các TestRunResult cho từng ca test
      for (const tc of testCases) {
        const result = await tx.testRunResult.create({
          data: {
            testRunId: run.id,
            testCaseId: tc.id,
            status: "UNTESTED",
          },
        });

        // Khởi tạo các StepResults cho ca test nếu có steps
        if (tc.steps && tc.steps.length > 0) {
          await tx.testRunStepResult.createMany({
            data: tc.steps.map((step) => ({
              runResultId: result.id,
              stepId: step.id,
              stepOrder: step.order,
              status: "UNTESTED",
            })),
          });
        }
      }

      return run;
    });

    // Lấy lại run đầy đủ
    const fullRun = await prisma.testRun.findUnique({
      where: { id: newRun.id },
      include: {
        environment: true,
        assignedTo: { select: { id: true, name: true, avatar: true } },
        plan: { select: { id: true, name: true } },
        results: true,
      },
    });

    res.status(201).json({
      message: "Khởi tạo đợt thực thi kiểm thử thành công.",
      testRun: {
        ...fullRun,
        metrics: calculateRunMetrics(fullRun.results),
      },
    });
  } catch (error) {
    console.error("Lỗi tạo Test Run:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo đợt thực thi kiểm thử." });
  }
};

/**
 * Cập nhật thông tin Test Run (đổi tên, trạng thái, hoàn thành)
 */
export const updateTestRun = async (req, res) => {
  try {
    const { projectId, runId } = req.params;
    const { name, description, status, environmentId, assignedToId } = req.body;

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (environmentId !== undefined) data.environmentId = environmentId || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    if (status !== undefined) {
      data.status = status;
      if (status === "COMPLETED") {
        data.completedAt = new Date();
      }
    }

    const updatedRun = await prisma.testRun.update({
      where: { id: runId, projectId },
      data,
      include: {
        environment: true,
        assignedTo: { select: { id: true, name: true, avatar: true } },
        plan: { select: { id: true, name: true } },
        results: true,
      },
    });

    res.status(200).json({
      message: "Cập nhật đợt thực thi thành công.",
      testRun: {
        ...updatedRun,
        metrics: calculateRunMetrics(updatedRun.results),
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật Test Run:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật đợt thực thi." });
  }
};

/**
 * Xóa một Test Run
 */
export const deleteTestRun = async (req, res) => {
  try {
    const { projectId, runId } = req.params;

    await prisma.testRun.delete({
      where: { id: runId, projectId },
    });

    res.status(200).json({ message: "Đã xóa đợt thực thi kiểm thử thành công." });
  } catch (error) {
    console.error("Lỗi xóa Test Run:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xóa đợt thực thi." });
  }
};
