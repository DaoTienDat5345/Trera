import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Xuất danh sách test case (CSV hoặc JSON)
 * GET /api/projects/:projectId/test-cases/export?format=csv|json&folderId=xxx
 */
export const exportTestCases = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = "json", folderId } = req.query;

    const where = { projectId };
    if (folderId && folderId !== "all") {
      where.folderId = folderId === "root" ? null : folderId;
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true } },
        steps: { orderBy: { order: "asc" } },
      },
      orderBy: [{ key: "asc" }],
    });

    if (format.toLowerCase() === "csv") {
      const rows = [];
      rows.push(["Key", "Title", "Type", "Priority", "Folder", "Preconditions", "Step #", "Action", "Test Data", "Expected Result", "Gherkin Content"].join(","));

      for (const tc of testCases) {
        const folderName = tc.folder ? `"${tc.folder.name.replace(/"/g, '""')}"` : '""';
        const title = `"${tc.title.replace(/"/g, '""')}"`;
        const pre = tc.preconditions ? `"${tc.preconditions.replace(/"/g, '""')}"` : '""';
        const gherkin = tc.gherkinContent ? `"${tc.gherkinContent.replace(/"/g, '""')}"` : '""';

        if (tc.type === "MANUAL" && tc.steps.length > 0) {
          for (const s of tc.steps) {
            const action = `"${s.action.replace(/"/g, '""')}"`;
            const data = s.testData ? `"${s.testData.replace(/"/g, '""')}"` : '""';
            const expected = `"${s.expectedResult.replace(/"/g, '""')}"`;
            rows.push([tc.key, title, tc.type, tc.priority, folderName, pre, s.order, action, data, expected, '""'].join(","));
          }
        } else {
          rows.push([tc.key, title, tc.type, tc.priority, folderName, pre, "", '""', '""', '""', gherkin].join(","));
        }
      }

      const csvString = rows.join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=test_cases_${projectId}.csv`);
      return res.status(200).send("\uFEFF" + csvString);
    }

    // Default JSON
    return res.status(200).json({ testCases });
  } catch (error) {
    console.error("Lỗi xuất test cases:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xuất test case." });
  }
};

/**
 * Nhập danh sách test case (CSV, JSON hoặc Cucumber Gherkin .feature)
 * POST /api/projects/:projectId/test-cases/import
 */
export const importTestCases = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = "json", content, folderId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Nội dung dữ liệu import không được để trống." });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Dự án không tồn tại." });
    }

    let casesToCreate = [];

    if (format === "json") {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      const list = Array.isArray(parsed) ? parsed : (parsed.testCases || []);

      for (const item of list) {
        if (!item.title) continue;
        casesToCreate.push({
          title: item.title,
          description: item.description || null,
          type: item.type?.toUpperCase() === "BDD" ? "BDD" : "MANUAL",
          priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(item.priority?.toUpperCase())
            ? item.priority.toUpperCase()
            : "MEDIUM",
          preconditions: item.preconditions || null,
          gherkinContent: item.gherkinContent || null,
          steps: Array.isArray(item.steps) ? item.steps : [],
        });
      }
    } else if (format === "gherkin") {
      // Phân tích cú pháp file .feature (Cucumber)
      // Tách các Scenario:
      const lines = content.split("\n");
      let currentScenario = null;
      let currentGherkinLines = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("Scenario:") || trimmed.startsWith("Scenario Outline:")) {
          if (currentScenario) {
            casesToCreate.push({
              title: currentScenario,
              type: "BDD",
              priority: "MEDIUM",
              gherkinContent: currentGherkinLines.join("\n"),
              steps: [],
            });
          }
          currentScenario = trimmed.replace(/^Scenario( Outline)?:\s*/, "");
          currentGherkinLines = [line];
        } else if (currentScenario) {
          currentGherkinLines.push(line);
        }
      }

      if (currentScenario) {
        casesToCreate.push({
          title: currentScenario,
          type: "BDD",
          priority: "MEDIUM",
          gherkinContent: currentGherkinLines.join("\n"),
          steps: [],
        });
      }
    } else if (format === "csv") {
      // Parse CSV đơn giản
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        // Bỏ dòng header
        const mapByTitle = new Map();

        for (let i = 1; i < lines.length; i++) {
          // Xử lý tách dấu phẩy cơ bản
          const parts = lines[i].split(",").map((p) => p.replace(/^"|"$/g, "").trim());
          if (parts.length < 2) continue;

          // Cấu trúc cột: Key(0), Title(1), Type(2), Priority(3), Folder(4), Preconditions(5), Step#(6), Action(7), Test Data(8), Expected Result(9), Gherkin(10)
          const title = parts[1] || parts[0];
          const type = parts[2]?.toUpperCase() === "BDD" ? "BDD" : "MANUAL";
          const priority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parts[3]?.toUpperCase()) ? parts[3].toUpperCase() : "MEDIUM";
          const preconditions = parts[5] || null;
          const action = parts[7];
          const testData = parts[8] || null;
          const expectedResult = parts[9] || "";
          const gherkin = parts[10] || null;

          if (!mapByTitle.has(title)) {
            mapByTitle.set(title, {
              title,
              type,
              priority,
              preconditions,
              gherkinContent: gherkin,
              steps: [],
            });
          }

          if (action) {
            const entry = mapByTitle.get(title);
            entry.steps.push({
              order: entry.steps.length + 1,
              action,
              testData,
              expectedResult,
            });
          }
        }

        casesToCreate = Array.from(mapByTitle.values());
      }
    }

    if (casesToCreate.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy test case hợp lệ trong dữ liệu nhập." });
    }

    // Tạo test cases tuần tự để sinh Key chuẩn
    let createdCount = 0;
    let currentCount = await prisma.testCase.count({ where: { projectId } });

    for (const c of casesToCreate) {
      currentCount++;
      const key = `${project.key}-TC-${currentCount}`;

      await prisma.$transaction(async (tx) => {
        const created = await tx.testCase.create({
          data: {
            key,
            title: c.title,
            description: c.description || null,
            type: c.type,
            priority: c.priority,
            preconditions: c.preconditions,
            gherkinContent: c.gherkinContent,
            folderId: folderId || null,
            projectId,
            authorId: req.user.id,
          },
        });

        if (c.type === "MANUAL" && c.steps.length > 0) {
          await tx.testStep.createMany({
            data: c.steps.map((s, idx) => ({
              testCaseId: created.id,
              order: s.order || idx + 1,
              action: s.action || "",
              testData: s.testData || null,
              expectedResult: s.expectedResult || "",
            })),
          });
        }
      });

      createdCount++;
    }

    return res.status(201).json({
      message: `Đã nhập thành công ${createdCount} test case vào dự án!`,
      count: createdCount,
    });
  } catch (error) {
    console.error("Lỗi import test cases:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi nhập test cases." });
  }
};