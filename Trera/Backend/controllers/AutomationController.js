import { prisma } from "../config/prisma.js";
import { parseJUnitXml, parseCucumberJson } from "../services/automationParser.js";

/**
 * Helper tìm hoặc tạo môi trường CI/CD Pipeline
 */
const getOrCreateCiEnvironment = async (projectId) => {
  let env = await prisma.testEnvironment.findFirst({
    where: { projectId, name: { contains: "CI/CD", mode: "insensitive" } },
  });

  if (!env) {
    env = await prisma.testEnvironment.findFirst({
      where: { projectId },
    });
  }

  if (!env) {
    env = await prisma.testEnvironment.create({
      data: {
        name: "CI/CD Automated Pipeline",
        category: "API",
        projectId,
      },
    });
  }

  return env;
};

/**
 * Helper tìm hoặc tạo thư mục 'CI/CD Automation' để chứa các test case mới được import
 */
const getOrCreateCiFolder = async (projectId) => {
  let folder = await prisma.testFolder.findFirst({
    where: { projectId, name: "CI/CD Automation" },
  });

  if (!folder) {
    folder = await prisma.testFolder.create({
      data: {
        name: "CI/CD Automation",
        description: "Thư mục chứa các ca kiểm thử tự động được import từ CI/CD",
        projectId,
        order: 999,
      },
    });
  }

  return folder;
};

/**
 * Helper kích hoạt Webhooks khi Test Run hoàn tất
 */
const triggerWebhooks = async (projectId, event, payload) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const hook of webhooks) {
      // Gửi HTTP POST fire-and-forget
      fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Trera-Event": event,
          ...(hook.secret ? { "X-Trera-Secret": hook.secret } : {}),
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          projectId,
          data: payload,
        }),
      }).catch((err) => console.error(`Lỗi gửi webhook ${hook.url}:`, err.message));
    }
  } catch (error) {
    console.error("Lỗi khi tìm webhooks:", error);
  }
};

/**
 * Import kết quả JUnit XML từ pipeline CI/CD
 * POST /api/projects/:projectId/automation/junit
 */
export const importJUnitResults = async (req, res) => {
  try {
    const { projectId } = req.params;
    let { name, planId, environmentId, autoLogBugs, createMissingCases } = req.body;

    // Chuẩn hóa autoLogBugs & createMissingCases (hỗ trợ cả boolean và chuỗi "true")
    const shouldLogBugs = autoLogBugs === true || autoLogBugs === "true";
    const shouldCreateMissing = createMissingCases !== false && createMissingCases !== "false";

    let xmlString = "";
    if (req.file && req.file.buffer) {
      xmlString = req.file.buffer.toString("utf-8");
    } else if (typeof req.body === "string" && req.body.trim().startsWith("<")) {
      xmlString = req.body;
    } else if (req.body && req.body.xmlContent) {
      xmlString = req.body.xmlContent;
    }

    if (!xmlString || xmlString.trim() === "") {
      return res.status(400).json({
        message: "Không tìm thấy nội dung file JUnit XML. Vui lòng tải file lên hoặc gửi chuỗi XML qua body.",
      });
    }

    // 1. Phân tích XML
    let parsed;
    try {
      parsed = parseJUnitXml(xmlString);
    } catch (parseErr) {
      return res.status(400).json({
        message: `Lỗi phân tích cú pháp JUnit XML: ${parseErr.message}`,
      });
    }

    if (parsed.testCases.length === 0) {
      return res.status(400).json({
        message: "Không tìm thấy ca kiểm thử (<testcase>) nào trong tệp XML cung cấp.",
      });
    }

    // 2. Chuẩn bị môi trường
    let envId = environmentId;
    if (!envId) {
      const defaultEnv = await getOrCreateCiEnvironment(projectId);
      envId = defaultEnv.id;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true, name: true },
    });

    // 3. Lấy danh sách Test Case hiện có của dự án để ánh xạ
    const existingTestCases = await prisma.testCase.findMany({
      where: { projectId },
      select: { id: true, key: true, title: true },
    });

    const tcMapByKey = new Map();
    const tcMapByTitle = new Map();
    for (const tc of existingTestCases) {
      tcMapByKey.set(tc.key.toUpperCase(), tc);
      tcMapByTitle.set(tc.title.toLowerCase().trim(), tc);
    }

    let ciFolder = null;
    if (shouldCreateMissing) {
      ciFolder = await getOrCreateCiFolder(projectId);
    }

    // 4. Ánh xạ từng ca kiểm thử từ JUnit
    const resolvedCases = [];
    let lastCaseOrder = existingTestCases.length;

    for (const item of parsed.testCases) {
      let matchedCase = null;

      if (item.detectedKey && tcMapByKey.has(item.detectedKey)) {
        matchedCase = tcMapByKey.get(item.detectedKey);
      } else if (tcMapByTitle.has(item.name.toLowerCase().trim())) {
        matchedCase = tcMapByTitle.get(item.name.toLowerCase().trim());
      }

      // Nếu chưa có và cho phép tự tạo ca test mới
      if (!matchedCase && shouldCreateMissing && ciFolder) {
        lastCaseOrder++;
        const newKey = `${project.key}-TC-${lastCaseOrder}`;

        matchedCase = await prisma.testCase.create({
          data: {
            key: newKey,
            title: item.name,
            description: `Tự động tạo từ automated test: ${item.classname}`,
            type: "MANUAL",
            priority: "MEDIUM",
            folderId: ciFolder.id,
            authorId: req.user.id,
            projectId,
            order: lastCaseOrder,
          },
        });

        tcMapByKey.set(matchedCase.key.toUpperCase(), matchedCase);
        tcMapByTitle.set(matchedCase.title.toLowerCase().trim(), matchedCase);
      }

      if (matchedCase) {
        resolvedCases.push({
          testCase: matchedCase,
          status: item.status,
          durationSeconds: item.durationSeconds,
          failureMessage: item.failureMessage,
          stackTrace: item.stackTrace,
        });
      }
    }

    if (resolvedCases.length === 0) {
      return res.status(400).json({
        message: "Không thể ánh xạ hoặc tạo bất kỳ ca kiểm thử nào từ tệp JUnit XML.",
      });
    }

    // 5. Khởi tạo TestRun trạng thái COMPLETED
    const runName = name?.trim() || `[CI/CD] JUnit Run - ${new Date().toLocaleString("vi-VN")}`;

    const testRun = await prisma.testRun.create({
      data: {
        name: runName,
        description: `Import tự động từ JUnit XML. Tổng số: ${parsed.summary.total} | Đạt: ${parsed.summary.passed} | Lỗi: ${parsed.summary.failed} | Bỏ qua: ${parsed.summary.skipped}`,
        status: "COMPLETED",
        completedAt: new Date(),
        projectId,
        environmentId: envId,
        planId: planId || null,
        assignedToId: req.user.id,
      },
    });

    // 6. Ghi nhận kết quả TestRunResult & Tùy chọn tạo Bug
    const createdDefects = [];

    for (const r of resolvedCases) {
      const runResult = await prisma.testRunResult.create({
        data: {
          testRunId: testRun.id,
          testCaseId: r.testCase.id,
          status: r.status,
          elapsedSeconds: Math.round(r.durationSeconds) || 1,
          actualResult: r.failureMessage
            ? `${r.failureMessage}\n\n${r.stackTrace || ""}`.trim()
            : "Kiểm thử tự động thực thi thành công qua pipeline CI/CD.",
          executedById: req.user.id,
          executedAt: new Date(),
        },
      });

      // Nếu fail và có bật autoLogBugs -> Tạo Issue BUG
      if (shouldLogBugs && r.status === "FAILED") {
        const lastIssue = await prisma.issue.findFirst({
          where: { projectId, status: "TODO" },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const nextOrder = (lastIssue?.order || 0) + 1;

        const bugTitle = `[CI/CD Fail] ${r.testCase.key}: ${r.testCase.title}`;
        const bugDesc = `### 🤖 Lỗi tự động ghi nhận từ Pipeline CI/CD
- **Đợt kiểm thử**: ${testRun.name}
- **Ca kiểm thử**: ${r.testCase.key} - ${r.testCase.title}
- **Thời gian**: ${new Date().toLocaleString("vi-VN")}
- **Thời lượng**: ${r.durationSeconds}s

---

#### Chi tiết lỗi (Failure Message):
\`\`\`
${r.failureMessage || "Assertion failed"}
\`\`\`

#### Stack Trace:
\`\`\`
${r.stackTrace || "Không có stack trace"}
\`\`\``;

        const bugIssue = await prisma.issue.create({
          data: {
            title: bugTitle,
            description: bugDesc,
            type: "BUG",
            status: "TODO",
            priority: "HIGH",
            order: nextOrder,
            projectId,
            reporterId: req.user.id,
          },
        });

        // Liên kết với TestRunResult
        await prisma.testRunDefect.create({
          data: {
            runResultId: runResult.id,
            issueId: bugIssue.id,
          },
        });

        // Liên kết với TestCase (cho Traceability Matrix)
        await prisma.testCaseIssue.upsert({
          where: {
            testCaseId_issueId: {
              testCaseId: r.testCase.id,
              issueId: bugIssue.id,
            },
          },
          create: {
            testCaseId: r.testCase.id,
            issueId: bugIssue.id,
          },
          update: {},
        });

        createdDefects.push(bugIssue);
      }
    }

    // 7. Kích hoạt Webhooks
    triggerWebhooks(projectId, "TEST_RUN_COMPLETED", {
      runId: testRun.id,
      runName: testRun.name,
      status: testRun.status,
      summary: parsed.summary,
      createdDefectsCount: createdDefects.length,
    });

    return res.status(201).json({
      message: "Đã nhập kết quả kiểm thử JUnit XML thành công.",
      testRun,
      summary: parsed.summary,
      resolvedCasesCount: resolvedCases.length,
      createdDefectsCount: createdDefects.length,
    });
  } catch (error) {
    console.error("Lỗi import JUnit XML:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi import kết quả JUnit XML." });
  }
};

/**
 * Import kết quả Cucumber JSON từ pipeline CI/CD
 * POST /api/projects/:projectId/automation/cucumber
 */
export const importCucumberResults = async (req, res) => {
  try {
    const { projectId } = req.params;
    let { name, planId, environmentId, autoLogBugs, createMissingCases } = req.body;

    const shouldLogBugs = autoLogBugs === true || autoLogBugs === "true";
    const shouldCreateMissing = createMissingCases !== false && createMissingCases !== "false";

    let rawJson = null;
    if (req.file && req.file.buffer) {
      rawJson = req.file.buffer.toString("utf-8");
    } else if (req.body && req.body.jsonContent) {
      rawJson = req.body.jsonContent;
    } else if (Array.isArray(req.body)) {
      rawJson = req.body;
    }

    if (!rawJson) {
      return res.status(400).json({
        message: "Không tìm thấy dữ liệu Cucumber JSON. Vui lòng tải file lên hoặc gửi mảng JSON qua body.",
      });
    }

    // 1. Phân tích Cucumber JSON
    let parsed;
    try {
      parsed = parseCucumberJson(rawJson);
    } catch (parseErr) {
      return res.status(400).json({
        message: `Lỗi phân tích cú pháp Cucumber JSON: ${parseErr.message}`,
      });
    }

    if (parsed.testCases.length === 0) {
      return res.status(400).json({
        message: "Không tìm thấy kịch bản Scenario nào trong dữ liệu Cucumber JSON.",
      });
    }

    // 2. Môi trường
    let envId = environmentId;
    if (!envId) {
      const defaultEnv = await getOrCreateCiEnvironment(projectId);
      envId = defaultEnv.id;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });

    const existingTestCases = await prisma.testCase.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        title: true,
        steps: { orderBy: { order: "asc" } },
      },
    });

    const tcMapByKey = new Map();
    const tcMapByTitle = new Map();
    for (const tc of existingTestCases) {
      tcMapByKey.set(tc.key.toUpperCase(), tc);
      tcMapByTitle.set(tc.title.toLowerCase().trim(), tc);
    }

    let ciFolder = null;
    if (shouldCreateMissing) {
      ciFolder = await getOrCreateCiFolder(projectId);
    }

    // 3. Ánh xạ Test Cases
    const resolvedCases = [];
    let lastCaseOrder = existingTestCases.length;

    for (const item of parsed.testCases) {
      let matchedCase = null;

      if (item.detectedKey && tcMapByKey.has(item.detectedKey)) {
        matchedCase = tcMapByKey.get(item.detectedKey);
      } else if (tcMapByTitle.has(item.name.toLowerCase().trim())) {
        matchedCase = tcMapByTitle.get(item.name.toLowerCase().trim());
      }

      if (!matchedCase && shouldCreateMissing && ciFolder) {
        lastCaseOrder++;
        const newKey = `${project.key}-TC-${lastCaseOrder}`;

        matchedCase = await prisma.testCase.create({
          data: {
            key: newKey,
            title: item.name,
            description: `Tự động tạo từ Cucumber BDD Feature: ${item.featureName}`,
            type: "BDD",
            priority: "MEDIUM",
            folderId: ciFolder.id,
            authorId: req.user.id,
            projectId,
            order: lastCaseOrder,
          },
        });

        // Tạo các TestStep cho ca test BDD
        const createdSteps = [];
        for (let i = 0; i < item.steps.length; i++) {
          const st = item.steps[i];
          const newStep = await prisma.testStep.create({
            data: {
              testCaseId: matchedCase.id,
              order: i + 1,
              action: `${st.keyword} ${st.name}`.trim(),
              expectedResult: "Bước thực hiện thành công không có lỗi phát sinh.",
            },
          });
          createdSteps.push(newStep);
        }
        matchedCase.steps = createdSteps;

        tcMapByKey.set(matchedCase.key.toUpperCase(), matchedCase);
        tcMapByTitle.set(matchedCase.title.toLowerCase().trim(), matchedCase);
      }

      if (matchedCase) {
        resolvedCases.push({
          testCase: matchedCase,
          status: item.status,
          durationSeconds: item.durationSeconds,
          steps: item.steps,
        });
      }
    }

    // 4. Tạo TestRun
    const runName = name?.trim() || `[CI/CD] Cucumber BDD Run - ${new Date().toLocaleString("vi-VN")}`;

    const testRun = await prisma.testRun.create({
      data: {
        name: runName,
        description: `Import tự động từ Cucumber BDD JSON. Tổng kịch bản: ${parsed.summary.total} | Đạt: ${parsed.summary.passed} | Lỗi: ${parsed.summary.failed} | Bỏ qua: ${parsed.summary.skipped}`,
        status: "COMPLETED",
        completedAt: new Date(),
        projectId,
        environmentId: envId,
        planId: planId || null,
        assignedToId: req.user.id,
      },
    });

    // 5. Lưu TestRunResult và StepResults
    const createdDefects = [];

    for (const r of resolvedCases) {
      const failedStep = r.steps.find((s) => s.status === "FAILED");

      const runResult = await prisma.testRunResult.create({
        data: {
          testRunId: testRun.id,
          testCaseId: r.testCase.id,
          status: r.status,
          elapsedSeconds: Math.round(r.durationSeconds) || 1,
          actualResult: failedStep
            ? `Lỗi tại bước: ${failedStep.keyword} ${failedStep.name}\n${failedStep.errorMessage || ""}`.trim()
            : "Kịch bản BDD thực thi hoàn thành thành công.",
          executedById: req.user.id,
          executedAt: new Date(),
        },
      });

      // Lưu chi tiết từng step
      for (let i = 0; i < r.steps.length; i++) {
        const st = r.steps[i];
        const stepId = r.testCase.steps?.[i]?.id || `step_${i + 1}`;
        await prisma.testRunStepResult.create({
          data: {
            runResultId: runResult.id,
            stepId,
            stepOrder: i + 1,
            status: st.status,
            actualResult: st.errorMessage || "Hoàn thành",
          },
        });
      }

      // Tạo Bug nếu fail
      if (shouldLogBugs && r.status === "FAILED") {
        const lastIssue = await prisma.issue.findFirst({
          where: { projectId, status: "TODO" },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const nextOrder = (lastIssue?.order || 0) + 1;

        const bugTitle = `[BDD Fail] ${r.testCase.key}: ${r.testCase.title}`;
        const bugDesc = `### 🥒 Lỗi kịch bản BDD tự động từ Pipeline CI/CD
- **Đợt kiểm thử**: ${testRun.name}
- **Kịch bản**: ${r.testCase.key} - ${r.testCase.title}
- **Thời gian**: ${new Date().toLocaleString("vi-VN")}
- **Bước lỗi**: ${failedStep ? `${failedStep.keyword} ${failedStep.name}` : "Không rõ"}

---

#### Chi tiết thông báo lỗi:
\`\`\`
${failedStep?.errorMessage || "Step execution failed"}
\`\`\``;

        const bugIssue = await prisma.issue.create({
          data: {
            title: bugTitle,
            description: bugDesc,
            type: "BUG",
            status: "TODO",
            priority: "HIGH",
            order: nextOrder,
            projectId,
            reporterId: req.user.id,
          },
        });

        await prisma.testRunDefect.create({
          data: {
            runResultId: runResult.id,
            issueId: bugIssue.id,
          },
        });

        await prisma.testCaseIssue.upsert({
          where: {
            testCaseId_issueId: {
              testCaseId: r.testCase.id,
              issueId: bugIssue.id,
            },
          },
          create: {
            testCaseId: r.testCase.id,
            issueId: bugIssue.id,
          },
          update: {},
        });

        createdDefects.push(bugIssue);
      }
    }

    triggerWebhooks(projectId, "TEST_RUN_COMPLETED", {
      runId: testRun.id,
      runName: testRun.name,
      status: testRun.status,
      summary: parsed.summary,
      createdDefectsCount: createdDefects.length,
    });

    return res.status(201).json({
      message: "Đã nhập kết quả kiểm thử Cucumber BDD thành công.",
      testRun,
      summary: parsed.summary,
      resolvedCasesCount: resolvedCases.length,
      createdDefectsCount: createdDefects.length,
    });
  } catch (error) {
    console.error("Lỗi import Cucumber JSON:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi import kết quả Cucumber JSON." });
  }
};

/**
 * Lấy thống kê tổng quan tự động hóa của dự án
 * GET /api/projects/:projectId/automation/summary
 */
export const getAutomationSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const ciRuns = await prisma.testRun.findMany({
      where: {
        projectId,
        OR: [
          { description: { contains: "import", mode: "insensitive" } },
          { environment: { name: { contains: "CI", mode: "insensitive" } } },
          { name: { contains: "CI", mode: "insensitive" } },
        ],
      },
      include: {
        environment: { select: { name: true } },
        results: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const totalRuns = ciRuns.length;
    let totalTestsExecuted = 0;
    let totalPassedTests = 0;

    const formattedRuns = ciRuns.map((r) => {
      const total = r.results.length;
      const passed = r.results.filter((res) => res.status === "PASSED").length;
      const failed = r.results.filter((res) => res.status === "FAILED").length;
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

      totalTestsExecuted += total;
      totalPassedTests += passed;

      return {
        id: r.id,
        name: r.name,
        environmentName: r.environment?.name || "CI/CD",
        total,
        passed,
        failed,
        passRate,
        createdAt: r.createdAt,
      };
    });

    const overallPassRate =
      totalTestsExecuted > 0
        ? Math.round((totalPassedTests / totalTestsExecuted) * 100)
        : 0;

    return res.status(200).json({
      totalRuns,
      totalTestsExecuted,
      overallPassRate,
      recentRuns: formattedRuns,
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê tự động hóa:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy thống kê tự động hóa." });
  }
};
