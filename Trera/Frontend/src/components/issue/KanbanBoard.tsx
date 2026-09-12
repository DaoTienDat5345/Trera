import { useState, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bug, BookOpen, Zap, Layers, AlertCircle, ArrowUp, ArrowDown,
  Minus, CheckCircle2, Clock, Eye, Circle, GripVertical, MessageSquare, CalendarDays
} from "lucide-react";
import type { Issue, IssueStatus } from "../../store/issueStore";
import UserAvatar from "../common/UserAvatar";

// ---- Constants ----
export const COLUMNS: { id: IssueStatus; label: string }[] = [
  { id: "TODO", label: "Cần làm" },
  { id: "IN_PROGRESS", label: "Đang làm" },
  { id: "IN_REVIEW", label: "Đang review" },
  { id: "DONE", label: "Hoàn thành" },
];

const COLUMN_LABEL: Record<IssueStatus, string> = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang làm",
  IN_REVIEW: "Đang review",
  DONE: "Hoàn thành",
};

const COLUMN_COLORS: Record<IssueStatus, string> = {
  TODO: "border-slate-400",
  IN_PROGRESS: "border-indigo-500",
  IN_REVIEW: "border-amber-400",
  DONE: "border-emerald-500",
};
const COLUMN_BADGE: Record<IssueStatus, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  DONE: "bg-emerald-50 text-emerald-700",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  TASK: <CheckCircle2 size={13} className="text-indigo-500" />,
  BUG: <Bug size={13} className="text-red-500" />,
  STORY: <BookOpen size={13} className="text-emerald-500" />,
  EPIC: <Zap size={13} className="text-purple-500" />,
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  CRITICAL: <AlertCircle size={13} className="text-red-500" />,
  HIGH: <ArrowUp size={13} className="text-orange-500" />,
  MEDIUM: <Minus size={13} className="text-yellow-500" />,
  LOW: <ArrowDown size={13} className="text-sky-400" />,
};

const STATUS_ICON: Record<IssueStatus, React.ReactNode> = {
  TODO: <Circle size={14} className="text-slate-400" />,
  IN_PROGRESS: <Clock size={14} className="text-indigo-500" />,
  IN_REVIEW: <Eye size={14} className="text-amber-500" />,
  DONE: <CheckCircle2 size={14} className="text-emerald-500" />,
};

// ---- IssueCard (Sortable) ----
interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
  overlay?: boolean;
}

export function IssueCard({ issue, onClick, overlay }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: issue.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const dueDateStr = issue.dueDate
    ? new Date(issue.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    : null;
  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== "DONE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={[
        "group relative bg-white border border-slate-200 rounded-lg p-3 cursor-pointer",
        "hover:border-indigo-300 hover:shadow-sm transition-all duration-150",
        isDragging && !overlay ? "opacity-40 ring-2 ring-indigo-300" : "",
        overlay ? "shadow-xl ring-2 ring-indigo-400 rotate-1" : "",
      ].join(" ")}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-70 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} className="text-slate-400" />
      </div>

      <div className="pl-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          {TYPE_ICON[issue.type] ?? <Layers size={13} className="text-slate-400" />}
          <span className="text-[10px] font-mono text-slate-400">{issue.type}</span>
          <span className="ml-auto">{PRIORITY_ICON[issue.priority]}</span>
        </div>

        <p className="text-[13px] font-medium text-slate-800 leading-snug line-clamp-2 mb-2">{issue.title}</p>

        {issue.labels && issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {issue.labels.slice(0, 3).map((l, i) => (
              <span key={i} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded-full">{l.label}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <div className="flex -space-x-1 flex-1">
            {issue.assignees?.slice(0, 3).map((a) => (
              <UserAvatar key={a.user.id} name={a.user.name} size="xs" />
            ))}
          </div>
          {(issue._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <MessageSquare size={10} /> {issue._count!.comments}
            </span>
          )}
          {dueDateStr && (
            <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
              <CalendarDays size={10} /> {dueDateStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- KanbanColumn ----
interface KanbanColumnProps {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  onCardClick: (issue: Issue) => void;
  onAddClick: () => void;
}

function KanbanColumn({ status, label, issues, onCardClick, onAddClick }: KanbanColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: status });

  return (
    <div className={`flex flex-col min-h-[calc(100vh-220px)] w-72 shrink-0 rounded-xl border-t-2 ${COLUMN_COLORS[status]} bg-slate-50`}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
        {STATUS_ICON[status]}
        <span className="text-[13px] font-semibold text-slate-700">{label}</span>
        <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md ${COLUMN_BADGE[status]}`}>
          {issues.length}
        </span>
      </div>

      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          className={[
            "flex-1 flex flex-col gap-2 p-2 overflow-y-auto transition-colors duration-150",
            isOver ? "bg-indigo-50/60" : "",
          ].join(" ")}
        >
          {issues.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-[12px] text-slate-400 italic py-8">
              Không có công việc
            </div>
          )}
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onClick={() => onCardClick(issue)} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={onAddClick}
        className="mx-2 mb-2 py-1.5 text-[12px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-dashed border-slate-200 hover:border-indigo-300"
      >
        <span className="text-base leading-none">+</span> Thêm công việc
      </button>
    </div>
  );
}


// ---- KanbanBoard ----
interface KanbanBoardProps {
  projectId: string;
  issues: Issue[];
  onCardClick: (issue: Issue) => void;
  onAddClick: (status?: IssueStatus) => void;
  onReorder: (updates: { id: string; order: number; status: IssueStatus }[]) => void;
}

const COLUMN_IDS = new Set(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);

export function KanbanBoard({ issues, onCardClick, onAddClick, onReorder }: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues);
  const isDraggingRef = useRef(false); // dùng ref để tránh race condition với useEffect

  // Chỉ sync từ prop khi KHÔNG đang drag
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalIssues(issues);
    }
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const issuesByColumn = useMemo(() => {
    const map: Record<IssueStatus, Issue[]> = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
    [...localIssues].sort((a, b) => a.order - b.order).forEach((i) => {
      if (map[i.status]) map[i.status].push(i);
    });
    return map;
  }, [localIssues]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const issue = localIssues.find((i) => i.id === active.id);
    if (issue) {
      setActiveIssue(issue);
      isDraggingRef.current = true; // blokir sync dari props
    }
  };

  // DragOver: live preview khi keo qua cot moi
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const overIsColumn = COLUMN_IDS.has(overId);
    const targetStatus: IssueStatus | null = overIsColumn
      ? (overId as IssueStatus)
      : (localIssues.find((i) => i.id === overId)?.status ?? null);

    if (!targetStatus) return;

    setLocalIssues((prev) => {
      const activeStatus = prev.find((i) => i.id === activeId)?.status;
      if (activeStatus === targetStatus) return prev; // khong thay doi gi
      return prev.map((i) => (i.id === activeId ? { ...i, status: targetStatus } : i));
    });
  };

  // DragEnd: commit va gui backend
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const draggedIssue = activeIssue;
    setActiveIssue(null);

    if (!over || !draggedIssue) {
      isDraggingRef.current = false; // unlock sync
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    setLocalIssues((prev) => {
      const currentStatus = prev.find((i) => i.id === activeId)?.status;
      if (!currentStatus) return prev;

      const overIsColumn = COLUMN_IDS.has(overId);
      const finalStatus: IssueStatus = overIsColumn
        ? (overId as IssueStatus)
        : (prev.find((i) => i.id === overId)?.status ?? currentStatus);

      // Cap nhat status
      const updated = prev.map((i) =>
        i.id === activeId ? { ...i, status: finalStatus } : i
      );

      // Tinh lai order cho 2 cot bi anh huong
      const affectedCols = new Set<IssueStatus>([draggedIssue.status, finalStatus]);
      affectedCols.forEach((col) => {
        const colIssues = updated.filter((i) => i.status === col).sort((a, b) => a.order - b.order);
        colIssues.forEach((issue, idx) => {
          const pos = updated.findIndex((x) => x.id === issue.id);
          if (pos !== -1) updated[pos] = { ...updated[pos], order: idx + 1 };
        });
      });

      // Gui updates len backend
      const reorderUpdates = updated
        .filter((i) => affectedCols.has(i.status) || i.id === activeId)
        .map((i) => ({ id: i.id, order: i.order, status: i.status }));

      setTimeout(() => {
        onReorder(reorderUpdates);
        isDraggingRef.current = false; // unlock sau khi state đã commit
      }, 0);

      return updated;
    });
  };


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            status={col.id}
            label={col.label}
            issues={issuesByColumn[col.id]}
            onCardClick={onCardClick}
            onAddClick={() => onAddClick(col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIssue && <IssueCard issue={activeIssue} overlay />}
      </DragOverlay>
    </DndContext>
  );
}