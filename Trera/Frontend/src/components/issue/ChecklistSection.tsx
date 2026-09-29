import React, { useState, useRef } from "react";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChecklistItem, Attachment } from "../../store/issueStore";
import { useIssueStore } from "../../store/issueStore";

interface ChecklistSectionProps {
  issueId: string;
  items: ChecklistItem[];
  attachments: Attachment[];
  onPreviewImage: (att: Attachment) => void;
}

export default function ChecklistSection({ issueId, items = [], attachments = [], onPreviewImage }: ChecklistSectionProps) {
  const { addChecklistItem, updateChecklistItem, deleteChecklistItem, uploadAttachment } = useIssueStore();
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeItemIdRef = useRef<string | null>(null);

  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    const result = await addChecklistItem(issueId, newTitle.trim());
    setSubmitting(false);
    if (result.success) {
      setNewTitle("");
      setIsAdding(false);
      toast.success("Đã thêm việc con");
    } else {
      toast.error(result.message ?? "Thêm việc con thất bại");
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    const nextCompleted = !item.isCompleted;
    const result = await updateChecklistItem(item.id, { isCompleted: nextCompleted });
    if (!result.success) {
      toast.error(result.message ?? "Cập nhật thất bại");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteChecklistItem(id);
    if (result.success) {
      toast.success("Đã xoá việc con");
    } else {
      toast.error(result.message ?? "Xoá thất bại");
    }
  };

  const triggerUploadForItem = (itemId: string) => {
    activeItemIdRef.current = itemId;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = activeItemIdRef.current;
    if (!file || !itemId) return;

    setUploadingItemId(itemId);
    const result = await uploadAttachment(issueId, file, itemId);
    setUploadingItemId(null);
    activeItemIdRef.current = null;

    if (result.success) {
      toast.success("Đã đính kèm tệp vào việc con!");
    } else {
      toast.error(result.message ?? "Tải lên thất bại");
    }
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";
    return `${base}${url}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden file input for item-specific attachments */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.zip,.txt"
      />

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Việc con / Checklist
          </span>
          {total > 0 && (
            <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              {completed}/{total}
            </span>
          )}
        </div>
        {total > 0 && (
          <span className="text-[12px] font-semibold text-slate-500">
            {percent}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percent === 100 ? "bg-emerald-500" : "bg-indigo-600"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      <div className="flex flex-col gap-1.5 mt-1">
        {items.map((item) => {
          const itemAttachments = attachments.filter((a) => a.checklistItemId === item.id);
          const isItemUploading = uploadingItemId === item.id;

          return (
            <div
              key={item.id}
              className="group flex flex-col p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                >
                  {item.isCompleted ? (
                    <CheckSquare size={16} className="text-emerald-600 fill-emerald-50" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>

                <span
                  onClick={() => handleToggle(item)}
                  className={`flex-1 text-[13px] cursor-pointer select-none leading-snug transition-all ${
                    item.isCompleted ? "line-through text-slate-400" : "text-slate-700 font-medium"
                  }`}
                >
                  {item.title}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => triggerUploadForItem(item.id)}
                    disabled={isItemUploading}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Đính kèm ảnh/file vào việc con này"
                  >
                    {isItemUploading ? (
                      <Loader2 size={13} className="animate-spin text-indigo-600" />
                    ) : (
                      <Paperclip size={13} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Xoá việc con"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Attachments for this item */}
              {itemAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 ml-6">
                  {itemAttachments.map((att) => {
                    const isImg = att.mimeType.startsWith("image/");
                    return isImg ? (
                      <div
                        key={att.id}
                        onClick={() => onPreviewImage(att)}
                        className="relative w-12 h-12 rounded-md overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-400 group/img transition-all"
                        title={att.originalName}
                      >
                        <img
                          src={getFullUrl(att.url)}
                          alt={att.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <a
                        key={att.id}
                        href={getFullUrl(att.url)}
                        target="_blank"
                        rel="noreferrer"
                        download={att.originalName}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                      >
                        <Paperclip size={11} />
                        <span className="truncate max-w-[100px]">{att.originalName}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new item */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nhập tên việc con và nhấn Enter..."
            autoFocus
            className="flex-1 text-[13px] bg-white border border-indigo-400 rounded-lg px-3 py-1.5 outline-none text-slate-700 shadow-sm"
          />
          <button
            type="submit"
            disabled={submitting || !newTitle.trim()}
            className="px-3 py-1.5 text-[12px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {submitting ? "Đang thêm..." : "Thêm"}
          </button>
          <button
            type="button"
            onClick={() => { setIsAdding(false); setNewTitle(""); }}
            className="px-2.5 py-1.5 text-[12px] text-slate-500 hover:text-slate-700"
          >
            Huỷ
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-indigo-600 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors w-fit mt-1"
        >
          <Plus size={14} />
          <span>Thêm mục việc con</span>
        </button>
      )}
    </div>
  );
}
