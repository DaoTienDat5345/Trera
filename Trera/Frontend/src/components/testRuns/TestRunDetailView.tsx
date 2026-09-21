import React, { useState } from "react";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Clock,
  Search,
  Filter,
  Bug,
  Monitor,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Check,
} from "lucide-react";
import { useTestRunStore } from "../../store/testRunStore";
import type { TestRun, ExecutionStatus } from "../../store/testRunStore";
import { toast } from "sonner";

interface TestRunDetailViewProps {
  projectId: string;
  run: TestRun;
  onBack: () => void;
  onEditRun: (run: TestRun) => void;
  onLaunchRunner: (caseId?: string) => void;
}

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  PASSED: {
    label: "PASS",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    icon: <CheckCircle2 size={13} className="text-emerald-600" />,
  },
  FAILED: {
    label: "FAIL",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <XCircle size={13} className="text-red-600" />,
  },
  BLOCKED: {
    label: "BLOCKED",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: <AlertTriangle size={13} className="text-amber-600" />,
  },
  SKIPPED: {
    label: "SKIPPED",
    bg: "bg-purple-100",
    text: "text-purple-800",
    icon: <MinusCircle size={13} className="text-purple-600" />,
  },
  UNTESTED: {
    label: "CHƯA TEST",
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: <Clock size={13} className="text-slate-400" />,
  },
};

export default function TestRunDetailView({
  projectId,
  run,
  onBack,
  onEditRun,
  onLaunchRunner,
}: TestRunDetailViewProps) {
  const { updateTestRun, executeTestCase } = useTestRunStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const results = run.results || [];
  const metrics = run.metrics || {
    total: results.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: results.length,
    completed: 0,
    passPercentage: 0,
    failPercentage: 0,
    blockedPercentage: 0,
    completionPercentage: 0,
  };

  const handleCompleteRun = async () => {
    if (!confirm("Bạn có chắc muốn hoàn thành đợt thực thi này?")) return;
    try {
      await updateTestRun(projectId, run.id, { status: "COMPLETED" });
      toast.success("Đợt thực thi đã được đánh dấu hoàn thành");
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleQuickStatus = async (
    caseId: string,
    status: ExecutionStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await executeTestCase(projectId, run.id, caseId, { status });
      toast.success(`Đã cập nhật trạng thái: ${status}`);
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.testCase.title.toLowerCase().includes(search.toLowerCase()) ||
      r.testCase.key.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  run.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {run.status === "COMPLETED" ? "ĐÃ HOÀN THÀNH" : "ĐANG THỰC THI"}
              </span>

              {run.environment && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Monitor size={12} className="text-indigo-600" />
                  {run.environment.name}
                </span>
              )}

              {run.plan && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Layers size={12} className="text-indigo-600" />
                  {run.plan.name}
                </span>
              )}
            </div>
            <h1 className="text-[20px] font-bold text-slate-800">{run.name}</h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {run.status !== "COMPLETED" && (
            <button
              onClick={handleCompleteRun}
              className="px-3.5 py-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Hoàn thành Đợt chạy
            </button>
          )}

          <button
            onClick={() => onEditRun(run)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Chỉnh sửa thông tin"
          >
            <Edit2 size={16} />
          </button>

          {/* Launch Runner Button */}
          <button
            onClick={() => onLaunchRunner()}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all group"
          >
            <Play size={15} className="group-hover:scale-110 transition-transform" />
            <span>Khởi chạy Runner Toàn màn hình</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Row */}
      <div className="p-6 pb-2 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Tổng ca kiểm thử
          </span>
          <span className="text-[22px] font-bold text-slate-800">
            {metrics.total}
          </span>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.completionPercentage}% đã thực thi
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Đạt (Pass)
          </span>
          <span className="text-[22px] font-bold text-emerald-600">
            {metrics.passed}
          </span>
          <div className="text-[11px] text-emerald-600/80 mt-1">
            Tỷ lệ đạt: {metrics.passPercentage}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block mb-1">
            Lỗi (Fail)
          </span>
          <span className="text-[22px] font-bold text-red-600">
            {metrics.failed}
          </span>
          <div className="text-[11px] text-red-600/80 mt-1">
            {metrics.failPercentage}% thất bại
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Bị chặn (Blocked)
          </span>
          <span className="text-[22px] font-bold text-amber-600">
            {metrics.blocked}
          </span>
          <div className="text-[11px] text-amber-600/80 mt-1">
            {metrics.blockedPercentage}% bị chặn
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Chưa kiểm thử
          </span>
          <span className="text-[22px] font-bold text-slate-600">
            {metrics.untested}
          </span>
          <div className="text-[11px] text-slate-400 mt-1">Đang chờ thực thi</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-2 shrink-0">
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(metrics.passed / metrics.total) * 100}%` }}
            className="bg-emerald-500 h-full"
            title={`Passed: ${metrics.passed}`}
          />
          <div
            style={{ width: `${(metrics.failed / metrics.total) * 100}%` }}
            className="bg-red-500 h-full"
            title={`Failed: ${metrics.failed}`}
          />
          <div
            style={{ width: `${(metrics.blocked / metrics.total) * 100}%` }}
            className="bg-amber-500 h-full"
            title={`Blocked: ${metrics.blocked}`}
          />
          <div
            style={{ width: `${(metrics.skipped / metrics.total) * 100}%` }}
            className="bg-purple-500 h-full"
            title={`Skipped: ${metrics.skipped}`}
          />
        </div>
      </div>

      {/* Test Cases Table & Filters */}
      <div className="flex-1 flex flex-col p-6 pt-3 overflow-hidden">
        <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xs">
          {/* Table Header Filter Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tìm kiếm ca test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="UNTESTED">Chưa test</option>
                <option value="PASSED">Pass</option>
                <option value="FAILED">Fail</option>
                <option value="BLOCKED">Blocked</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4 w-28">Mã test</th>
                  <th className="py-3 px-4">Tên ca kiểm thử</th>
                  <th className="py-3 px-4 w-32">Độ ưu tiên</th>
                  <th className="py-3 px-4 w-36">Kết quả</th>
                  <th className="py-3 px-4 w-28">Thời gian</th>
                  <th className="py-3 px-4 w-36">Báo cáo Bug</th>
                  <th className="py-3 px-4 w-24 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không tìm thấy ca kiểm thử nào.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => {
                    const cfg = STATUS_CONFIG[r.status];
                    const tc = r.testCase;
                    const hasDefects = r.defects && r.defects.length > 0;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => onLaunchRunner(r.testCaseId)}
                        className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono text-[12px] font-bold text-slate-600">
                          {tc.key}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {tc.title}
                          </div>
                          {r.actualResult && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              <em>Ghi chú: {r.actualResult}</em>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {tc.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[12px] font-mono">
                          {r.elapsedSeconds ? `${r.elapsedSeconds}s` : "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          {hasDefects ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              <Bug size={12} />
                              {r.defects.length} Bug
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[12px]">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchRunner(r.testCaseId);
                            }}
                            className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            Chạy →
                          </button>
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
    </div>
  );
}
