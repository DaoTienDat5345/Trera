import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  CheckSquare,
  Square,
  FlaskConical,
  Link as LinkIcon,
} from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import { useTraceabilityStore } from "../../store/traceabilityStore";
import type { TraceabilityItem } from "../../store/traceabilityStore";
import { toast } from "sonner";

interface LinkTestCaseModalProps {
  projectId: string;
  issue: TraceabilityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkTestCaseModal({
  projectId,
  issue,
  isOpen,
  onClose,
}: LinkTestCaseModalProps) {
  const { testCases, fetchTestCases } = useTestRepositoryStore();
  const { linkTestCases } = useTraceabilityStore();

  const [search, setSearch] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTestCases(projectId);
      if (issue) {
        const existingIds = new Set(issue.testCases.map((tc) => tc.id));
        setSelectedCaseIds(existingIds);
      } else {
        setSelectedCaseIds(new Set());
      }
    }
  }, [isOpen, issue, projectId]);

  if (!isOpen || !issue) return null;

  const handleToggle = (id: string) => {
    const next = new Set(selectedCaseIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCaseIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaseIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một ca kiểm thử để gắn");
      return;
    }

    setIsSubmitting(true);
    try {
      await linkTestCases(projectId, issue.id, Array.from(selectedCaseIds));
      toast.success("Đã gắn các ca kiểm thử vào yêu cầu thành công");
      onClose();
    } catch {
      toast.error("Không thể gắn ca kiểm thử");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCases = testCases.filter(
    (tc) =>
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <LinkIcon size={16} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800">
                Gắn ca kiểm thử vào yêu cầu
              </h2>
              <p className="text-[11px] text-slate-500 truncate max-w-sm">
                {issue.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Case List */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden p-6 space-y-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm ca kiểm thử theo mã hoặc tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 min-h-[220px] max-h-[340px]">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-slate-400">
                Không tìm thấy ca kiểm thử nào.
              </div>
            ) : (
              filteredCases.map((tc) => {
                const isSelected = selectedCaseIds.has(tc.id);
                return (
                  <div
                    key={tc.id}
                    onClick={() => handleToggle(tc.id)}
                    className="flex items-center gap-2.5 p-3 hover:bg-slate-50 transition-colors cursor-pointer text-[13px]"
                  >
                    <span className="text-slate-400">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {tc.key}
                    </span>
                    <span className="font-medium text-slate-800 flex-1 truncate">
                      {tc.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {tc.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-500">
              Đã chọn: <strong>{selectedCaseIds.size}</strong> ca test
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-[13px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu liên kết"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
