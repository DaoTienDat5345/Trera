import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  LayoutGrid, List, GitMerge, Users, Settings, Search, Filter,
  ChevronDown, Plus, RefreshCw, ArrowLeft, Play, CheckSquare
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import { KanbanBoard } from "../components/issue/KanbanBoard";
import IssueDetailModal from "../components/issue/IssueDetailModal";
import CreateIssueModal from "../components/issue/CreateIssueModal";

import { useProjectStore } from "../store/projectStore";
import { useSprintStore } from "../store/sprintStore";
import { useIssueStore } from "../store/issueStore";
import type { Issue, IssueStatus, IssuePriority, IssueType } from "../store/issueStore";

export default function ProjectBoardPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getProjectById, currentProject } = useProjectStore();
  const { sprints, fetchSprints, createSprint, startSprint, completeSprint } = useSprintStore();
  const { issues, fetchIssues, reorderIssues } = useIssueStore();

  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<IssueStatus>("TODO");
  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState<IssuePriority | "">("");
  const [filterType, setFilterType] = useState<IssueType | "">("");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");

  // Load project + sprints + issues
  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingPage(true);
    await Promise.all([
      getProjectById(projectId),
      fetchSprints(projectId),
    ]);
    await fetchIssues(projectId, {});
    setIsLoadingPage(false);
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Filter issues for board
  const displayedIssues = issues.filter((i) => {
    if (selectedSprintId === "backlog" && i.sprintId !== null) return false;
    if (selectedSprintId !== "all" && selectedSprintId !== "backlog" && i.sprintId !== selectedSprintId) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    if (filterType && i.type !== filterType) return false;
    if (searchText && !i.title.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const planningSprints = sprints.filter((s) => s.status === "PLANNING");

  const handleReorder = async (updates: { id: string; order: number; status: IssueStatus }[]) => {
    if (!projectId) return;
    await reorderIssues(projectId, updates);
  };

  const handleCreateSprint = async () => {
    if (!newSprintName.trim() || !projectId) return;
    const result = await createSprint(projectId, { name: newSprintName.trim() });
    if (result.success) {
      toast.success(`Đã tạo sprint "${newSprintName}"`);
      setNewSprintName("");
      setShowCreateSprint(false);
    } else {
      toast.error(result.message ?? "Tạo sprint thất bại");
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    if (!projectId) return;
    const result = await startSprint(projectId, sprintId);
    if (result.success) toast.success("Sprint đã bắt đầu!");
    else toast.error(result.message ?? "Không thể bắt đầu sprint");
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint || !projectId) return;
    if (!confirm(`Hoàn thành sprint "${activeSprint.name}"? Các công việc chưa xong sẽ chuyển về Backlog.`)) return;
    const result = await completeSprint(projectId, activeSprint.id);
    if (result.success) {
      toast.success("Sprint đã hoàn thành!");
      await loadAll();
    } else {
      toast.error(result.message ?? "Không thể hoàn thành sprint");
    }
  };

  const handleCardClick = (issue: Issue) => setSelectedIssue(issue);

  const handleAddClick = (status: IssueStatus = "TODO") => {
    setCreateDefaultStatus(status);
    setShowCreateModal(true);
  };

  if (isLoadingPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] text-slate-500">Đang tải bảng công việc...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Không tìm thấy dự án</p>
            <button onClick={() => navigate("/projects")} className="text-indigo-600 hover:underline text-[14px]">
              ← Quay lại danh sách dự án
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Project header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">{currentProject.name}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Project key badge */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                {currentProject.key}
              </span>
              <h1 className="text-[18px] font-bold text-slate-800">{currentProject.name}</h1>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1 ml-4">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                <LayoutGrid size={14} /> Bảng
              </button>
              <Link
                to={`/projects/${projectId}/sprints`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <List size={14} /> Backlog
              </Link>
              <Link
                to={`/projects/${projectId}/members`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Users size={14} /> Thành viên
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* Active sprint info */}
              {activeSprint && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[12px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Play size={10} className="fill-current" />
                    {activeSprint.name}
                  </span>
                  <button
                    onClick={handleCompleteSprint}
                    className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                    title="Hoàn thành sprint"
                  >
                    <CheckSquare size={12} /> Kết thúc sprint
                  </button>
                </div>
              )}

              {/* Start sprint button (if planning sprints exist) */}
              {!activeSprint && planningSprints.length > 0 && (
                <button
                  onClick={() => handleStartSprint(planningSprints[0].id)}
                  className="flex items-center gap-1.5 text-[13px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Play size={13} /> Bắt đầu "{planningSprints[0].name}"
                </button>
              )}

              {/* Refresh */}
              <button onClick={loadAll} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Làm mới">
                <RefreshCw size={15} />
              </button>

              {/* Create issue */}
              <button
                onClick={() => handleAddClick()}
                className="flex items-center gap-1.5 text-[13px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                <Plus size={14} /> Tạo công việc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3 flex-wrap">
          {/* Sprint selector */}
          <div className="flex items-center gap-2">
            <GitMerge size={14} className="text-slate-400" />
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
            >
              <option value="all">Tất cả</option>
              <option value="backlog">Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === "ACTIVE" ? "▶" : s.status === "COMPLETED" ? "✓" : "○"}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-700 placeholder:text-slate-300 w-52"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as IssuePriority | "")}
              className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">Ưu tiên</option>
              <option value="CRITICAL">Khẩn cấp</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as IssueType | "")}
            className="text-[13px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">Loại</option>
            <option value="TASK">Task</option>
            <option value="BUG">Bug</option>
            <option value="STORY">Story</option>
            <option value="EPIC">Epic</option>
          </select>

          {/* Clear filters */}
          {(filterPriority || filterType || searchText || selectedSprintId !== "all") && (
            <button
              onClick={() => { setFilterPriority(""); setFilterType(""); setSearchText(""); setSelectedSprintId("all"); }}
              className="text-[12px] text-slate-400 hover:text-red-500 underline"
            >
              Xoá bộ lọc
            </button>
          )}

          {/* Sprint management (right side) */}
          <div className="ml-auto flex items-center gap-2">
            {!showCreateSprint && (
              <button
                onClick={() => setShowCreateSprint(true)}
                className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-indigo-300"
              >
                <Plus size={12} /> Tạo sprint
              </button>
            )}
            {showCreateSprint && (
              <div className="flex items-center gap-2">
                <input
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateSprint(); if (e.key === "Escape") setShowCreateSprint(false); }}
                  placeholder="Tên sprint..."
                  autoFocus
                  className="text-[13px] border border-indigo-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 w-40"
                />
                <button onClick={handleCreateSprint} className="text-[12px] bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700">Tạo</button>
                <button onClick={() => setShowCreateSprint(false)} className="text-[12px] text-slate-400 hover:text-slate-600 px-2 py-1.5">Huỷ</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Board content */}
      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="max-w-[1600px] mx-auto">
          {displayedIssues.length === 0 && !isLoadingPage ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <LayoutGrid size={24} className="text-slate-300" />
              </div>
              <p className="text-[15px] font-semibold text-slate-500 mb-1">Bảng trống</p>
              <p className="text-[13px] text-slate-400 mb-5">
                {searchText || filterPriority || filterType ? "Không có công việc nào phù hợp với bộ lọc." : "Hãy tạo công việc đầu tiên cho dự án này."}
              </p>
              {!searchText && !filterPriority && !filterType && (
                <button
                  onClick={() => handleAddClick()}
                  className="flex items-center gap-2 bg-indigo-600 text-white text-[13px] px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
                >
                  <Plus size={15} /> Tạo công việc đầu tiên
                </button>
              )}
            </div>
          ) : (
            <KanbanBoard
              projectId={projectId!}
              issues={displayedIssues}
              onCardClick={handleCardClick}
              onAddClick={handleAddClick}
              onReorder={handleReorder}
            />
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          sprints={sprints}
          members={currentProject.members ?? []}
          onClose={() => setSelectedIssue(null)}
          onDelete={() => setSelectedIssue(null)}
        />
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          projectId={projectId!}
          sprints={sprints}
          members={currentProject.members ?? []}
          defaultStatus={createDefaultStatus}
          defaultSprintId={activeSprint?.id ?? null}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}