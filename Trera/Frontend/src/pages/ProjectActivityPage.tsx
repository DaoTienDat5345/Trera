import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid,
  List,
  Users,
  BarChart3,
  GitMerge,
  ArrowLeft,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Rocket,
  AlertCircle,
  FolderGit2,
  Layers,
  ChevronDown,
  FlaskConical,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar";
import UserAvatar from "../components/common/UserAvatar";
import { useProjectStore } from "../store/projectStore";
import { api } from "../lib/api";

interface ActivityItem {
  id: string;
  action: string;
  metadata: any;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  issue?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
  } | null;
}

const ACTION_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả hoạt động" },
  { value: "created_issue", label: "Tạo công việc" },
  { value: "changed_status", label: "Đổi trạng thái" },
  { value: "updated_issue", label: "Chỉnh sửa công việc" },
  { value: "assigned", label: "Giao việc" },
  { value: "commented", label: "Bình luận" },
  { value: "started_sprint", label: "Bắt đầu Sprint" },
  { value: "completed_sprint", label: "Hoàn thành Sprint" },
];

const formatTimelineDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Hôm nay";
  if (isYesterday) return "Hôm qua";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getActivityBadge = (action: string) => {
  switch (action) {
    case "created_issue":
      return {
        icon: <Layers size={14} className="text-emerald-600" />,
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        label: "Tạo task",
      };
    case "changed_status":
      return {
        icon: <RefreshCw size={13} className="text-blue-600" />,
        bg: "bg-blue-50 border-blue-200 text-blue-700",
        label: "Đổi trạng thái",
      };
    case "updated_issue":
      return {
        icon: <CheckCircle2 size={13} className="text-amber-600" />,
        bg: "bg-amber-50 border-amber-200 text-amber-700",
        label: "Cập nhật",
      };
    case "assigned":
      return {
        icon: <Users size={13} className="text-indigo-600" />,
        bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
        label: "Giao việc",
      };
    case "commented":
      return {
        icon: <MessageSquare size={13} className="text-purple-600" />,
        bg: "bg-purple-50 border-purple-200 text-purple-700",
        label: "Bình luận",
      };
    case "started_sprint":
    case "completed_sprint":
    case "created_sprint":
      return {
        icon: <Rocket size={13} className="text-rose-600" />,
        bg: "bg-rose-50 border-rose-200 text-rose-700",
        label: "Sprint",
      };
    default:
      return {
        icon: <FolderGit2 size={13} className="text-slate-600" />,
        bg: "bg-slate-50 border-slate-200 text-slate-700",
        label: "Hoạt động",
      };
  }
};

const renderActivityNarrative = (activity: ActivityItem) => {
  const { action, metadata, issue, actor } = activity;
  const actorName = <strong className="font-semibold text-slate-800">{actor?.name || "Một thành viên"}</strong>;

  switch (action) {
    case "created_issue":
      return (
        <span>
          {actorName} đã tạo công việc{" "}
          <span className="font-medium text-indigo-600">"{metadata?.title || issue?.title || "Không tên"}"</span>
        </span>
      );
    case "changed_status":
      return (
        <span>
          {actorName} đã chuyển trạng thái của{" "}
          <span className="font-medium text-slate-800">"{metadata?.title || issue?.title}"</span> từ{" "}
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
            {metadata?.from || "Cũ"}
          </span>{" "}
          ➔{" "}
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[11px] font-semibold">
            {metadata?.to || "Mới"}
          </span>
        </span>
      );
    case "updated_issue":
      return (
        <span>
          {actorName} đã cập nhật chi tiết công việc{" "}
          <span className="font-medium text-slate-800">"{issue?.title || metadata?.title}"</span>
        </span>
      );
    case "commented":
      return (
        <div>
          <span>
            {actorName} đã bình luận trên{" "}
            <span className="font-medium text-slate-800">"{metadata?.issueTitle || issue?.title}"</span>:
          </span>
          {metadata?.preview && (
            <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
              "{metadata.preview}"
            </p>
          )}
        </div>
      );
    case "started_sprint":
      return (
        <span>
          {actorName} đã bắt đầu Sprint{" "}
          <span className="font-semibold text-indigo-700">"{metadata?.sprintName}"</span>
        </span>
      );
    case "completed_sprint":
      return (
        <span>
          {actorName} đã hoàn thành Sprint{" "}
          <span className="font-semibold text-emerald-700">"{metadata?.sprintName}"</span>
          {metadata?.movedIssuesToBacklog > 0 && (
            <span className="text-slate-500"> (chuyển {metadata.movedIssuesToBacklog} task chưa xong về Backlog)</span>
          )}
        </span>
      );
    case "created_sprint":
      return (
        <span>
          {actorName} đã tạo Sprint mới{" "}
          <span className="font-semibold text-slate-800">"{metadata?.sprintName}"</span>
        </span>
      );
    default:
      return (
        <span>
          {actorName} đã thực hiện hành động <span className="font-mono text-xs">{action}</span>
        </span>
      );
  }
};

export const ProjectActivityPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { currentProject, getProjectById } = useProjectStore();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = useCallback(
    async (page = 1, type = selectedType, append = false) => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const res = await api.get(`/projects/${projectId}/activities`, {
          params: { page, limit: 25, type },
        });

        const data = res.data;
        if (append) {
          setActivities((prev) => [...prev, ...(data.activities || [])]);
        } else {
          setActivities(data.activities || []);
        }
        setCurrentPage(data.currentPage || page);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch (error: any) {
        console.error("Lỗi lấy hoạt động:", error);
        toast.error(error.response?.data?.message || "Không thể tải lịch sử hoạt động.");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, selectedType]
  );

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId);
      fetchActivities(1, selectedType, false);
    }
  }, [projectId, getProjectById, selectedType, fetchActivities]);

  // Gom nhóm hoạt động theo ngày
  const groupedActivities = activities.reduce((acc, curr) => {
    const groupKey = formatTimelineDate(curr.createdAt);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(curr);
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Project Header with 5 tabs */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">{currentProject?.name || "Dự án"}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Key Badge */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                {currentProject?.key || "TRE"}
              </span>
              <h1 className="text-[18px] font-bold text-slate-800">
                {currentProject?.name || "Đang tải..."}
              </h1>
            </div>

            {/* 5-Nav Tabs: Bảng | Backlog | Thành viên | Báo cáo | Lịch sử */}
            <nav className="flex items-center gap-1 ml-4">
              <Link
                to={`/projects/${projectId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LayoutGrid size={14} /> Bảng
              </Link>
              <Link
                to={`/projects/${projectId}/sprints`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <List size={14} /> Backlog
              </Link>
              <Link
                to={`/projects/${projectId}/repository`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <FlaskConical size={14} /> Kho Test Case
              </Link>
              <Link
                to={`/projects/${projectId}/test-plans`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <ClipboardList size={14} /> Kế hoạch Test
              </Link>
              <Link
                to={`/projects/${projectId}/members`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Users size={14} /> Thành viên
              </Link>
              <Link
                to={`/projects/${projectId}/reports`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <BarChart3 size={14} /> Báo cáo
              </Link>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-medium shadow-2xs"
              >
                <GitMerge size={14} /> Lịch sử
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Controls Bar: Filter & Refresh */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Filter size={14} />
              <span>Lọc theo sự kiện:</span>
            </div>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
              >
                {ACTION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Tổng cộng <strong>{totalCount}</strong> hoạt động được ghi lại
            </span>
            <button
              onClick={() => fetchActivities(1, selectedType, false)}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Timeline View */}
        {isLoading && activities.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-600" />
            <p className="text-sm font-medium">Đang tải dòng thời gian hoạt động...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 px-6 text-center shadow-xs">
            <GitMerge size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">Chưa có lịch sử hoạt động</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Khi bạn hoặc đồng đội tạo công việc, thay đổi trạng thái thẻ Kanban, bình luận hay bắt đầu
              Sprint, toàn bộ sẽ được ghi lại chi tiết tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([dateGroup, items]) => (
              <div key={dateGroup} className="space-y-3">
                {/* Date header badge */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-200/70 px-3 py-1 rounded-full">
                    {dateGroup}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Timeline items for this date */}
                <div className="relative pl-6 sm:pl-8 space-y-3 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {items.map((act) => {
                    const badge = getActivityBadge(act.action);
                    return (
                      <div
                        key={act.id}
                        className="relative flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        {/* Node circle on the timeline */}
                        <div className="absolute -left-6 sm:-left-8 top-4 size-4 rounded-full bg-white border-2 border-indigo-500 ring-4 ring-slate-50" />

                        {/* Actor Avatar */}
                        <div className="shrink-0 mt-0.5">
                          <UserAvatar
                            name={act.actor?.name}
                            avatar={act.actor?.avatar}
                            size="md"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg}`}
                            >
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatTime(act.createdAt)}
                            </span>
                          </div>

                          <div className="text-sm text-slate-700 leading-relaxed">
                            {renderActivityNarrative(act)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="pt-4 pb-8 text-center">
                <button
                  onClick={() => fetchActivities(currentPage + 1, selectedType, true)}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  {isLoading ? "Đang tải thêm..." : "Tải thêm hoạt động cũ hơn"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectActivityPage;
