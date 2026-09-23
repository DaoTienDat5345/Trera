import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid,
  List,
  Users,
  BarChart3,
  GitMerge,
  ArrowLeft,
  FlaskConical,
  Layers,
  ClipboardList,
  GitFork,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Bug,
  ShieldAlert,
  HelpCircle,
  FolderCheck,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  X,
  ExternalLink,
  Flame,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useProjectStore } from "../store/projectStore";
import { useSprintStore } from "../store/sprintStore";
import { useTraceabilityStore } from "../store/traceabilityStore";
import type {
  TraceabilityItem,
  CoverageQualityStatus,
} from "../store/traceabilityStore";
import LinkTestCaseModal from "../components/traceability/LinkTestCaseModal";
import { toast } from "sonner";

const QUALITY_BADGE: Record<
  CoverageQualityStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  PASSED: {
    label: "ĐẠT (PASS)",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    icon: <CheckCircle2 size={13} className="text-emerald-600" />,
  },
  FAILED: {
    label: "CÓ LỖI (FAIL)",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <XCircle size={13} className="text-red-600" />,
  },
  BLOCKED: {
    label: "BỊ CHẶN",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: <AlertTriangle size={13} className="text-amber-600" />,
  },
  UNTESTED: {
    label: "CHƯA TEST",
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: <Clock size={13} className="text-slate-400" />,
  },
  NO_TESTS: {
    label: "CHƯA CÓ TEST",
    bg: "bg-rose-50 border border-rose-200",
    text: "text-rose-700",
    icon: <HelpCircle size={13} className="text-rose-500" />,
  },
};

export default function TraceabilityPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();
  const { sprints, fetchSprints } = useSprintStore();
  const {
    matrix,
    metrics,
    qaData,
    flakyTests,
    isLoading,
    fetchTraceabilityMatrix,
    unlinkTestCase,
    fetchQAMetrics,
    fetchFlakyTests,
  } = useTraceabilityStore();

  const [activeTab, setActiveTab] = useState<"matrix" | "qa-dashboard">("matrix");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal link test case
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [targetIssue, setTargetIssue] = useState<TraceabilityItem | null>(null);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    await Promise.all([
      getProjectById(projectId),
      fetchSprints(projectId),
      fetchTraceabilityMatrix(projectId, {
        sprintId: selectedSprintId,
        search: searchQuery,
      }),
      fetchQAMetrics(projectId),
      fetchFlakyTests(projectId),
    ]);
  }, [
    projectId,
    getProjectById,
    fetchSprints,
    fetchTraceabilityMatrix,
    fetchQAMetrics,
    fetchFlakyTests,
    selectedSprintId,
    searchQuery,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUnlink = async (issueId: string, testCaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!confirm("Bạn có chắc muốn hủy liên kết ca kiểm thử này khỏi User Story?")) return;

    try {
      await unlinkTestCase(projectId, issueId, testCaseId);
      toast.success("Đã hủy liên kết ca kiểm thử");
    } catch {
      toast.error("Không thể hủy liên kết");
    }
  };

  const handleOpenLinkModal = (issue: TraceabilityItem) => {
    setTargetIssue(issue);
    setShowLinkModal(true);
  };

  if (!projectId) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Project Subheader Navigation */}
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
            <span className="text-slate-700 font-semibold">Ma trận truy vết (Traceability)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <GitFork size={18} className="text-indigo-600" />
            <span>Ma trận truy vết 3 chiều & Báo cáo QA</span>
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
              <ClipboardList size={14} /> Kế hoạch & Chạy Test
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
              <GitFork size={14} /> Ma trận truy vết
            </button>
            <Link
              to={`/projects/${projectId}/automation`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Cpu size={14} /> CI/CD & API
            </Link>
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

      {/* Tab Switcher & Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "matrix"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GitFork size={15} />
            <span>Ma trận truy vết (Traceability Matrix)</span>
          </button>

          <button
            onClick={() => setActiveTab("qa-dashboard")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "qa-dashboard"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 size={15} />
            <span>Chỉ số QA & Phát hiện Flaky Tests</span>
            {flakyTests.length > 0 && (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-600 font-bold">
                {flakyTests.length} Flaky
              </span>
            )}
          </button>
        </div>

        {/* Filters (applicable on Matrix tab) */}
        {activeTab === "matrix" && (
          <div className="flex items-center gap-3">
            {/* Sprint Scope Selector */}
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="px-3 py-1.5 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Toàn bộ dự án (All Requirements)</option>
              <option value="backlog">Chỉ các việc trong Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  Sprint: {s.name} ({s.status === "ACTIVE" ? "Đang chạy" : s.status})
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm kiếm User Story / Task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "matrix" ? (
          /* TAB 1: TRACEABILITY MATRIX */
          <div className="space-y-5">
            {/* 4 Highlight Metric Cards */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Coverage Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                      Độ bao phủ Requirement
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FolderCheck size={16} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-[28px] font-extrabold ${
                          metrics.coveragePercentage >= 80
                            ? "text-emerald-600"
                            : metrics.coveragePercentage >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {metrics.coveragePercentage}%
                      </span>
                      <span className="text-[12px] text-slate-500">
                        ({metrics.coveredStories}/{metrics.totalStories} Stories)
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2 flex">
                      <div
                        style={{ width: `${metrics.coveragePercentage}%` }}
                        className={`h-full ${
                          metrics.coveragePercentage >= 80
                            ? "bg-emerald-500"
                            : metrics.coveragePercentage >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Passed Stories */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-emerald-800 uppercase tracking-wider">
                      Đạt chất lượng (Passed)
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[28px] font-extrabold text-emerald-600">
                      {metrics.passedStories}
                    </span>
                    <p className="text-[12px] text-emerald-700/80 mt-1">
                      Toàn bộ test case đạt & không có lỗi
                    </p>
                  </div>
                </div>

                {/* Failed Stories */}
                <div className="bg-white p-5 rounded-2xl border border-red-200 bg-red-50/20 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-red-800 uppercase tracking-wider">
                      Có lỗi phát sinh (Failed)
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                      <Bug size={16} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[28px] font-extrabold text-red-600">
                      {metrics.failedStories}
                    </span>
                    <p className="text-[12px] text-red-700/80 mt-1">
                      Ca test thất bại hoặc còn Bug chưa đóng
                    </p>
                  </div>
                </div>

                {/* Missing Tests */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-amber-800 uppercase tracking-wider">
                      Chưa có ca test bao phủ
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <ShieldAlert size={16} />
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[28px] font-extrabold text-amber-600">
                      {metrics.uncoveredStories}
                    </span>
                    <p className="text-[12px] text-amber-700/80 mt-1">
                      Cần bổ sung kịch bản kiểm thử
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Traceability Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                  <GitFork size={16} className="text-indigo-600" />
                  <span>Ma trận tương quan: Yêu cầu ↔ Ca kiểm thử ↔ Lỗi</span>
                </h3>
                <span className="text-[12px] text-slate-500">
                  Hiển thị {matrix.length} yêu cầu
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-72">Yêu cầu (User Story / Task)</th>
                      <th className="py-3 px-4 w-32">Bao phủ</th>
                      <th className="py-3 px-4">Ca kiểm thử liên kết (Test Cases)</th>
                      <th className="py-3 px-4 w-60">Lỗi phát sinh (Bugs)</th>
                      <th className="py-3 px-4 w-36 text-center">Chất lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {matrix.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Không tìm thấy yêu cầu / User Story nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      matrix.map((item) => {
                        const qBadge = QUALITY_BADGE[item.qualityStatus];
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            {/* Requirement Column */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {item.type}
                                  </span>
                                  {item.sprint && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {item.sprint.name}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-semibold text-slate-800 leading-snug">
                                  {item.title}
                                </h4>
                              </div>
                            </td>

                            {/* Coverage Status Column */}
                            <td className="py-4 px-4 align-top">
                              {item.coverageStatus === "COVERED" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 size={12} />
                                  <span>{item.testCasesCount} ca test</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                                  <AlertTriangle size={12} />
                                  <span>Chưa có test</span>
                                </span>
                              )}
                            </td>

                            {/* Linked Test Cases Column */}
                            <td className="py-4 px-4 align-top">
                              <div className="space-y-1.5">
                                {item.testCases.map((tc) => {
                                  return (
                                    <div
                                      key={tc.id}
                                      className="inline-flex items-center gap-1.5 mr-2 mb-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors text-[12px]"
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          tc.latestStatus === "PASSED"
                                            ? "bg-emerald-500"
                                            : tc.latestStatus === "FAILED"
                                            ? "bg-red-500"
                                            : tc.latestStatus === "BLOCKED"
                                            ? "bg-amber-500"
                                            : "bg-slate-300"
                                        }`}
                                        title={`Status: ${tc.latestStatus}`}
                                      />
                                      <span className="font-mono text-[11px] font-bold text-slate-700">
                                        {tc.key}
                                      </span>
                                      <span className="font-medium text-slate-800 truncate max-w-xs">
                                        {tc.title}
                                      </span>

                                      <button
                                        onClick={(e) => handleUnlink(item.id, tc.id, e)}
                                        className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors ml-1"
                                        title="Hủy liên kết"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}

                                <div>
                                  <button
                                    onClick={() => handleOpenLinkModal(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-dashed border-indigo-200"
                                  >
                                    <Plus size={12} />
                                    <span>Gắn ca kiểm thử</span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Linked Defects / Bugs Column */}
                            <td className="py-4 px-4 align-top">
                              {item.defects.length > 0 ? (
                                <div className="space-y-1.5">
                                  {item.defects.map((def) => (
                                    <div
                                      key={def.id}
                                      className="flex items-center justify-between gap-2 p-1.5 px-2 bg-red-50/80 border border-red-200 rounded-lg text-[11px]"
                                    >
                                      <span className="font-medium text-red-800 truncate flex items-center gap-1">
                                        <Bug size={12} className="text-red-600 shrink-0" />
                                        <span>{def.title}</span>
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                          def.status === "DONE"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-red-200 text-red-900"
                                        }`}
                                      >
                                        {def.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[12px] text-slate-400 italic">
                                  Không có lỗi
                                </span>
                              )}
                            </td>

                            {/* Quality Status Column */}
                            <td className="py-4 px-4 align-top text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${qBadge.bg} ${qBadge.text}`}
                              >
                                {qBadge.icon}
                                <span>{qBadge.label}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: QA DASHBOARD & FLAKY TESTS */
          <div className="space-y-6">
            {/* Flaky Tests Alert & Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-800">
                      Phát hiện ca kiểm thử bất ổn định (Flaky Tests)
                    </h3>
                    <p className="text-[12px] text-slate-500">
                      Thuật toán phân tích lịch sử các lần chạy để tìm các ca test có kết quả lật trạng thái (Pass ↔ Fail) liên tục.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[12px] font-bold">
                  {flakyTests.length} ca test Flaky
                </span>
              </div>

              {flakyTests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Sparkles size={28} className="text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-[14px] font-bold text-slate-700">
                    Không phát hiện ca test bất ổn định nào!
                  </h4>
                  <p className="text-[12px] text-slate-400 max-w-sm mx-auto mt-1">
                    Toàn bộ các ca kiểm thử trong dự án đều có tính nhất quán cao qua các đợt thực thi.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4">Mã test</th>
                        <th className="py-3 px-4">Tên ca kiểm thử</th>
                        <th className="py-3 px-4">Độ nghiêm trọng</th>
                        <th className="py-3 px-4">Số lần lật trạng thái</th>
                        <th className="py-3 px-4">Tỷ lệ Flaky</th>
                        <th className="py-3 px-4">Lịch sử kết quả (Trajectory)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {flakyTests.map((ft) => (
                        <tr key={ft.id} className="hover:bg-amber-50/30">
                          <td className="py-3.5 px-4 font-mono text-[12px] font-bold text-slate-700">
                            {ft.key}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {ft.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                ft.severity === "HIGH"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {ft.severity === "HIGH" ? "Mức độ cao" : "Mức độ vừa"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {ft.flips} lần đổi kết quả
                          </td>
                          <td className="py-3.5 px-4 font-bold text-red-600">
                            {ft.flipRate}%
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                              {ft.trajectory.map((step, idx) => (
                                <React.Fragment key={idx}>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      step.status === "PASSED"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                    title={`${step.runName} (${step.status})`}
                                  >
                                    {step.status}
                                  </span>
                                  {idx < ft.trajectory.length - 1 && (
                                    <span className="text-slate-300">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* QA Dashboard Summary Grid */}
            {qaData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Module / Folder Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FolderCheck size={16} className="text-indigo-600" />
                    <span>Phân bổ theo Module / Thư mục</span>
                  </h4>
                  <div className="space-y-2.5">
                    {qaData.folderBreakdown.map((f) => (
                      <div key={f.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-slate-700 font-medium">{f.name}</span>
                          <span className="text-slate-500 font-bold">{f.count} ca test</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${(f.count / (qaData.summary.totalCases || 1)) * 100}%`,
                            }}
                            className="bg-indigo-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-indigo-600" />
                    <span>Độ ưu tiên Test Case</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-[20px] font-extrabold text-red-600 block">
                        {qaData.priorityBreakdown.CRITICAL || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-red-800">Critical</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-[20px] font-extrabold text-amber-600 block">
                        {qaData.priorityBreakdown.HIGH || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800">High</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-[20px] font-extrabold text-blue-600 block">
                        {qaData.priorityBreakdown.MEDIUM || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-800">Medium</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[20px] font-extrabold text-slate-600 block">
                        {qaData.priorityBreakdown.LOW || 0}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-800">Low</span>
                    </div>
                  </div>
                </div>

                {/* Defects Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Bug size={16} className="text-indigo-600" />
                    <span>Hiệu quả xử lý Bug từ kiểm thử</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[13px]">
                      <span className="text-slate-600">Tổng Bug phát hiện từ Test</span>
                      <span className="font-bold text-slate-800">{qaData.summary.totalDefects}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl text-[13px]">
                      <span className="text-emerald-800">Bug đã được giải quyết (Done)</span>
                      <span className="font-bold text-emerald-700">{qaData.summary.resolvedDefects}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl text-[13px]">
                      <span className="text-red-800">Bug đang mở cần xử lý</span>
                      <span className="font-bold text-red-700">{qaData.summary.openDefects}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Link Test Case */}
      <LinkTestCaseModal
        projectId={projectId}
        issue={targetIssue}
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          loadAll();
        }}
      />
    </div>
  );
}
