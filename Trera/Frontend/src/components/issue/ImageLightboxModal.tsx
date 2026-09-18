import { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import type { Attachment } from "../../store/issueStore";

interface ImageLightboxModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export default function ImageLightboxModal({ attachment, onClose }: ImageLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const getFullUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";
    return `${base}${url}`;
  };

  const fileUrl = getFullUrl(attachment.url);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Header toolbar */}
      <div
        className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 z-10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          <h3 className="text-sm font-semibold truncate text-white">{attachment.originalName}</h3>
          <span className="text-xs text-white/60">
            {formatSize(attachment.size)} • {new Date(attachment.createdAt).toLocaleString("vi-VN")}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Mở tab mới"
          >
            <ExternalLink size={18} />
          </a>
          <a
            href={fileUrl}
            download={attachment.originalName}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tải về máy"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={fileUrl}
          alt={attachment.originalName}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all"
        />
      </div>
    </div>
  );
}
