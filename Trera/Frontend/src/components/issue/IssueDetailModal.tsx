import { useState, useEffect } from "react";
import { X, Edit2, Trash2, Send, Clock, AlertCircle, ArrowUp, ArrowDown, Minus, Bug, BookOpen, Zap, CheckCircle2, Layers, CalendarDays, User2, Tag, GitMerge, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { Issue, IssueStatus, IssuePriority, IssueType, Comment } from "../../store/issueStore";
import { useIssueStore } from "../../store/issueStore";
import type { Sprint } from "../../store/sprintStore";
import { useAuthStore } from "../../store/authStore";
import type { ProjectMember } from "../../store/projectStore";
import UserAvatar from "../common/UserAvatar";

// ---- helpers ----
const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "IN_REVIEW", label: "Đang review" },
  { value: "DONE", label: "Hoàn thành" },
];
const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: "CRITICAL", label: "Khẩn cấp" },
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];
const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "STORY", label: "Story" },
  { value: "EPIC", label: "Epic" },
];

const STATUS_STYLE: Record<IssueStatus, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};
const PRIORITY_ICON: Record<IssuePriority, JSX.Element> = {
  CRITICAL: <AlertCircle size={14} className="text-red-500" />,
  HIGH: <ArrowUp size={14} className="text-orange-500" />,
  MEDIUM: <Minus size={14} className="text-yellow-500" />,
  LOW: <ArrowDown size={14} className="text-sky-400" />,
};
const TYPE_ICON: Record<IssueType, JSX.Element> = {
  TASK: <CheckCircle2 size={14} className="text-indigo-500" />,
  BUG: <Bug size={14} className="text-red-500" />,
  STORY: <BookOpen size={14} className="text-emerald-500" />,
  EPIC: <Zap size={14} className="text-purple-500" />,
};

// ---- Select helper ----
function FieldSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ---- CommentItem ----
function CommentItem({ comment, canEdit, canDelete, onUpdate, onDelete }: {
  comment: Comment; canEdit: boolean; canDelete: boolean;
  onUpdate: (id: string, content: string) => void; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const save = () => {
    if (!editText.trim()) return;
    onUpdate(comment.id, editText.trim());
    setEditing(false);
  };

  return (
    <div className="flex gap-2.5 group">
      <UserAvatar name={comment.author.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-semibold text-slate-700">{comment.author.name}</span>
          <span className="text-[11px] text-slate-400">
            {new Date(comment.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </span>
          {comment.createdAt !== comment.updatedAt && (
            <span className="text-[10px] text-slate-300 italic">(đã sửa)</span>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-indigo-400"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={save} className="text-[12px] bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Lưu</button>
              <button onClick={() => { setEditing(false); setEditText(comment.content); }} className="text-[12px] text-slate-500 hover:text-slate-700">Huỷ</button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        )}
        <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="text-[11px] text-slate-400 hover:text-indigo-500 flex items-center gap-1">
              <Edit2 size={11} /> Sửa
            </button>
          )}
          {canDelete && !editing && (
            <button onClick={() => onDelete(comment.id)} className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1">
              <Trash2 size={11} /> Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- IssueDetailModal ----
interface IssueDetailModalProps {
  issue: Issue;
  sprints: Sprint[];
  members: ProjectMember[];
  onClose: () => void;
  onDelete?: (issueId: string) => void;
}

export default function IssueDetailModal({ issue: initialIssue, sprints, members, onClose, onDelete }: IssueDetailModalProps) {
  const { user } = useAuthStore();
  const { updateIssue, deleteIssue, addComment, updateComment, deleteComment, fetchIssueById } = useIssueStore();

  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load full issue with comments on open
  useEffect(() => {
    (async () => {
      setIsLoadingFull(true);
      const full = await fetchIssueById(initialIssue.id);
      if (full) { setIssue(full); setTitle(full.title); setDescription(full.description ?? ""); }
      setIsLoadingFull(false);
    })();
  }, [initialIssue.id]);

  const handleFieldUpdate = async (field: string, value: unknown) => {
    const prev = issue;
    setIssue((s) => ({ ...s, [field]: value }));
    const result = await updateIssue(issue.id, { [field]: value });
    if (!result.success) {
      setIssue(prev);
      toast.error(result.message ?? "Cập nhật thất bại");
    }
  };

  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (!title.trim() || title === issue.title) return;
    await handleFieldUpdate("title", title);
  };

  const handleDescSave = async () => {
    setEditingDesc(false);
    if (description === (issue.description ?? "")) return;
    await handleFieldUpdate("description", description || null);
  };

  const handleDelete = async () => {
    if (!confirm("Xoá công việc này? Hành động không thể hoàn tác.")) return;
    const result = await deleteIssue(issue.id);
    if (result.success) {
      toast.success("Đã xoá công việc");
      onDelete?.(issue.id);
      onClose();
    } else {
      toast.error(result.message ?? "Xoá thất bại");
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const result = await addComment(issue.id, commentText.trim());
    setSubmittingComment(false);
    if (result.success) {
      setCommentText("");
      const full = await fetchIssueById(issue.id);
      if (full) setIssue(full);
    } else {
      toast.error(result.message ?? "Gửi bình luận thất bại");
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    const result = await updateComment(commentId, content);
    if (!result.success) toast.error(result.message ?? "Chỉnh sửa thất bại");
    else {
      const full = await fetchIssueById(issue.id);
      if (full) setIssue(full);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Xoá bình luận này?")) return;
    const result = await deleteComment(commentId);
    if (!result.success) toast.error(result.message ?? "Xoá bình luận thất bại");
    else {
      const full = await fetchIssueById(issue.id);
      if (full) setIssue(full);
    }
  };

  const activeSprints = sprints.filter((s) => s.status !== "COMPLETED");

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {TYPE_ICON[issue.type]}
            <span className="text-[11px] font-mono text-slate-400 tracking-wider">{issue.type}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Xoá công việc"
            >
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {/* Title */}
            <div>
              {editingTitle ? (
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTitleSave(); } if (e.key === "Escape") { setEditingTitle(false); setTitle(issue.title); } }}
                  autoFocus
                  rows={2}
                  className="w-full text-xl font-bold text-slate-800 bg-transparent border-b-2 border-indigo-400 outline-none resize-none leading-snug"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-bold text-slate-800 leading-snug cursor-text hover:bg-slate-50 rounded-md px-1 -mx-1 transition-colors"
                  title="Click để chỉnh sửa"
                >
                  {issue.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                <Layers size={11} /> Mô tả
              </label>
              {editingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    autoFocus
                    className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-indigo-400 text-slate-700"
                    placeholder="Thêm mô tả cho công việc này..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleDescSave} className="text-[12px] bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Lưu</button>
                    <button onClick={() => { setEditingDesc(false); setDescription(issue.description ?? ""); }} className="text-[12px] text-slate-500 hover:text-slate-700">Huỷ</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="min-h-[60px] text-[14px] text-slate-600 cursor-text hover:bg-slate-50 rounded-xl px-4 py-3 -mx-4 transition-colors"
                >
                  {description ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{description}</p>
                  ) : (
                    <span className="text-slate-300 italic">Thêm mô tả...</span>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                <MessageSquare size={11} /> Bình luận ({issue.comments?.length ?? 0})
              </label>

              {isLoadingFull ? (
                <div className="text-[13px] text-slate-400 py-4 text-center">Đang tải...</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {(issue.comments ?? []).map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      canEdit={c.author.id === user?.id}
                      canDelete={c.author.id === user?.id}
                      onUpdate={handleUpdateComment}
                      onDelete={handleDeleteComment}
                    />
                  ))}

                  {/* New comment */}
                  <div className="flex gap-2.5">
                    <UserAvatar name={user?.name ?? "?"} size="sm" />
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Viết bình luận..."
                        rows={2}
                        className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 text-slate-700 placeholder:text-slate-300"
                        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSendComment(); }}
                      />
                      {commentText.trim() && (
                        <button
                          onClick={handleSendComment}
                          disabled={submittingComment}
                          className="self-end flex items-center gap-1.5 text-[12px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                        >
                          <Send size={12} /> {submittingComment ? "Đang gửi..." : "Gửi"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — metadata sidebar */}
          <div className="w-60 shrink-0 border-l border-slate-100 px-4 py-5 flex flex-col gap-4 overflow-y-auto bg-slate-50/60">
            {/* Status */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Trạng thái</label>
              <select
                value={issue.status}
                onChange={(e) => handleFieldUpdate("status", e.target.value)}
                className={`w-full text-[13px] font-semibold px-2.5 py-1.5 rounded-lg border-0 outline-none cursor-pointer ${STATUS_STYLE[issue.status]}`}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Mức độ ưu tiên</label>
              <div className="flex items-center gap-1.5">
                {PRIORITY_ICON[issue.priority]}
                <select
                  value={issue.priority}
                  onChange={(e) => handleFieldUpdate("priority", e.target.value)}
                  className="flex-1 text-[13px] bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Loại</label>
              <div className="flex items-center gap-1.5">
                {TYPE_ICON[issue.type]}
                <select
                  value={issue.type}
                  onChange={(e) => handleFieldUpdate("type", e.target.value)}
                  className="flex-1 text-[13px] bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
                >
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Sprint */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <GitMerge size={11} /> Sprint
              </label>
              <select
                value={issue.sprintId ?? ""}
                onChange={(e) => handleFieldUpdate("sprintId", e.target.value || null)}
                className="w-full text-[13px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
              >
                <option value="">Backlog</option>
                {activeSprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Assignees */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <User2 size={11} /> Người thực hiện
              </label>
              {issue.assignees && issue.assignees.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {issue.assignees.map((a) => (
                    <div key={a.user.id} className="flex items-center gap-2">
                      <UserAvatar name={a.user.name} size="xs" />
                      <span className="text-[12px] text-slate-600">{a.user.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-slate-300 italic">Chưa giao</span>
              )}
            </div>

            {/* Due date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                <CalendarDays size={11} /> Hạn chót
              </label>
              <input
                type="date"
                value={issue.dueDate ? issue.dueDate.slice(0, 10) : ""}
                onChange={(e) => handleFieldUpdate("dueDate", e.target.value || null)}
                className="w-full text-[13px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Reporter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Người tạo</label>
              {issue.reporter && (
                <div className="flex items-center gap-2">
                  <UserAvatar name={issue.reporter.name} size="xs" />
                  <span className="text-[12px] text-slate-600">{issue.reporter.name}</span>
                </div>
              )}
            </div>

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <Tag size={11} /> Nhãn
                </label>
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((l, i) => (
                    <span key={i} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded-full">{l.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="border-t border-slate-200 pt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Tạo lúc</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(issue.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {issue.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Hoàn thành</span>
                  <span className="text-[11px] text-emerald-600 font-mono">
                    {new Date(issue.completedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}