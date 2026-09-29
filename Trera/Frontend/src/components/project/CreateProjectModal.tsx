import React, { useState } from "react";
import { useNavigate } from "react-router";
import { X, FolderPlus, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useProjectStore } from "../../store/projectStore";
import { toast } from "sonner";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { createProject, isLoading } = useProjectStore();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [hasManuallyEditedKey, setHasManuallyEditedKey] = useState(false);

  if (!isOpen) return null;

  // Tự động gợi ý Key từ tên dự án nếu người dùng chưa sửa tay
  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasManuallyEditedKey) {
      // Lấy chữ cái đầu các từ, tối đa 3-4 ký tự
      const generated = val
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4);

      if (generated.length >= 2) {
        setKey(generated);
      } else if (val.trim().length >= 2) {
        setKey(val.trim().slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ""));
      }
    }
  };

  const handleKeyChange = (val: string) => {
    setHasManuallyEditedKey(true);
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên dự án.");
      return;
    }

    if (!key.trim() || key.trim().length < 2) {
      toast.error("Mã dự án (Key) phải chứa từ 2 đến 6 ký tự viết hoa hoặc số (VD: TRE, APP).");
      return;
    }

    const res = await createProject({
      name: name.trim(),
      key: key.trim(),
      description: description.trim() || undefined,
    });

    if (res.success && res.project) {
      toast.success(`Dự án "${res.project.name}" đã được tạo thành công!`);
      onClose();
      // Điều hướng thẳng vào trang Kanban Board của dự án mới tạo
      navigate(`/projects/${res.project.id}`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderPlus className="size-4.5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Tạo dự án mới</h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tên dự án <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Ví dụ: E-Commerce App, Hệ thống Quản lý Bán hàng"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-10 border-slate-200 focus:border-indigo-600"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Mã dự án (Key) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Dùng làm tiền tố mã task (VD: TRE-101)</span>
            </div>
            <Input
              type="text"
              placeholder="VD: TRE, ECO, APP"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="h-10 font-mono font-bold tracking-wider uppercase border-slate-200 focus:border-indigo-600"
              maxLength={6}
              required
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="size-3 text-slate-400" />
              Từ 2 đến 6 ký tự chữ hoa/số. Không thể thay đổi sau khi tạo.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mô tả dự án</label>
            <textarea
              rows={3}
              placeholder="Mô tả mục tiêu, phạm vi hoặc công nghệ của dự án..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-200 p-2.5 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-100 h-10 px-5 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Tạo dự án</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
