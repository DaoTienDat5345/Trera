import React, { useState, useRef } from "react";
import { Paperclip, UploadCloud, Trash2, Download, ExternalLink, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Attachment } from "../../store/issueStore";
import { useIssueStore } from "../../store/issueStore";

interface AttachmentSectionProps {
  issueId: string;
  attachments: Attachment[];
  onPreviewImage: (att: Attachment) => void;
}

export default function AttachmentSection({ issueId, attachments = [], onPreviewImage }: AttachmentSectionProps) {
  const { uploadAttachment, deleteAttachment } = useIssueStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFullUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";
    return `${base}${url}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await uploadAttachment(issueId, file);
      if (!res.success) {
        toast.error(`Lỗi tải lên "${file.name}": ${res.message}`);
      }
    }

    setIsUploading(false);
    toast.success("Đã tải lên tệp đính kèm!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá tệp đính kèm "${name}"?`)) return;
    const res = await deleteAttachment(id);
    if (res.success) {
      toast.success("Đã xoá tệp đính kèm");
    } else {
      toast.error(res.message ?? "Xoá tệp thất bại");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUploadFiles(e.target.files);
          e.target.value = "";
        }}
        accept="image/*,.pdf,.doc,.docx,.zip,.txt"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip size={14} className="text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tệp đính kèm ({attachments.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1"
        >
          {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          <span>Tải tệp lên</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          {isUploading ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <UploadCloud size={18} />}
        </div>
        <p className="text-[12px] text-slate-500 text-center">
          <span className="font-semibold text-indigo-600">Bấm để chọn tệp</span> hoặc kéo thả vào đây
        </p>
        <p className="text-[11px] text-slate-400 text-center">
          Mẹo: Có thể chụp ảnh màn hình và bấm <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh ngay lập tức
        </p>
      </div>

      {/* Attachments Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-1">
          {attachments.map((att) => {
            const isImg = att.mimeType.startsWith("image/");
            const fileUrl = getFullUrl(att.url);

            return (
              <div
                key={att.id}
                className="group relative flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                {/* Thumbnail / Icon preview */}
                {isImg ? (
                  <div
                    onClick={() => onPreviewImage(att)}
                    className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={fileUrl}
                      alt={att.originalName}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ImageIcon size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-50 flex flex-col items-center justify-center gap-1 p-2">
                    <FileText size={28} className="text-indigo-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {att.mimeType.split("/")[1] || "FILE"}
                    </span>
                  </div>
                )}

                {/* Info & actions footer */}
                <div className="p-2 flex items-center justify-between gap-1 bg-white border-t border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-700 truncate" title={att.originalName}>
                      {att.originalName}
                    </p>
                    <span className="text-[10px] text-slate-400">{formatSize(att.size)}</span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={fileUrl}
                      download={att.originalName}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Tải về"
                    >
                      <Download size={13} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id, att.originalName)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Xoá tệp"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
