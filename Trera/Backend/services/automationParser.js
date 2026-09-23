/**
 * automationParser.js
 * Bộ parser phân tích kết quả kiểm thử tự động từ JUnit XML và Cucumber JSON
 */

/**
 * Trích xuất mã Test Case từ text (ví dụ: "TRE-TC-1", "P4847-TC-2", "@TRE-TC-3")
 * @param {string} text 
 * @returns {string|null}
 */
export const extractTestCaseKey = (text) => {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/([A-Z0-9]+-TC-[0-9]+)/i);
  if (match) return match[1].toUpperCase();

  const tcMatch = text.match(/(?:TC|Case)[#_\s-]*([0-9]+)/i);
  if (tcMatch) return `TC-${tcMatch[1]}`;

  return null;
};

/**
 * Helper trích xuất giá trị thuộc tính từ thẻ XML
 * @param {string} tagString 
 * @param {string} attrName 
 * @returns {string}
 */
const getXmlAttr = (tagString, attrName) => {
  const regex = new RegExp(`${attrName}=["']([^"']*)["']`, "i");
  const match = tagString.match(regex);
  return match ? match[1] : "";
};

/**
 * Phân tích chuỗi JUnit XML chuẩn (Playwright, Cypress, Jest, PyTest, Selenium, xUnit, Vitest)
 * @param {string} xmlContent 
 * @returns {{
 *   suites: Array<{ name: string, tests: number, failures: number, skipped: number, time: number }>,
 *   testCases: Array<{
 *     name: string,
 *     classname: string,
 *     durationSeconds: number,
 *     status: 'PASSED' | 'FAILED' | 'SKIPPED',
 *     failureMessage?: string,
 *     stackTrace?: string,
 *     detectedKey: string | null
 *   }>,
 *   summary: {
 *     total: number,
 *     passed: number,
 *     failed: number,
 *     skipped: number,
 *     durationSeconds: number,
 *     passRate: number
 *   }
 * }}
 */
export const parseJUnitXml = (xmlContent) => {
  if (!xmlContent || typeof xmlContent !== "string") {
    throw new Error("Nội dung JUnit XML rỗng hoặc không hợp lệ.");
  }

  const testCases = [];
  const suites = [];
  let totalDuration = 0;

  // 1. Phân tích các <testsuite ...>
  const suiteRegex = /<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/gi;
  let suiteMatch;

  // Kiểm tra xem có testsuite nào không, nếu không có thẻ đóng (tự đóng hoặc chỉ có testcase lẻ)
  const hasSuites = /<testsuite\b/i.test(xmlContent);

  if (hasSuites) {
    while ((suiteMatch = suiteRegex.exec(xmlContent)) !== null) {
      const suiteAttrs = suiteMatch[1];
      const suiteBody = suiteMatch[2];

      const suiteName = getXmlAttr(suiteAttrs, "name") || "TestSuite";
      const suiteTime = parseFloat(getXmlAttr(suiteAttrs, "time")) || 0;
      totalDuration += suiteTime;

      suites.push({
        name: suiteName,
        tests: parseInt(getXmlAttr(suiteAttrs, "tests")) || 0,
        failures: parseInt(getXmlAttr(suiteAttrs, "failures")) || 0,
        skipped: parseInt(getXmlAttr(suiteAttrs, "skipped")) || 0,
        time: suiteTime,
      });

      // Phân tích các <testcase> bên trong suite
      parseTestCasesFromBody(suiteBody, suiteName, testCases);
    }
  }

  // Nếu không tìm thấy <testcase> qua suite regex (ví dụ XML phẳng hoặc cấu trúc khác)
  if (testCases.length === 0) {
    parseTestCasesFromBody(xmlContent, "DefaultSuite", testCases);
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const tc of testCases) {
    if (tc.status === "PASSED") passed++;
    else if (tc.status === "FAILED") failed++;
    else if (tc.status === "SKIPPED") skipped++;
  }

  const total = testCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    suites,
    testCases,
    summary: {
      total,
      passed,
      failed,
      skipped,
      durationSeconds: Math.round(totalDuration * 100) / 100,
      passRate,
    },
  };
};

/**
 * Trích xuất các thẻ testcase từ đoạn XML
 */
const parseTestCasesFromBody = (body, defaultSuiteName, results) => {
  // Regex khớp cả dạng đóng đầy đủ <testcase ...>...</testcase> lẫn tự đóng <testcase ... />
  const tcRegex = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gi;
  let tcMatch;

  while ((tcMatch = tcRegex.exec(body)) !== null) {
    const tcAttrs = tcMatch[1];
    const tcBody = tcMatch[2] || "";

    const name = getXmlAttr(tcAttrs, "name") || "Unnamed Test";
    const classname = getXmlAttr(tcAttrs, "classname") || defaultSuiteName;
    const time = parseFloat(getXmlAttr(tcAttrs, "time")) || 0;

    let status = "PASSED";
    let failureMessage = "";
    let stackTrace = "";

    // Kiểm tra <failure> hoặc <error>
    const failureMatch = tcBody.match(/<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>/i);
    const failureSelfClosing = tcBody.match(/<(failure|error)\b([^>]*?)\/>/i);

    if (failureMatch) {
      status = "FAILED";
      const fAttrs = failureMatch[2];
      failureMessage = getXmlAttr(fAttrs, "message") || "Test assertion failed";
      stackTrace = failureMatch[3].trim();
    } else if (failureSelfClosing) {
      status = "FAILED";
      failureMessage = getXmlAttr(failureSelfClosing[2], "message") || "Test assertion failed";
    }

    // Kiểm tra <skipped>
    if (status !== "FAILED") {
      const skippedMatch = tcBody.match(/<skipped\b([^>]*?)(?:\/>|>([\s\S]*?)<\/skipped>)/i);
      if (skippedMatch) {
        status = "SKIPPED";
        failureMessage = getXmlAttr(skippedMatch[1], "message") || "Test skipped";
      }
    }

    const detectedKey = extractTestCaseKey(name) || extractTestCaseKey(classname);

    results.push({
      name,
      classname,
      durationSeconds: Math.round(time * 100) / 100,
      status,
      failureMessage: failureMessage || undefined,
      stackTrace: stackTrace || undefined,
      detectedKey,
    });
  }
};

/**
 * Phân tích file Cucumber JSON (BDD format)
 * @param {string|Array} input 
 * @returns {{
 *   features: Array<any>,
 *   testCases: Array<{
 *     name: string,
 *     featureName: string,
 *     durationSeconds: number,
 *     status: 'PASSED' | 'FAILED' | 'SKIPPED',
 *     steps: Array<{
 *       keyword: string,
 *       name: string,
 *       status: 'PASSED' | 'FAILED' | 'SKIPPED',
 *       durationSeconds: number,
 *       errorMessage?: string
 *     }>,
 *     detectedKey: string | null
 *   }>,
 *   summary: {
 *     total: number,
 *     passed: number,
 *     failed: number,
 *     skipped: number,
 *     durationSeconds: number,
 *     passRate: number
 *   }
 * }}
 */
export const parseCucumberJson = (input) => {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      throw new Error("Dữ liệu Cucumber JSON không đúng định dạng cú pháp JSON.");
    }
  }

  if (!Array.isArray(data)) {
    throw new Error("Cấu trúc Cucumber JSON phải là một mảng (Array) các Features.");
  }

  const features = [];
  const testCases = [];
  let totalDurationSeconds = 0;

  for (const feature of data) {
    const featureName = feature.name || "Unnamed Feature";
    features.push({
      id: feature.id,
      name: featureName,
      uri: feature.uri,
    });

    const elements = feature.elements || [];
    for (const el of elements) {
      if (el.type !== "scenario" && el.keyword !== "Scenario") continue;

      const scenarioName = el.name || "Unnamed Scenario";
      const rawSteps = el.steps || [];

      let scenarioStatus = "PASSED";
      let scenarioDurationSec = 0;
      const parsedSteps = [];

      for (const st of rawSteps) {
        const stepResult = st.result || {};
        const stRawStatus = (stepResult.status || "passed").toLowerCase();

        let stepStatus = "PASSED";
        if (stRawStatus === "failed") {
          stepStatus = "FAILED";
          scenarioStatus = "FAILED";
        } else if (stRawStatus === "skipped" || stRawStatus === "pending" || stRawStatus === "undefined") {
          stepStatus = "SKIPPED";
          if (scenarioStatus !== "FAILED") scenarioStatus = "SKIPPED";
        }

        // Cucumber lưu duration bằng nanoseconds (1s = 1_000_000_000 ns)
        const stepSec = stepResult.duration ? stepResult.duration / 1_000_000_000 : 0;
        scenarioDurationSec += stepSec;

        parsedSteps.push({
          keyword: st.keyword ? st.keyword.trim() : "Step",
          name: st.name || "",
          status: stepStatus,
          durationSeconds: Math.round(stepSec * 100) / 100,
          errorMessage: stepResult.error_message || undefined,
        });
      }

      totalDurationSeconds += scenarioDurationSec;

      // Tìm test key từ scenario name hoặc tags
      let detectedKey = extractTestCaseKey(scenarioName);
      if (!detectedKey && el.tags && Array.isArray(el.tags)) {
        for (const tag of el.tags) {
          const k = extractTestCaseKey(tag.name || "");
          if (k) {
            detectedKey = k;
            break;
          }
        }
      }

      testCases.push({
        name: scenarioName,
        featureName,
        durationSeconds: Math.round(scenarioDurationSec * 100) / 100,
        status: scenarioStatus,
        steps: parsedSteps,
        detectedKey,
      });
    }
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const tc of testCases) {
    if (tc.status === "PASSED") passed++;
    else if (tc.status === "FAILED") failed++;
    else if (tc.status === "SKIPPED") skipped++;
  }

  const total = testCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    features,
    testCases,
    summary: {
      total,
      passed,
      failed,
      skipped,
      durationSeconds: Math.round(totalDurationSeconds * 100) / 100,
      passRate,
    },
  };
};
