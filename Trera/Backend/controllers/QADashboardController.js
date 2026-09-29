import { prisma } from "../config/prisma.js";

/**
 * Lấy Báo Cáo & Số Liệu Tổng Quan Về Chất Lượng (QA Dashboard Metrics)
 */
export const getQAMetrics = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Phân bổ Test Case theo Thư mục / Module
    const folders = await prisma.testFolder.findMany({
      where: { projectId },
      include: {
        _count: { select: { testCases: true } },
      },
      orderBy: { order: "asc" },
    });

    const rootTestCasesCount = await prisma.testCase.count({
      where: { projectId, folderId: null },
    });

    const folderBreakdown = [
      ...folders.map((f) => ({
        id: f.id,
        name: f.name,
        count: f._count.testCases,
      })),
      ...(rootTestCasesCount > 0
        ? [{ id: "root", name: "Chưa phân loại (Root)", count: rootTestCasesCount }]
        : []),
    ];

    // 2. Phân bổ theo Độ ưu tiên & Loại Test
    const testCases = await prisma.testCase.findMany({
      where: { projectId },
      select: {
        id: true,
        priority: true,
        type: true,
      },
    });

    const totalCases = testCases.length;
    const priorityBreakdown = {
      CRITICAL: testCases.filter((c) => c.priority === "CRITICAL").length,
      HIGH: testCases.filter((c) => c.priority === "HIGH").length,
      MEDIUM: testCases.filter((c) => c.priority === "MEDIUM").length,
      LOW: testCases.filter((c) => c.priority === "LOW").length,
    };

    const typeBreakdown = {
      MANUAL: testCases.filter((c) => c.type === "MANUAL").length,
      BDD: testCases.filter((c) => c.type === "BDD").length,
    };

    // 3. Số liệu Thực thi (Test Execution Summary)
    const testRuns = await prisma.testRun.findMany({
      where: { projectId },
      include: {
        results: {
          select: { status: true },
        },
      },
    });

    let totalExecutions = 0;
    let passedExecutions = 0;
    let failedExecutions = 0;
    let blockedExecutions = 0;
    let skippedExecutions = 0;
    let untestedExecutions = 0;

    for (const tr of testRuns) {
      for (const r of tr.results) {
        totalExecutions++;
        if (r.status === "PASSED") passedExecutions++;
        else if (r.status === "FAILED") failedExecutions++;
        else if (r.status === "BLOCKED") blockedExecutions++;
        else if (r.status === "SKIPPED") skippedExecutions++;
        else untestedExecutions++;
      }
    }

    const passRate =
      totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0;
    const failRate =
      totalExecutions > 0 ? Math.round((failedExecutions / totalExecutions) * 100) : 0;

    // 4. Số liệu Lỗi phát sinh từ Test (Defects Analytics)
    const defects = await prisma.testRunDefect.findMany({
      where: {
        runResult: {
          testRun: { projectId },
        },
      },
      include: {
        issue: {
          select: { id: true, status: true, priority: true },
        },
      },
    });

    // Deduplicate defects by issueId
    const defectMap = new Map();
    defects.forEach((d) => {
      defectMap.set(d.issueId, d.issue);
    });
    const uniqueDefects = Array.from(defectMap.values());

    const totalDefects = uniqueDefects.length;
    const resolvedDefects = uniqueDefects.filter((d) => d.status === "DONE").length;
    const openDefects = totalDefects - resolvedDefects;
    const defectResolutionRate =
      totalDefects > 0 ? Math.round((resolvedDefects / totalDefects) * 100) : 0;

    res.status(200).json({
      summary: {
        totalCases,
        totalRuns: testRuns.length,
        activeRuns: testRuns.filter((r) => r.status === "IN_PROGRESS").length,
        completedRuns: testRuns.filter((r) => r.status === "COMPLETED").length,
        totalExecutions,
        passedExecutions,
        failedExecutions,
        blockedExecutions,
        untestedExecutions,
        passRate,
        failRate,
        totalDefects,
        openDefects,
        resolvedDefects,
        defectResolutionRate,
      },
      priorityBreakdown,
      typeBreakdown,
      folderBreakdown,
    });
  } catch (error) {
    console.error("Lỗi lấy số liệu QA Dashboard:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy số liệu kiểm thử." });
  }
};

/**
 * Phát Hiện Ca Test Bất Ổn Định (Flaky Tests Detection)
 * Thuật toán phân tích lịch sử các lần chạy để tìm các ca test lật trạng thái (Pass ↔ Fail) liên tục
 */
export const getFlakyTests = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Lấy tất cả ca test của dự án kèm lịch sử các lần chạy
    const testCases = await prisma.testCase.findMany({
      where: { projectId },
      include: {
        folder: { select: { id: true, name: true } },
        runResults: {
          where: {
            status: { in: ["PASSED", "FAILED", "BLOCKED"] }, // Bỏ qua UNTESTED/SKIPPED
          },
          include: {
            testRun: { select: { id: true, name: true, createdAt: true } },
          },
          orderBy: { executedAt: "asc" },
        },
      },
    });

    const flakyTests = [];

    for (const tc of testCases) {
      const history = tc.runResults;
      if (history.length < 2) continue;

      let flips = 0;
      for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1].status;
        const curr = history[i].status;

        // Nếu trạng thái đổi giữa PASS và FAIL/BLOCKED
        if (
          (prev === "PASSED" && (curr === "FAILED" || curr === "BLOCKED")) ||
          ((prev === "FAILED" || prev === "BLOCKED") && curr === "PASSED")
        ) {
          flips++;
        }
      }

      // Nếu có ít nhất 1 lần lật trạng thái, đánh giá tính bất ổn định
      if (flips >= 1) {
        const flipRate = Math.round((flips / (history.length - 1)) * 100);
        const passCount = history.filter((h) => h.status === "PASSED").length;
        const failCount = history.filter((h) => h.status === "FAILED").length;

        flakyTests.push({
          id: tc.id,
          key: tc.key,
          title: tc.title,
          priority: tc.priority,
          type: tc.type,
          folder: tc.folder,
          totalRuns: history.length,
          passCount,
          failCount,
          flips,
          flipRate,
          severity: flips >= 2 ? "HIGH" : "MEDIUM",
          trajectory: history.map((h) => ({
            runName: h.testRun?.name || "Test Run",
            status: h.status,
            executedAt: h.executedAt,
          })),
        });
      }
    }

    // Sắp xếp các ca flaky nhất lên đầu (theo flips và flipRate)
    flakyTests.sort((a, b) => b.flips - a.flips || b.flipRate - a.flipRate);

    res.status(200).json({
      flakyTests,
      totalFlakyCount: flakyTests.length,
      totalEvaluatedCases: testCases.filter((tc) => tc.runResults.length >= 2).length,
    });
  } catch (error) {
    console.error("Lỗi phát hiện Flaky Tests:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi phân tích ca test bất ổn định." });
  }
};
