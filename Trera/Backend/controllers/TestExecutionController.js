import { prisma } from "../config/prisma.js";
import { uploadFileToStorage } from "../config/upload.js";

/**
 * Cập nhật kết quả thực thi của một ca kiểm thử trong Test Run
 */
export const executeTestCase = async (req, res) => {
  try {
    const { projectId, runId, caseId } = req.params;
    const { status, actualResult, elapsedSeconds, stepResults = [] } = req.body;

    // Tìm TestRunResult
    const runResult = await prisma.testRunResult.findUnique({
      where: {
        testRunId_testCaseId: {
          testRunId: runId,
          testCaseId: caseId,
        },
      },
      include: {
        testRun: true,
      },
    });

    if (!runResult) {
      return res.status(404).json({ message: "Không tìm thấy ca kiểm thử trong đợt thực thi này." });
    }

    // Xác định trạng thái tổng thể dựa trên các bước (nếu có)
    let finalStatus = status;

    if (stepResults.length > 0) {
      for (const sr of stepResults) {
        // Upsert step result
        const existingStep = await prisma.testRunStepResult.findFirst({
          where: {
            runResultId: runResult.id,
            stepId: sr.stepId,
          },
        });

        if (existingStep) {
          await prisma.testRunStepResult.update({
            where: { id: existingStep.id },
            data: {
              status: sr.status || "UNTESTED",
              actualResult: sr.actualResult || null,
              comment: sr.comment || null,
            },
          });
        } else {
          await prisma.testRunStepResult.create({
            data: {
              runResultId: runResult.id,
              stepId: sr.stepId,
              stepOrder: sr.stepOrder || 0,
              status: sr.status || "UNTESTED",
              actualResult: sr.actualResult || null,
              comment: sr.comment || null,
            },
          });
        }
      }

      // Nếu không chỉ định status cụ thể, tự suy luận:
      if (!status) {
        const hasFailed = stepResults.some((s) => s.status === "FAILED");
        const hasBlocked = stepResults.some((s) => s.status === "BLOCKED");
        const allPassed = stepResults.every((s) => s.status === "PASSED");

        if (hasFailed) finalStatus = "FAILED";
        else if (hasBlocked) finalStatus = "BLOCKED";
        else if (allPassed) finalStatus = "PASSED";
        else finalStatus = "UNTESTED";
      }
    }

    // Cập nhật TestRunResult
    const updatedResult = await prisma.testRunResult.update({
      where: { id: runResult.id },
      data: {
        status: finalStatus || runResult.status,
        actualResult: actualResult !== undefined ? actualResult : runResult.actualResult,
        elapsedSeconds:
          elapsedSeconds !== undefined
            ? (runResult.elapsedSeconds || 0) + elapsedSeconds
            : runResult.elapsedSeconds,
        executedById: req.user.id,
        executedAt: new Date(),
      },
      include: {
        testCase: {
          include: {
            steps: { orderBy: { order: "asc" } },
          },
        },
        executedBy: { select: { id: true, name: true, avatar: true } },
        stepResults: {
          include: { attachments: true },
          orderBy: { stepOrder: "asc" },
        },
        defects: {
          include: {
            issue: {
              select: { id: true, title: true, status: true, priority: true, type: true },
            },
          },
        },
      },
    });

    // Đồng bộ ngược lại TestPlanCase nếu TestRun này thuộc một TestPlan
    if (runResult.testRun.planId) {
      await prisma.testPlanCase.updateMany({
        where: {
          testPlanId: runResult.testRun.planId,
          testCaseId: caseId,
        },
        data: {
          status: updatedResult.status,
          executedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      message: "Ghi nhận kết quả kiểm thử thành công.",
      result: updatedResult,
    });
  } catch (error) {
    console.error("Lỗi thực thi ca kiểm thử:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật kết quả kiểm thử." });
  }
};

/**
 * 1-Click Defect Logging: Tạo Bug ngay khi ca kiểm thử bị lỗi
 */
export const logDefectFromRun = async (req, res) => {
  try {
    const { projectId, runId, caseId } = req.params;
    const { title, description, priority, sprintId } = req.body;

    const runResult = await prisma.testRunResult.findUnique({
      where: {
        testRunId_testCaseId: {
          testRunId: runId,
          testCaseId: caseId,
        },
      },
      include: {
        testRun: {
          include: {
            environment: true,
            plan: true,
          },
        },
        testCase: {
          include: {
            steps: { orderBy: { order: "asc" } },
          },
        },
        stepResults: {
          include: { attachments: true },
          orderBy: { stepOrder: "asc" },
        },
      },
    });

    if (!runResult) {
      return res.status(404).json({ message: "Không tìm thấy kết quả ca kiểm thử." });
    }

    const tc = runResult.testCase;
    const tr = runResult.testRun;

    // Tiêu đề mặc định nếu không truyền
    const bugTitle = title?.trim() || `[Bug][Test Fail] ${tc.key}: ${tc.title}`;

    // Mô tả chi tiết tự động trích xuất các bước
    let bugDescription = description?.trim();
    if (!bugDescription) {
      const stepLines = tc.steps.map((step, idx) => {
        const sr = runResult.stepResults.find((s) => s.stepId === step.id);
        const statusBadge = sr ? `[${sr.status}]` : "[Chưa chạy]";
        let line = `**Bước ${idx + 1}**: ${step.action}\n- *Dữ liệu*: ${step.testData || "Không"}\n- *Kỳ vọng*: ${step.expectedResult}\n- *Trạng thái*: ${statusBadge}`;
        if (sr?.actualResult) {
          line += `\n- *Thực tế ghi nhận*: ${sr.actualResult}`;
        }
        return line;
      });

      bugDescription = `### 🐞 Báo cáo lỗi từ Test Execution Runner
- **Đợt kiểm thử**: ${tr.name}
- **Môi trường**: ${tr.environment?.name || "Chưa xác định"}
- **Ca kiểm thử liên quan**: ${tc.key} - ${tc.title}
- **Người báo cáo**: ${req.user.name || req.user.email}
- **Thời gian**: ${new Date().toLocaleString("vi-VN")}

---

#### Các bước kiểm thử (Steps to Reproduce):
${stepLines.join("\n\n") || "Kiểm thử tự do (Exploratory Test)"}

---

#### Kết quả thực tế (Actual Result):
${runResult.actualResult || "Hành vi không đúng như mong đợi tại bước kiểm thử lỗi."}`;
    }

    // Lấy order cao nhất trong project để xếp vào cuối bảng Kanban
    const lastIssue = await prisma.issue.findFirst({
      where: { projectId, status: "TODO" },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastIssue?.order || 0) + 1;

    let issuePriority = priority || "HIGH";
    if (issuePriority === "CRITICAL") issuePriority = "URGENT";

    // Tạo Issue mới loại BUG
    const newBug = await prisma.issue.create({
      data: {
        title: bugTitle,
        description: bugDescription,
        type: "BUG",
        status: "TODO",
        priority: issuePriority,
        order: nextOrder,
        projectId,
        sprintId: sprintId || tr.plan?.sprintId || null,
        reporterId: req.user.id,
      },
    });

    // Tạo liên kết TestRunDefect (Module 3 & 4)
    const defectLink = await prisma.testRunDefect.create({
      data: {
        runResultId: runResult.id,
        issueId: newBug.id,
      },
    });

    // Tạo liên kết Traceability 2 chiều (TestCase ↔ Issue)
    await prisma.testCaseIssue.upsert({
      where: {
        testCaseId_issueId: {
          testCaseId: tc.id,
          issueId: newBug.id,
        },
      },
      update: {},
      create: {
        testCaseId: tc.id,
        issueId: newBug.id,
      },
    });

    res.status(201).json({
      message: "Đã tạo Bug và liên kết thành công vào bảng công việc.",
      bug: newBug,
      defectLink,
    });
  } catch (error) {
    console.error("Lỗi tạo Bug từ Test Run:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo Bug tự động." });
  }
};

/**
 * Tải lên tệp/ảnh chụp màn hình đính kèm cho một bước kiểm thử
 */
export const uploadStepAttachment = async (req, res) => {
  try {
    const { runId, caseId, stepId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Vui lòng chọn tệp/ảnh để tải lên." });
    }

    const runResult = await prisma.testRunResult.findUnique({
      where: {
        testRunId_testCaseId: {
          testRunId: runId,
          testCaseId: caseId,
        },
      },
    });

    if (!runResult) {
      return res.status(404).json({ message: "Không tìm thấy kết quả ca kiểm thử." });
    }

    // Tìm hoặc tạo stepResult
    let stepResult = await prisma.testRunStepResult.findFirst({
      where: {
        runResultId: runResult.id,
        stepId,
      },
    });

    if (!stepResult) {
      stepResult = await prisma.testRunStepResult.create({
        data: {
          runResultId: runResult.id,
          stepId,
          stepOrder: 0,
          status: "FAILED",
        },
      });
    }

    // Upload lên Cloudinary hoặc lưu local
    const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
    const uploadResult = await uploadFileToStorage(file.buffer, originalName, file.mimetype);

    // Lưu vào TestRunStepAttachment
    const attachment = await prisma.testRunStepAttachment.create({
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        publicId: uploadResult.publicId || null,
        stepResultId: stepResult.id,
      },
    });

    res.status(201).json({
      message: "Tải lên bằng chứng ảnh chụp thành công.",
      attachment,
    });
  } catch (error) {
    console.error("Lỗi tải tệp đính kèm bước:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tải ảnh đính kèm." });
  }
};
