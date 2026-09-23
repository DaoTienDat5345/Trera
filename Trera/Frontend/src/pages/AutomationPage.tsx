import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid,
  List,
  Users,
  BarChart3,
  GitMerge,
  ArrowLeft,
  FlaskConical,
  ClipboardList,
  GitFork,
  Cpu,
  Key,
  UploadCloud,
  FileCode,
  Radio,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Terminal,
  Webhook as WebhookIcon,
  Send,
  Zap,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useProjectStore } from "../store/projectStore";
import { useAutomationStore } from "../store/automationStore";
import type { ApiTokenItem, WebhookItem } from "../store/automationStore";
import { toast } from "sonner";

export default function AutomationPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();
  const {
    tokens,
    webhooks,
    summary,
    isLoading,
    latestCreatedToken,
    latestUploadResult,
    fetchApiTokens,
    createApiToken,
    revokeApiToken,
    clearLatestCreatedToken,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    testWebhook,
    fetchAutomationSummary,
    uploadJUnitXml,
    uploadCucumberJson,
    clearLatestUploadResult,
  } = useAutomationStore();

  const [activeTab, setActiveTab] = useState<"tokens" | "upload" | "cicd" | "webhooks">("tokens");

  // Create Token Modal
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenRole, setTokenRole] = useState("AUTOMATION");
  const [tokenExpiryDays, setTokenExpiryDays] = useState(30);
  const [copiedToken, setCopiedToken] = useState(false);

  // Upload State
  const [uploadType, setUploadType] = useState<"junit" | "cucumber">("junit");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customRunName, setCustomRunName] = useState("");
  const [autoLogBugs, setAutoLogBugs] = useState(true);
  const [createMissingCases, setCreateMissingCases] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Webhook Modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // Pipeline snippet tab
  const [snippetTab, setSnippetTab] = useState<"github" | "gitlab" | "jenkins" | "curl">("github");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    await Promise.all([
      getProjectById(projectId),
      fetchApiTokens(projectId),
      fetchWebhooks(projectId),
      fetchAutomationSummary(projectId),
    ]);
  }, [projectId, getProjectById, fetchApiTokens, fetchWebhooks, fetchAutomationSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !tokenName.trim()) return;

    try {
      await createApiToken(projectId, {
        name: tokenName.trim(),
        role: tokenRole,
        expiresInDays: tokenExpiryDays > 0 ? tokenExpiryDays : undefined,
      });
      setShowCreateTokenModal(false);
      setTokenName("");
      toast.success("Tạo API Token thành công! Vui lòng sao chép token ngay.");
    } catch {
      toast.error("Không thể tạo API Token");
    }
  };

  const handleRevokeToken = async (tokenId: string, name: string) => {
    if (!projectId) return;
    if (!confirm(`Bạn có chắc muốn thu hồi API Token "${name}"? Các pipeline sử dụng token này sẽ không thể gửi kết quả nữa.`)) return;

    try {
      await revokeApiToken(projectId, tokenId);
      toast.success("Đã thu hồi API Token thành công");
    } catch {
      toast.error("Không thể thu hồi API Token");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    toast.success("Đã sao chép token vào clipboard!");
    setTimeout(() => setCopiedToken(false), 3000);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedFile) {
      toast.error("Vui lòng chọn tệp kết quả kiểm thử");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (customRunName.trim()) formData.append("name", customRunName.trim());
    formData.append("autoLogBugs", String(autoLogBugs));
    formData.append("createMissingCases", String(createMissingCases));

    try {
      if (uploadType === "junit") {
        await uploadJUnitXml(projectId, formData);
      } else {
        await uploadCucumberJson(projectId, formData);
      }
      toast.success("Nhập kết quả kiểm thử tự động thành công!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi nhập tệp kết quả");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !webhookName.trim() || !webhookUrl.trim()) return;

    try {
      await createWebhook(projectId, {
        name: webhookName.trim(),
        url: webhookUrl.trim(),
        secret: webhookSecret.trim() || undefined,
        events: ["TEST_RUN_COMPLETED"],
      });
      setShowWebhookModal(false);
      setWebhookName("");
      setWebhookUrl("");
      setWebhookSecret("");
      toast.success("Tạo Webhook thành công!");
    } catch {
      toast.error("Không thể tạo Webhook");
    }
  };

  const handleTestWebhook = async (hookId: string) => {
    if (!projectId) return;
    setTestingWebhookId(hookId);
    try {
      const res = await testWebhook(projectId, hookId);
      if (res.ok) {
        toast.success(`Kết nối Webhook thành công!${res.statusCode ? ` (Mã ${res.statusCode})` : ""}`);
      } else {
        toast.warning(res.message);
      }
    } catch {
      toast.error("Không thể kết nối đến Webhook");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleDeleteWebhook = async (hookId: string, name: string) => {
    if (!projectId) return;
    if (!confirm(`Bạn có chắc muốn xóa Webhook "${name}"?`)) return;

    try {
      await deleteWebhook(projectId, hookId);
      toast.success("Đã xóa Webhook thành công");
    } catch {
      toast.error("Không thể xóa Webhook");
    }
  };

  if (!projectId) return null;

  // Code snippets for CI/CD
  const apiBaseUrl = window.location.origin.replace("5173", "5001");
  const snippets = {
    github: `name: Playwright E2E Tests & Trera Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run Playwright Tests with JUnit reporter
        run: npx playwright test --reporter=junit
        env:
          PLAYWRIGHT_JUNIT_OUTPUT_NAME: results.xml
        continue-on-error: true

      - name: Send Test Results to Trera QA Platform
        run: |
          curl -X POST "${apiBaseUrl}/api/projects/${projectId}/automation/junit" \\
            -H "Authorization: Bearer \${{ secrets.TRERA_API_TOKEN }}" \\
            -F "file=@results.xml" \\
            -F "name=Playwright Run #\${{ github.run_number }}" \\
            -F "autoLogBugs=true" \\
            -F "createMissingCases=true"`,
    gitlab: `stages:
  - test
  - report

e2e_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.45.0-jammy
  script:
    - npm ci
    - npx playwright test --reporter=junit
  artifacts:
    when: always
    paths:
      - results.xml
  allow_failure: true

trera_report:
  stage: report
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST "${apiBaseUrl}/api/projects/${projectId}/automation/junit" \\
        -H "Authorization: Bearer $TRERA_API_TOKEN" \\
        -F "file=@results.xml" \\
        -F "name=GitLab CI #$CI_PIPELINE_IID" \\
        -F "autoLogBugs=true"`,
    jenkins: `pipeline {
    agent any

    environment {
        TRERA_TOKEN = credentials('trera-api-token')
    }

    stages {
        stage('Run Tests') {
            steps {
                sh 'npm test -- --reporter=junit --outputFile=junit.xml || true'
            }
        }
        stage('Publish to Trera') {
            steps {
                sh '''
                    curl -X POST "${apiBaseUrl}/api/projects/${projectId}/automation/junit" \\
                      -H "Authorization: Bearer \${TRERA_TOKEN}" \\
                      -F "file=@junit.xml" \\
                      -F "name=Jenkins Build #\${BUILD_NUMBER}" \\
                      -F "autoLogBugs=true"
                '''
            }
        }
    }
}`,
    curl: `curl -X POST "${apiBaseUrl}/api/projects/${projectId}/automation/junit" \\
  -H "Authorization: Bearer tre_live_YOUR_API_TOKEN" \\
  -F "file=@results.xml" \\
  -F "name=Automated Build" \\
  -F "autoLogBugs=true" \\
  -F "createMissingCases=true"`,
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Subheader Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600">
              {currentProject?.name}
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Tự động hóa & CI/CD</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <Cpu size={18} className="text-indigo-600" />
            <span>Tự động hóa & CI/CD</span>
          </h1>

          <nav className="flex items-center gap-1 ml-4">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LayoutGrid size={14} /> Bảng
            </Link>
            <Link
              to={`/projects/${projectId}/sprints`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <List size={14} /> Backlog
            </Link>
            <Link
              to={`/projects/${projectId}/repository`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <FlaskConical size={14} /> Kho Test Case
            </Link>
            <Link
              to={`/projects/${projectId}/test-plans`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ClipboardList size={14} /> Kế hoạch Test
            </Link>
            <Link
              to={`/projects/${projectId}/traceability`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitFork size={14} /> Ma trận truy vết
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
              <Cpu size={14} /> CI/CD & API
            </button>
            <Link
              to={`/projects/${projectId}/members`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Users size={14} /> Thành viên
            </Link>
            <Link
              to={`/projects/${projectId}/reports`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <BarChart3 size={14} /> Báo cáo
            </Link>
            <Link
              to={`/projects/${projectId}/activity`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitMerge size={14} /> Lịch sử
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "tokens"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Key size={14} />
            <span>API Tokens</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "upload"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud size={14} />
            <span>Nhập kết quả (Upload & Preview)</span>
          </button>

          <button
            onClick={() => setActiveTab("cicd")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "cicd"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal size={14} />
            <span>Mẫu cấu hình CI/CD Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("webhooks")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "webhooks"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <WebhookIcon size={14} />
            <span>Webhooks</span>
          </button>
        </div>

        {activeTab === "tokens" && (
          <button
            onClick={() => setShowCreateTokenModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Tạo API Token mới</span>
          </button>
        )}

        {activeTab === "webhooks" && (
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Thêm Webhook</span>
          </button>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Metric Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">Đợt chạy tự động (CI/CD Runs)</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Cpu size={16} />
                  </div>
                </div>
                <div className="text-[24px] font-bold text-slate-800 mt-2">{summary.totalRuns}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tích hợp từ GitHub, GitLab, Jenkins</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">Tổng ca test đã thực thi</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <FlaskConical size={16} />
                  </div>
                </div>
                <div className="text-[24px] font-bold text-slate-800 mt-2">{summary.totalTestsExecuted}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Qua các đợt chạy tự động</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">Tỷ lệ Đạt trung bình (Pass Rate)</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="text-[24px] font-bold text-emerald-600 mt-2">{summary.overallPassRate}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Đánh giá chất lượng pipeline</div>
              </div>
            </div>
          )}

          {/* TAB 1: API TOKENS */}
          {activeTab === "tokens" && (
            <div className="space-y-6">
              {/* Token Secret Alert Banner (shows once when created) */}
              {latestCreatedToken && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-xs animate-in fade-in">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                        <Key size={18} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-emerald-900">
                          API Token Mới Đã Được Tạo Thành Công!
                        </h4>
                        <p className="text-[13px] text-emerald-700 mt-1">
                          Hãy sao chép và lưu trữ mã token này ở nơi an toàn. Vì lý do bảo mật, bạn sẽ không thể xem lại mã này sau khi đóng thông báo.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="bg-white border border-emerald-200 px-3 py-1.5 rounded-xl font-mono text-[13px] text-emerald-800 font-bold select-all">
                            {latestCreatedToken}
                          </code>
                          <button
                            onClick={() => handleCopy(latestCreatedToken)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-medium transition-colors"
                          >
                            {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedToken ? "Đã chép" : "Sao chép"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={clearLatestCreatedToken}
                      className="text-emerald-500 hover:text-emerald-700 text-[13px] font-medium"
                    >
                      Đã lưu token ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Tokens Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-800">Danh sách API Tokens</h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Sử dụng các token này để xác thực trong header: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">Authorization: Bearer tre_live_...</code> hoặc <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">x-api-key: tre_live_...</code>
                    </p>
                  </div>
                </div>

                {tokens.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Key size={32} className="mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-[14px]">Dự án chưa có API Token nào.</p>
                    <p className="text-[12px] mt-1">Bấm "Tạo API Token mới" để kết nối pipeline CI/CD của bạn.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3">Tên Token</th>
                          <th className="px-6 py-3">Tiền tố (Prefix)</th>
                          <th className="px-6 py-3">Quyền hạn</th>
                          <th className="px-6 py-3">Ngày tạo</th>
                          <th className="px-6 py-3">Sử dụng gần nhất</th>
                          <th className="px-6 py-3">Hết hạn</th>
                          <th className="px-6 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {tokens.map((token) => (
                          <tr key={token.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-800">
                              <div className="flex items-center gap-2">
                                <Key size={14} className="text-indigo-600" />
                                <span>{token.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-mono text-[12px] text-slate-600">
                              {token.prefix}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {token.role}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 text-[12px]">
                              {new Date(token.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 text-[12px]">
                              {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString("vi-VN") : "Chưa sử dụng"}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 text-[12px]">
                              {token.expiresAt ? (
                                <span className={new Date(token.expiresAt) < new Date() ? "text-red-600 font-bold" : ""}>
                                  {new Date(token.expiresAt).toLocaleDateString("vi-VN")}
                                </span>
                              ) : (
                                "Không bao giờ"
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={() => handleRevokeToken(token.id, token.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Thu hồi token"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD & PREVIEW */}
          {activeTab === "upload" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud size={18} className="text-indigo-600" />
                  <span>Nhập tệp kết quả kiểm thử tự động</span>
                </h3>

                <form onSubmit={handleFileUpload} className="space-y-4">
                  {/* Format Selector */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Định dạng kiểm thử
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadType("junit")}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          uploadType === "junit"
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/10 font-medium"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <FileCode size={20} className={uploadType === "junit" ? "text-indigo-600" : "text-slate-400"} />
                        <div>
                          <div className="font-bold text-[13px]">JUnit XML</div>
                          <div className="text-[11px] text-slate-500">Playwright, Cypress, Jest, PyTest</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadType("cucumber")}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          uploadType === "cucumber"
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-600/10 font-medium"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Zap size={20} className={uploadType === "cucumber" ? "text-emerald-600" : "text-slate-400"} />
                        <div>
                          <div className="font-bold text-[13px]">Cucumber JSON</div>
                          <div className="text-[11px] text-slate-500">BDD Cucumber, SpecFlow</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Tệp kết quả ({uploadType === "junit" ? ".xml" : ".json"})
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={uploadType === "junit" ? ".xml" : ".json"}
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
                      {selectedFile ? (
                        <div className="font-bold text-[13px] text-indigo-700">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </div>
                      ) : (
                        <div>
                          <p className="text-[13px] font-semibold text-slate-700">Nhấp để chọn tệp hoặc kéo thả vào đây</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Dung lượng tối đa: 25MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Run Name */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Tên đợt kiểm thử (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={customRunName}
                      onChange={(e) => setCustomRunName(e.target.value)}
                      placeholder="Ví dụ: Playwright E2E Nightly Run #120"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={autoLogBugs}
                        onChange={(e) => setAutoLogBugs(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium">1-Click Auto Bug: Tự động tạo Bug trên Kanban khi ca test bị lỗi</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={createMissingCases}
                        onChange={(e) => setCreateMissingCases(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium">Tự động tạo ca test mới trong Kho Test Case nếu chưa tồn tại</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[14px] font-bold shadow-xs transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Đang xử lý và phân tích tệp...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Nhập kết quả vào Trera</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Upload Result Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>Kết quả phân tích trực tiếp</span>
                  </h3>

                  {latestUploadResult ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <div className="font-bold text-emerald-900 text-[14px]">{latestUploadResult.message}</div>
                        <div className="text-[12px] text-emerald-700 mt-1">
                          Đợt kiểm thử: <span className="font-semibold">{latestUploadResult.testRun?.name}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-[11px] text-slate-500 font-semibold">TỔNG</div>
                          <div className="text-[18px] font-bold text-slate-800">{latestUploadResult.summary.total}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <div className="text-[11px] text-emerald-700 font-semibold">ĐẠT</div>
                          <div className="text-[18px] font-bold text-emerald-600">{latestUploadResult.summary.passed}</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl">
                          <div className="text-[11px] text-red-700 font-semibold">LỖI</div>
                          <div className="text-[18px] font-bold text-red-600">{latestUploadResult.summary.failed}</div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <div className="text-[11px] text-amber-700 font-semibold">BỎ QUA</div>
                          <div className="text-[18px] font-bold text-amber-600">{latestUploadResult.summary.skipped}</div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tỷ lệ Pass Rate:</span>
                          <span className="font-bold text-emerald-600">{latestUploadResult.summary.passRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Thời lượng thực thi:</span>
                          <span className="font-bold text-slate-700">{latestUploadResult.summary.durationSeconds}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ca test ánh xạ thành công:</span>
                          <span className="font-bold text-slate-700">{latestUploadResult.resolvedCasesCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bug tự động tạo trên Kanban:</span>
                          <span className="font-bold text-red-600">{latestUploadResult.createdDefectsCount}</span>
                        </div>
                      </div>

                      <Link
                        to={`/projects/${projectId}/test-plans`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-[13px] hover:underline"
                      >
                        <span>Xem chi tiết đợt chạy trong Kế hoạch kiểm thử</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400">
                      <FileCode size={36} className="mx-auto mb-2 opacity-30 text-indigo-400" />
                      <p className="text-[14px]">Chưa có kết quả phân tích nào.</p>
                      <p className="text-[12px] mt-1">Chọn tệp và bấm "Nhập kết quả" để xem bảng tổng hợp.</p>
                    </div>
                  )}
                </div>

                {latestUploadResult && (
                  <button
                    onClick={clearLatestUploadResult}
                    className="w-full mt-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[13px] font-medium transition-colors"
                  >
                    Xóa kết quả xem trước
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CI/CD PIPELINE GUIDES */}
          {activeTab === "cicd" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <Terminal size={18} className="text-indigo-600" />
                  <span>Mẫu cấu hình CI/CD Pipeline</span>
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Sao chép đoạn mã cấu hình dưới đây và đưa vào repository dự án của bạn để tự động nộp kết quả test sau mỗi lần build.
                </p>
              </div>

              {/* Sub-tabs for CI tools */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSnippetTab("github")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-xl transition-all ${
                      snippetTab === "github"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    GitHub Actions
                  </button>
                  <button
                    onClick={() => setSnippetTab("gitlab")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-xl transition-all ${
                      snippetTab === "gitlab"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    GitLab CI
                  </button>
                  <button
                    onClick={() => setSnippetTab("jenkins")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-xl transition-all ${
                      snippetTab === "jenkins"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Jenkins
                  </button>
                  <button
                    onClick={() => setSnippetTab("curl")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-xl transition-all ${
                      snippetTab === "curl"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    cURL Command
                  </button>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(snippets[snippetTab]);
                    setCopiedSnippet(true);
                    toast.success("Đã sao chép cấu hình!");
                    setTimeout(() => setCopiedSnippet(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors"
                >
                  {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSnippet ? "Đã sao chép" : "Sao chép cấu hình"}</span>
                </button>
              </div>

              {/* Code block */}
              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-[12px] leading-relaxed overflow-x-auto shadow-inner">
                  {snippets[snippetTab]}
                </pre>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-700">📌 Gợi ý thiết lập Secrets:</div>
                <p>1. Tạo một API Token trong tab <strong>API Tokens</strong>.</p>
                <p>2. Thêm vào mục <strong>Settings &gt; Secrets and Variables &gt; Actions</strong> trong GitHub với tên <code className="bg-slate-200 px-1 py-0.5 rounded">TRERA_API_TOKEN</code>.</p>
                <p>3. Mỗi lần commit hoặc pull request, pipeline sẽ tự động chạy và gửi báo cáo về Trera.</p>
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOKS */}
          {activeTab === "webhooks" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-800">Cấu hình Webhooks</h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Gửi thông báo HTTP POST tự động tới Slack, Discord hoặc hệ thống nội bộ khi đợt chạy test hoàn tất.
                    </p>
                  </div>
                </div>

                {webhooks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <WebhookIcon size={32} className="mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-[14px]">Dự án chưa cấu hình Webhook nào.</p>
                    <p className="text-[12px] mt-1">Bấm "Thêm Webhook" để nhận thông báo thời gian thực.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {webhooks.map((hook) => (
                      <div key={hook.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-[14px]">{hook.name}</span>
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Hoạt động
                            </span>
                          </div>
                          <div className="font-mono text-[12px] text-slate-500">{hook.url}</div>
                          <div className="flex items-center gap-2 mt-2">
                            {hook.events.map((ev) => (
                              <span key={ev} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] rounded-md font-mono">
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestWebhook(hook.id)}
                            disabled={testingWebhookId === hook.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-50"
                          >
                            {testingWebhookId === hook.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>Thử nghiệm</span>
                          </button>
                          <button
                            onClick={() => handleDeleteWebhook(hook.id, hook.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa Webhook"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tạo API Token Mới */}
      {showCreateTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                <span>Tạo API Token CI/CD Mới</span>
              </h3>
              <button
                onClick={() => setShowCreateTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Tên gợi nhớ của Token *
                </label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Ví dụ: GitHub Actions Pipeline, Jenkins Server"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Quyền hạn (Role)
                </label>
                <select
                  value={tokenRole}
                  onChange={(e) => setTokenRole(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AUTOMATION">AUTOMATION (Nộp kết quả JUnit/Cucumber & tạo Bug)</option>
                  <option value="ADMIN">ADMIN (Toàn quyền quản trị qua API)</option>
                  <option value="READ_ONLY">READ_ONLY (Chỉ đọc dữ liệu kiểm thử)</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Thời hạn hiệu lực
                </label>
                <select
                  value={tokenExpiryDays}
                  onChange={(e) => setTokenExpiryDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={7}>7 ngày</option>
                  <option value={30}>30 ngày (Khuyến nghị)</option>
                  <option value={90}>90 ngày</option>
                  <option value={365}>1 năm</option>
                  <option value={0}>Không bao giờ hết hạn</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTokenModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !tokenName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[13px] font-bold transition-colors shadow-xs"
                >
                  {isLoading ? "Đang tạo..." : "Xác nhận tạo token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Webhook Mới */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                <WebhookIcon size={18} className="text-indigo-600" />
                <span>Thêm Webhook Mới</span>
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-slate-600 text-[14px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Tên Webhook *
                </label>
                <input
                  type="text"
                  required
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="Ví dụ: Slack Alerts, Discord Channel"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Payload URL *
                </label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Secret Token (Tùy chọn)
                </label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Khóa bí mật xác thực X-Trera-Secret"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-[13px] font-medium hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!webhookName.trim() || !webhookUrl.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-[13px] font-bold transition-colors shadow-xs"
                >
                  Lưu Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
