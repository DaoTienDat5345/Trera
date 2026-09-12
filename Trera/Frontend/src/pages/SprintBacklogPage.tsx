import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { LayoutGrid, List, Users, Plus, Play, CheckSquare, Trash2, Edit2, ChevronDown, ChevronRight, ArrowLeft, GitMerge, Circle, Clock, Eye, CheckCircle2, Bug, BookOpen, Zap, AlertCircle, ArrowUp, ArrowDown, Minus, Layers } from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import CreateIssueModal from "../components/issue/CreateIssueModal";
import IssueDetailModal from "../components/issue/IssueDetailModal";

import { useProjectStore } from "../store/projectStore";
import { useSprintStore } from "../store/sprintStore";
import type { Sprint } from "../store/sprintStore";
import { useIssueStore } from "../store/issueStore";
import type { Issue, IssueStatus } from "../store/issueStore";

const STATUS_STYLE: Record<IssueStatus, string> = {
  TODO: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<IssueStatus, string> = {
  TODO: "Cần làm", IN_PROGRESS: "Đang làm", IN_REVIEW: "Đang review", DONE: "Hoàn thành",
};
const STATUS_ICON: Record<IssueStatus, JSX.Element> = {
  TODO: <Circle size={13} className="text-slate-400" />,
  IN_PROGRESS: <Clock size={13} className="text-indigo-500" />,
  IN_REVIEW: <Eye size={13} className="text-amber-500" />,
  DONE: <CheckCircle2 size={13} className="text-emerald-500" />,
};
const PRIORITY_ICON: Record<string, JSX.Element> = {
  CRITICAL: <AlertCircle size={12} className="text-red-500" />,
  HIGH: <ArrowUp size={12} className="text-orange-500" />,
  MEDIUM: <Minus size={12} className="text-yellow-500" />,
  LOW: <ArrowDown size={12} className="text-sky-400" />,
};
const TYPE_ICON: Record<string, JSX.Element> = {
  TASK: <CheckCircle2 size={12} className="text-indigo-400" />,
  BUG: <Bug size={12} className="text-red-400" />,
  STORY: <BookOpen size={12} className="text-emerald-400" />,
  EPIC: <Zap size={12} className="text-purple-400" />,
};

// ---- IssueRow ----
function IssueRow({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 group transition-colors"
    >
      {STATUS_ICON[issue.status]}
      {TYPE_ICON[issue.type] ?? <Layers size={12} className="text-slate-400" />}
      <span className="flex-1 text-[13px] text-slate-700 group-hover:text-indigo-600 truncate">{issue.title}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${STATUS_STYLE[issue.status]}`}>
        {STATUS_LABEL[issue.status]}
      </span>
      {PRIORITY_ICON[issue.priority]}
      {issue.dueDate && (
        <span className="text-[11px] text-slate-400 font-mono">
          {new Date(issue.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
        </span>
      )}
    </div>
  );
}

// ---- SprintCard ----
interface SprintCardProps {
  sprint: Sprint;
  issues: Issue[];
  projectId: string;
  sprints: Sprint[];
  members: any[];
  onStart: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onIssueClick: (issue: Issue) => void;
  onAddIssue: (sprintId: string) => void;
}

function SprintCard({ sprint, issues, sprints, members, projectId, onStart, onComplete, onDelete, onIssueClick, onAddIssue }: SprintCardProps) {
  const [expanded, setExpanded] = useState(true);
  const done = issues.filter((i) => i.status === "DONE").length;
  const total = issues.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const STATUS_BADGE: Record<string, string> = {
    PLANNING: "bg-slate-100 text-slate-600",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-slate-100 text-slate-400",
  };
  const STATUS_LABEL_MAP: Record<string, string> = { PLANNING: "Lên kế hoạch", ACTIVE: "Đang chạy", COMPLETED: "Đã kết thúc" };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Sprint header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <button onClick={() => setExpanded((v) => !v)} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <GitMerge size={15} className="text-indigo-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-slate-800 truncate">{sprint.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[sprint.status]}`}>
              {STATUS_LABEL_MAP[sprint.status]}
            </span>
          </div>
          {sprint.goal && <p className="text-[12px] text-slate-500 truncate mt-0.5">{sprint.goal}</p>}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-slate-400 w-14 text-right">{done}/{total} xong</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {sprint.status === "PLANNING" && (
            <>
              <button onClick={onStart} className="text-[12px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                <Play size={11} /> Bắt đầu
              </button>
              <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={13} />
              </button>
            </>
          )}
          {sprint.status === "ACTIVE" && (
            <button onClick={onComplete} className="text-[12px] bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1">
              <CheckSquare size={11} /> Kết thúc
            </button>
          )}
        </div>
      </div>

      {/* Issues */}
      {expanded && (
        <>
          {issues.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-slate-400 italic">Không có công việc nào</div>
          ) : (
            <div>{issues.map((i) => <IssueRow key={i.id} issue={i} onClick={() => onIssueClick(i)} />)}</div>
          )}
          {sprint.status !== "COMPLETED" && (
            <button
              onClick={() => onAddIssue(sprint.id)}
              className="w-full py-2.5 text-[12px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-100"
            >
              <Plus size={12} /> Thêm công việc vào sprint này
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function SprintBacklogPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();
  const { sprints, fetchSprints, startSprint, completeSprint, deleteSprint, createSprint } = useSprintStore();
  const { issues, fetchIssues } = useIssueStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultSprintId, setCreateDefaultSprintId] = useState<string | null>(null);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [backlogExpanded, setBacklogExpanded] = useState(true);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    await Promise.all([getProjectById(projectId), fetchSprints(projectId)]);
    await fetchIssues(projectId, {});
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getIssuesForSprint = (sprintId: string) => issues.filter((i) => i.sprintId === sprintId);
  const backlogIssues = issues.filter((i) => i.sprintId === null);

  const handleStart = async (sprintId: string) => {
    if (!projectId) return;
    const r = await startSprint(projectId, sprintId);
    if (r.success) toast.success("Sprint đã bắt đầu!");
    else toast.error(r.message ?? "Lỗi");
  };

  const handleComplete = async (sprintId: string) => {
    if (!projectId) return;
    if (!confirm("Hoàn thành sprint? Các công việc chưa xong sẽ về Backlog.")) return;
    const r = await completeSprint(projectId, sprintId);
    if (r.success) { toast.success("Sprint hoàn thành!"); await loadAll(); }
    else toast.error(r.message ?? "Lỗi");
  };

  const handleDelete = async (sprintId: string) => {
    if (!projectId) return;
    if (!confirm("Xoá sprint này?")) return;
    const r = await deleteSprint(projectId, sprintId);
    if (r.success) toast.success("Đã xoá sprint");
    else toast.error(r.message ?? "Lỗi");
  };

  const handleCreateSprint = async () => {
    if (!newSprintName.trim() || !projectId) return;
    const r = await createSprint(projectId, { name: newSprintName.trim() });
    if (r.success) { toast.success("Đã tạo sprint"); setNewSprintName(""); setShowCreateSprint(false); }
    else toast.error(r.message ?? "Lỗi");
  };

  const handleAddIssue = (sprintId: string | null) => {
    setCreateDefaultSprintId(sprintId);
    setShowCreateModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50"><Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1"><ArrowLeft size={11} /> Dự án</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600">{currentProject?.name}</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Backlog & Sprint</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-bold text-slate-800">Backlog & Sprint</h1>
            <nav className="flex items-center gap-1 ml-4">
              <Link to={`/projects/${projectId}`} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                <LayoutGrid size={14} /> Bảng
              </Link>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                <List size={14} /> Backlog
              </button>
              <Link to={`/projects/${projectId}/members`} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                <Users size={14} /> Thành viên
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {!showCreateSprint && (
                <button onClick={() => setShowCreateSprint(true)} className="flex items-center gap-1.5 text-[13px] border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <Plus size={14} /> Tạo sprint
                </button>
              )}
              {showCreateSprint && (
                <div className="flex items-center gap-2">
                  <input value={newSprintName} onChange={(e) => setNewSprintName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleCreateSprint(); if (e.key === "Escape") setShowCreateSprint(false); }} placeholder="Tên sprint..." autoFocus className="text-[13px] border border-indigo-300 rounded-lg px-2.5 py-1.5 focus:outline-none w-36" />
                  <button onClick={handleCreateSprint} className="text-[12px] bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700">Tạo</button>
                  <button onClick={() => setShowCreateSprint(false)} className="text-[12px] text-slate-400 px-2 py-1.5">Huỷ</button>
                </div>
              )}
              <button onClick={() => handleAddIssue(null)} className="flex items-center gap-1.5 text-[13px] bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors font-semibold">
                <Plus size={14} /> Tạo công việc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {/* Active sprint first, then planning, then completed */}
          {[...sprints].sort((a, b) => {
            const order = { ACTIVE: 0, PLANNING: 1, COMPLETED: 2 };
            return order[a.status] - order[b.status];
          }).map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              issues={getIssuesForSprint(sprint.id)}
              sprints={sprints}
              members={currentProject?.members ?? []}
              projectId={projectId!}
              onStart={() => handleStart(sprint.id)}
              onComplete={() => handleComplete(sprint.id)}
              onDelete={() => handleDelete(sprint.id)}
              onIssueClick={setSelectedIssue}
              onAddIssue={() => handleAddIssue(sprint.id)}
            />
          ))}

          {/* Backlog section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <button onClick={() => setBacklogExpanded((v) => !v)} className="text-slate-400 hover:text-slate-600">
                {backlogExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <span className="text-[14px] font-semibold text-slate-700">Backlog</span>
              <span className="text-[11px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">{backlogIssues.length}</span>
            </div>
            {backlogExpanded && (
              <>
                {backlogIssues.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-slate-400 italic">Backlog trống — tất cả công việc đã vào sprint!</div>
                ) : (
                  <div>{backlogIssues.map((i) => <IssueRow key={i.id} issue={i} onClick={() => setSelectedIssue(i)} />)}</div>
                )}
                <button onClick={() => handleAddIssue(null)} className="w-full py-2.5 text-[12px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 border-t border-slate-100">
                  <Plus size={12} /> Thêm công việc vào Backlog
                </button>
              </>
            )}
          </div>

          {sprints.length === 0 && backlogIssues.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 mx-auto">
                <GitMerge size={24} className="text-slate-300" />
              </div>
              <p className="text-[15px] font-semibold text-slate-500 mb-1">Chưa có gì ở đây</p>
              <p className="text-[13px] text-slate-400 mb-5">Tạo sprint đầu tiên và thêm công việc để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailModal issue={selectedIssue} sprints={sprints} members={currentProject?.members ?? []} onClose={() => setSelectedIssue(null)} onDelete={() => setSelectedIssue(null)} />
      )}
      {showCreateModal && (
        <CreateIssueModal projectId={projectId!} sprints={sprints} members={currentProject?.members ?? []} defaultSprintId={createDefaultSprintId} onClose={() => setShowCreateModal(false)} onCreated={loadAll} />
      )}
    </div>
  );
}