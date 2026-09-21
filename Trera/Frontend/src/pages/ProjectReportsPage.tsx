import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid, List, Users, BarChart3, ArrowLeft, RefreshCw, Printer,
  CheckCircle2, Clock, Layers, Bug, Zap, Sparkles, Filter, GitMerge,
  TrendingDown, AlertTriangle, UserCheck, Flame, FlaskConical, ClipboardList
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import UserAvatar from "../components/common/UserAvatar";
import { useProjectStore } from "../store/projectStore";
import { api } from "../lib/api";

interface Summary {
  total: number;
  completed: number;
  inProgress: number;
  inReview: number;
  todo: number;
  overdue: number;
  completionRate: number;
  unassignedCount: number;
}

interface DistributionItem {
  status?: string;
  priority?: string;
  type?: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface MemberWorkload {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  role: string;
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

interface BurndownData {
  days: string[];
  ideal: number[];
  actual: (number | null)[];
}

interface SprintItem {
  id: string;
  name: string;
  goal?: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  startDate?: string | null;
  endDate?: string | null;
}

interface AnalyticsData {
  summary: Summary;
  byStatus: DistributionItem[];
  byPriority: DistributionItem[];
  byType: DistributionItem[];
  memberWorkload: MemberWorkload[];
  burndown: BurndownData;
  selectedSprint: SprintItem | null;
  sprints: SprintItem[];
}

export default function ProjectReportsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("active");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    day: string;
    ideal: number;
    actual: number | null;
    x: number;
    y: number;
  } | null>(null);

  const fetchAnalytics = useCallback(async (sprintIdParam: string, showToast = false) => {
    if (!projectId) return;
    try {
      if (showToast) setIsRefreshing(true);
      const res = await api.get(`/projects/${projectId}/analytics?sprintId=${sprintIdParam}`);
      setData(res.data);
      if (showToast) toast.success("Đã cập nhật số liệu thống kê mới nhất.");
    } catch (err: any) {
      console.error("Lỗi tải báo cáo:", err);
      toast.error(err.response?.data?.message || "Không thể tải số liệu báo cáo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId);
      fetchAnalytics(selectedSprintId);
    }
  }, [projectId, getProjectById, fetchAnalytics, selectedSprintId]);

  const handleSprintChange = (newSprintId: string) => {
    setSelectedSprintId(newSprintId);
    setIsLoading(true);
    fetchAnalytics(newSprintId);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-slate-500 font-medium">Đang tổng hợp báo cáo dự án...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    inReview: 0,
    todo: 0,
    overdue: 0,
    completionRate: 0,
    unassignedCount: 0,
  };

  // Tính tọa độ cho biểu đồ Burndown SVG
  const burndown = data?.burndown || { days: [], ideal: [], actual: [] };
  const maxIssues = Math.max(1, summary.total, ...(burndown.ideal || []));
  const svgWidth = 740;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const pointsCount = burndown.days.length;
  const getX = (idx: number) => {
    if (pointsCount <= 1) return padding.left + chartW / 2;
    return padding.left + (idx / (pointsCount - 1)) * chartW;
  };
  const getY = (val: number) => {
    return padding.top + chartH - (val / maxIssues) * chartH;
  };

  // Tạo path SVG cho Ideal Line
  const idealPath = burndown.ideal.length > 0
    ? burndown.ideal.reduce((acc, val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
      }, "")
    : "";

  // Tạo path SVG cho Actual Line (chỉ vẽ tới những ngày có dữ liệu)
  const actualPoints: { x: number; y: number; idx: number }[] = [];
  burndown.actual.forEach((val, idx) => {
    if (val !== null && val !== undefined) {
      actualPoints.push({ x: getX(idx), y: getY(val), idx });
    }
  });
  const actualPath = actualPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  // Tọa độ vòng tròn đo % hoàn thành (Circular Gauge)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (summary.completionRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Header & Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 print:border-none print:px-0">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2 print:hidden">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600 truncate max-w-[200px]">
              {currentProject?.name}
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Báo cáo & Thống kê</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-indigo-600" />
              </div>
              <div>
                <h1 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Báo cáo & Thống kê tiến độ
                  {data?.selectedSprint && (
                    <span className="text-[12px] font-medium font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {data.selectedSprint.name}
                    </span>
                  )}
                </h1>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Theo dõi biểu đồ Burndown, tỷ lệ hoàn thành Sprint và năng suất nhóm
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 print:hidden">
              <Link
                to={`/projects/${projectId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <LayoutGrid size={14} /> Bảng
              </Link>
              <Link
                to={`/projects/${projectId}/sprints`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <List size={14} /> Backlog
              </Link>
              <Link
                to={`/projects/${projectId}/repository`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <FlaskConical size={14} /> Kho Test Case
              </Link>
              <Link
                to={`/projects/${projectId}/test-plans`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <ClipboardList size={14} /> Kế hoạch Test
              </Link>
              <Link
                to={`/projects/${projectId}/members`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <Users size={14} /> Thành viên
              </Link>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-white text-indigo-600 shadow-xs rounded-lg font-semibold border border-slate-200/50"
              >
                <BarChart3 size={14} /> Báo cáo
              </button>
              <Link
                to={`/projects/${projectId}/activity`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium"
              >
                <GitMerge size={14} /> Lịch sử
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar Bar */}
      <div className="bg-slate-100/60 border-b border-slate-200/80 px-6 py-2.5 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Sprint selector */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-600">Phạm vi thống kê:</span>
            <select
              value={selectedSprintId}
              onChange={(e) => handleSprintChange(e.target.value)}
              className="text-[13px] font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="active">Sprint đang chạy (Active Sprint)</option>
              <option value="all">Toàn bộ dự án (All Issues)</option>
              {data?.sprints && data.sprints.length > 0 && (
                <optgroup label="Tất cả Sprint">
                  {data.sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status === "ACTIVE" ? "Đang chạy" : s.status === "COMPLETED" ? "Đã xong" : "Kế hoạch"})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {data?.selectedSprint?.goal && (
              <span className="hidden lg:inline text-[12px] text-slate-500 italic max-w-sm truncate ml-2">
                Mục tiêu: "{data.selectedSprint.goal}"
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalytics(selectedSprintId, true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-[12px] font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              title="Làm mới số liệu"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin text-indigo-600" : "text-slate-400"} />
              <span>{isRefreshing ? "Đang cập nhật..." : "Làm mới"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-[12px] font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="In báo cáo"
            >
              <Printer size={13} className="text-slate-400" />
              <span>In báo cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

          {/* ─── ROW 1: 4 KPI SUMMARY CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Completion Rate Meter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-slate-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-indigo-600 transition-all duration-700 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[18px] font-extrabold font-mono text-slate-800 leading-none">
                    {summary.completionRate}%
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Tiến độ</p>
                <p className="text-[14px] font-bold text-slate-800 truncate mt-0.5">Tỷ lệ hoàn thành</p>
                <p className="text-[12px] text-slate-500 font-mono mt-1">
                  <span className="font-semibold text-emerald-600">{summary.completed}</span> / {summary.total} công việc
                </p>
              </div>
            </div>

            {/* Card 2: Total Issues */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Khối lượng</p>
                <p className="text-[28px] font-extrabold font-mono text-slate-900 leading-none mt-1.5">
                  {summary.total}
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  {summary.unassignedCount > 0 ? (
                    <span className="text-amber-600 font-medium">Chưa gán: {summary.unassignedCount} việc</span>
                  ) : (
                    <span className="text-slate-400">100% đã được phân công</span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Layers size={22} className="text-slate-500" />
              </div>
            </div>

            {/* Card 3: Active Work (In Progress + Review) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Đang xử lý</p>
                <p className="text-[28px] font-extrabold font-mono text-indigo-600 leading-none mt-1.5">
                  {summary.inProgress + summary.inReview}
                </p>
                <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>Làm: <strong className="text-slate-700 font-mono">{summary.inProgress}</strong></span>
                  <span>•</span>
                  <span>Review: <strong className="text-slate-700 font-mono">{summary.inReview}</strong></span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Clock size={22} />
              </div>
            </div>

            {/* Card 4: Overdue & Need Attention */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Cần chú ý</p>
                <p className={`text-[28px] font-extrabold font-mono leading-none mt-1.5 ${summary.overdue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {summary.overdue}
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  {summary.overdue > 0 ? (
                    <span className="text-rose-600 font-medium">Công việc bị quá hạn</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Không có task trễ hạn</span>
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${summary.overdue > 0 ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                <AlertTriangle size={22} />
              </div>
            </div>

          </div>

          {/* ─── ROW 2: SPRINT BURNDOWN CHART (SVG) ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" />
                  <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">
                    Biểu đồ Sprint Burndown Chart
                  </h2>
                </div>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Đường lý tưởng (nét đứt) so với lượng công việc thực tế còn lại qua từng ngày
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-[12px] font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" />
                  <span className="text-slate-500">Lý tưởng (Ideal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-indigo-700 font-semibold">Thực tế (Actual)</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div className="relative w-full overflow-x-auto">
              <div className="min-w-[640px]">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  {/* Grid Lines & Y-axis labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + chartH * (1 - ratio);
                    const val = Math.round(maxIssues * ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={svgWidth - padding.right}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-[10px] font-mono fill-slate-400"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis days labels */}
                  {burndown.days.map((day, idx) => {
                    const step = Math.ceil(pointsCount / 14);
                    if (idx % step !== 0 && idx !== pointsCount - 1) return null;
                    const x = getX(idx);
                    return (
                      <g key={idx}>
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={padding.top + chartH}
                          stroke="#f8fafc"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={padding.top + chartH + 20}
                          textAnchor="middle"
                          className="text-[11px] font-mono fill-slate-400"
                        >
                          {day}
                        </text>
                      </g>
                    );
                  })}

                  {/* Ideal Line (Dashed Slate-400) */}
                  {idealPath && (
                    <path
                      d={idealPath}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}

                  {/* Actual Area Gradient & Line */}
                  {actualPath && (
                    <>
                      <path
                        d={actualPath}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Actual Data Points */}
                      {actualPoints.map((pt) => {
                        const day = burndown.days[pt.idx];
                        const idealVal = burndown.ideal[pt.idx];
                        const actualVal = burndown.actual[pt.idx]!;
                        const isHovered = hoveredPoint?.index === pt.idx;
                        return (
                          <g
                            key={pt.idx}
                            onMouseEnter={() =>
                              setHoveredPoint({
                                index: pt.idx,
                                day,
                                ideal: idealVal,
                                actual: actualVal,
                                x: pt.x,
                                y: pt.y,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 6 : 4}
                              className="fill-white stroke-indigo-600 transition-all"
                              strokeWidth="2.5"
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-xl shadow-xl px-3.5 py-2 text-[12px] transition-all -translate-x-1/2 -translate-y-full mb-3"
                    style={{
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                    }}
                  >
                    <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 font-mono">
                      Ngày: {hoveredPoint.day}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-indigo-300">
                      <span>Còn lại thực tế:</span>
                      <strong className="font-mono text-white text-[13px]">{hoveredPoint.actual} task</strong>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-400 mt-0.5">
                      <span>Mục tiêu lý tưởng:</span>
                      <span className="font-mono">{hoveredPoint.ideal} task</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Burndown Insight Note */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-500" />
                <span>
                  {summary.completionRate >= 80
                    ? "🎉 Tiến độ rất tốt! Nhóm đang hoàn thành các công việc theo đúng cam kết."
                    : summary.completionRate >= 50
                    ? "⚡ Tiến độ ổn định. Cần duy trì nhịp độ để kịp thời hạn Sprint."
                    : "⚠️ Khối lượng công việc còn lại khá nhiều. Hãy rà soát lại các task bị nghẽn."}
                </span>
              </div>
              <span className="font-mono text-slate-400">
                Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* ─── ROW 3: DISTRIBUTION BREAKDOWNS (Status, Priority, Type) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Status Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Phân bố theo Trạng thái
                </h3>
                <p className="text-[12px] text-slate-400 mb-4">Tiến độ luân chuyển công việc</p>

                {/* Stacked Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-4">
                  {data?.byStatus.map((st) => (
                    <div
                      key={st.status}
                      style={{ width: `${st.percentage}%`, backgroundColor: st.color }}
                      title={`${st.label}: ${st.count} (${st.percentage}%)`}
                      className="h-full transition-all duration-500"
                    />
                  ))}
                </div>

                {/* List items */}
                <div className="space-y-2.5">
                  {data?.byStatus.map((st) => (
                    <div key={st.status} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                        <span className="text-slate-700 font-medium">{st.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">{st.count}</span>
                        <span className="text-slate-400 text-[11px]">({st.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Priority Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  Phân bố theo Độ ưu tiên
                </h3>
                <p className="text-[12px] text-slate-400 mb-4">Mức độ cấp bách của các nhiệm vụ</p>

                <div className="space-y-3">
                  {data?.byPriority.map((pr) => (
                    <div key={pr.priority} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pr.color }} />
                          {pr.label}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {pr.count} <span className="text-slate-400 text-[11px] font-normal">({pr.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pr.percentage}%`, backgroundColor: pr.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Type Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-500" />
                  Phân bố theo Loại việc
                </h3>
                <p className="text-[12px] text-slate-400 mb-4">Cơ cấu công việc thực tế</p>

                <div className="grid grid-cols-2 gap-2.5">
                  {data?.byType.map((tp) => (
                    <div
                      key={tp.type}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {tp.type === "BUG" ? (
                          <Bug size={16} className="text-rose-500" />
                        ) : tp.type === "FEATURE" ? (
                          <Zap size={16} className="text-emerald-500" />
                        ) : tp.type === "IMPROVEMENT" ? (
                          <Sparkles size={16} className="text-purple-500" />
                        ) : (
                          <CheckCircle2 size={16} className="text-indigo-500" />
                        )}
                        <span className="text-[11px] font-mono font-medium text-slate-400">
                          {tp.percentage}%
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 truncate">{tp.label}</p>
                        <p className="text-[18px] font-extrabold font-mono text-slate-800 mt-0.5">
                          {tp.count}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ─── ROW 4: TEAM WORKLOAD & CONTRIBUTION TABLE ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" />
                <h3 className="text-[15px] font-bold text-slate-800">
                  Khối lượng công việc theo Thành viên ({data?.memberWorkload.length || 0})
                </h3>
              </div>
              <span className="text-[12px] text-slate-400">
                Theo dõi tiến độ hoàn thành và tỷ lệ phân bổ việc trong nhóm
              </span>
            </div>

            {data?.memberWorkload && data.memberWorkload.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-[13px] italic">
                Chưa có dữ liệu thành viên trong dự án này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-6 font-semibold">Thành viên</th>
                      <th className="py-3 px-4 font-semibold text-center">Vai trò</th>
                      <th className="py-3 px-4 font-semibold text-center">Tổng việc</th>
                      <th className="py-3 px-4 font-semibold text-center">Đang làm</th>
                      <th className="py-3 px-4 font-semibold text-center">Hoàn thành</th>
                      <th className="py-3 px-6 font-semibold">Tiến độ cá nhân</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data?.memberWorkload.map((m) => (
                      <tr key={m.user.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              name={m.user.name}
                              avatar={m.user.avatar}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{m.user.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.role === "OWNER"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : m.role === "ADMIN"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {m.role === "OWNER" ? "Chủ dự án" : m.role === "ADMIN" ? "Quản trị" : "Thành viên"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {m.total}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-indigo-600">
                          {m.inProgress}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-600">
                          {m.completed}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${m.completionRate}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-mono font-bold text-slate-700 w-10 text-right">
                              {m.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
