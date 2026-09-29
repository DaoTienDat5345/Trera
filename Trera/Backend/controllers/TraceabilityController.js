import { prisma } from "../config/prisma.js";

/**
 * Lấy Ma Trận Truy Vết 3 Chiều (Requirements ↔ Test Cases ↔ Defects)
 */
export const getTraceabilityMatrix = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sprintId, search } = req.query;

    const where = {
      projectId,
      type: { not: "BUG" }, // Chỉ lấy các Yêu cầu, User Story, Task, Feature
    };

    if (sprintId && sprintId !== "all") {
      if (sprintId === "backlog") {
        where.sprintId = null;
      } else {
        where.sprintId = sprintId;
      }
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    // Lấy danh sách các User Stories / Tasks
    const issues = await prisma.issue.findMany({
      where,
      include: {
        sprint: { select: { id: true, name: true, status: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        testCases: {
          include: {
            testCase: {
              include: {
                folder: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // Bổ sung thông tin thực thi mới nhất và các Defect liên quan
    const matrix = await Promise.all(
      issues.map(async (issue) => {
        const enrichedTestCases = await Promise.all(
          issue.testCases.map(async (tcLink) => {
            const tc = tcLink.testCase;

            // Tìm kết quả thực thi mới nhất của ca test này
            const latestRunResult = await prisma.testRunResult.findFirst({
              where: { testCaseId: tc.id },
              orderBy: { executedAt: "desc" },
              select: {
                id: true,
                status: true,
                actualResult: true,
                executedAt: true,
                testRun: {
                  select: { id: true, name: true },
                },
              },
            });

            // Tìm các Bug phát sinh từ ca test này
            const defects = await prisma.testRunDefect.findMany({
              where: {
                runResult: { testCaseId: tc.id },
              },
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
            });

            return {
              ...tc,
              latestStatus: latestRunResult?.status || "UNTESTED",
              latestExecutedAt: latestRunResult?.executedAt || null,
              latestRunName: latestRunResult?.testRun?.name || null,
              defects: defects.map((d) => d.issue),
            };
          })
        );

        // Tập hợp tất cả các bugs của các test case thuộc story này
        const allDefectsMap = new Map();
        enrichedTestCases.forEach((tc) => {
          tc.defects.forEach((d) => {
            allDefectsMap.set(d.id, d);
          });
        });
        const allDefects = Array.from(allDefectsMap.values());

        // Xác định Quality Status cho Requirement này:
        // - NO_TESTS: Chưa có test case nào
        // - FAILED: Có ít nhất 1 test case Failed hoặc có Bug chưa đóng (status != DONE)
        // - BLOCKED: Có test case bị Blocked
        // - PASSED: Có ít nhất 1 test case và toàn bộ đều Passed, không có bug mở
        // - UNTESTED: Chưa chạy test
        let qualityStatus = "NO_TESTS";
        const hasOpenBugs = allDefects.some((d) => d.status !== "DONE");

        if (enrichedTestCases.length === 0) {
          qualityStatus = "NO_TESTS";
        } else if (
          hasOpenBugs ||
          enrichedTestCases.some((tc) => tc.latestStatus === "FAILED")
        ) {
          qualityStatus = "FAILED";
        } else if (enrichedTestCases.some((tc) => tc.latestStatus === "BLOCKED")) {
          qualityStatus = "BLOCKED";
        } else if (enrichedTestCases.every((tc) => tc.latestStatus === "PASSED")) {
          qualityStatus = "PASSED";
        } else {
          qualityStatus = "UNTESTED";
        }

        return {
          id: issue.id,
          title: issue.title,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          sprint: issue.sprint,
          assignees: issue.assignees.map((a) => a.user),
          reporter: issue.reporter,
          coverageStatus: enrichedTestCases.length > 0 ? "COVERED" : "UNCOVERED",
          testCasesCount: enrichedTestCases.length,
          testCases: enrichedTestCases,
          defects: allDefects,
          qualityStatus,
        };
      })
    );

    // Tính toán số liệu thống kê Coverage
    const totalStories = matrix.length;
    const coveredStories = matrix.filter((m) => m.coverageStatus === "COVERED").length;
    const uncoveredStories = totalStories - coveredStories;
    const coveragePercentage =
      totalStories > 0 ? Math.round((coveredStories / totalStories) * 100) : 0;

    const passedStories = matrix.filter((m) => m.qualityStatus === "PASSED").length;
    const failedStories = matrix.filter((m) => m.qualityStatus === "FAILED").length;
    const blockedStories = matrix.filter((m) => m.qualityStatus === "BLOCKED").length;
    const untestedStories = matrix.filter((m) => m.qualityStatus === "UNTESTED").length;
    const noTestsStories = matrix.filter((m) => m.qualityStatus === "NO_TESTS").length;

    const metrics = {
      totalStories,
      coveredStories,
      uncoveredStories,
      coveragePercentage,
      passedStories,
      failedStories,
      blockedStories,
      untestedStories,
      noTestsStories,
    };

    res.status(200).json({ matrix, metrics });
  } catch (error) {
    console.error("Lỗi lấy ma trận truy vết:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy ma trận truy vết." });
  }
};

/**
 * Gắn một hoặc nhiều Test Case vào một User Story / Requirement
 */
export const linkTestCaseToIssue = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { issueId, testCaseIds = [] } = req.body;

    if (!issueId || testCaseIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn yêu cầu và ít nhất một ca kiểm thử." });
    }

    // Kiểm tra tính hợp lệ của issue
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId },
    });

    if (!issue) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu / User Story." });
    }

    // Tạo các liên kết
    await prisma.$transaction(
      testCaseIds.map((tcId) =>
        prisma.testCaseIssue.upsert({
          where: {
            testCaseId_issueId: {
              testCaseId: tcId,
              issueId,
            },
          },
          update: {},
          create: {
            testCaseId: tcId,
            issueId,
          },
        })
      )
    );

    res.status(200).json({ message: "Đã liên kết ca kiểm thử với yêu cầu thành công." });
  } catch (error) {
    console.error("Lỗi liên kết ca test:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi liên kết ca kiểm thử." });
  }
};

/**
 * Hủy liên kết giữa Test Case và User Story
 */
export const unlinkTestCaseFromIssue = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { issueId, testCaseId } = req.body;

    if (!issueId || !testCaseId) {
      return res.status(400).json({ message: "Thiếu thông tin issueId hoặc testCaseId." });
    }

    await prisma.testCaseIssue.deleteMany({
      where: {
        issueId,
        testCaseId,
      },
    });

    res.status(200).json({ message: "Đã hủy liên kết ca kiểm thử thành công." });
  } catch (error) {
    console.error("Lỗi hủy liên kết ca test:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi hủy liên kết ca kiểm thử." });
  }
};
