import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { IssueStatus, IssueType, IssuePriority } from "../../store/issueStore";
import { useIssueStore } from "../../store/issueStore";
import type { Sprint } from "../../store/sprintStore";
import type { ProjectMember } from "../../store/projectStore";

interface CreateIssueModalProps {
  projectId: string;
  sprints: Sprint[];
  members: ProjectMember[];
  defaultStatus?: IssueStatus;
  defaultSprintId?: string | null;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateIssueModal({
  projectId,
  sprints,
  members,
  defaultStatus = "TODO",
  defaultSprintId,
  onClose,
  onCreated,
}: CreateIssueModalProps) {
  const { createIssue } = useIssueStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "MEDIUM" as IssuePriority,
    type: "TASK" as IssueType,
    sprintId: defaultSprintId ?? "",
    dueDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    setIsSubmitting(true);
    const result = await createIssue(projectId, {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      type: form.type,
      sprintId: form.sprintId || null,
      dueDate: form.dueDate || null,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Đã tạo công việc");
      onCreated?.();
      onClose();
    } else {
      toast.error(result.message ?? "Tạo công việc thất bại");
    }
  };

  const activeSprints = sprints.filter((s) => s.status !== "COMPLETED");

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-indigo-600" />
              <span className="font-semibold text-slate-800">Tạo công việc mới</span>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Tiêu đề *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Mô tả ngắn gọn công việc cần làm..."
                className="w-full text-[14px] border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-300"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Chi tiết công việc, yêu cầu, điều kiện hoàn thành..."
                rows={3}
                className="w-full text-[13px] border border-slate-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:border-indigo-400 text-slate-700 placeholder:text-slate-300"
              />
            </div>

            {/* Row 1: Type + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Loại</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as IssueType })}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 text-slate-700"
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="STORY">Story</option>
                  <option value="EPIC">Epic</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Mức ưu tiên</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as IssuePriority })}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 text-slate-700"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="CRITICAL">Khẩn cấp</option>
                </select>
              </div>
            </div>

            {/* Row 2: Status + Sprint */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as IssueStatus })}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 text-slate-700"
                >
                  <option value="TODO">Cần làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="IN_REVIEW">Đang review</option>
                  <option value="DONE">Hoàn thành</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Sprint</label>
                <select
                  value={form.sprintId}
                  onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 text-slate-700"
                >
                  <option value="">Backlog</option>
                  {activeSprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Hạn chót</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 text-slate-700"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-[13px] font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-[13px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Đang tạo..." : "Tạo công việc"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}