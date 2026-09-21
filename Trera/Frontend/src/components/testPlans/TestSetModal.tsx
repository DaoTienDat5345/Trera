import React, { useState, useEffect } from "react";
import { X, Layers, CheckCircle2, Search, CheckSquare, Square } from "lucide-react";
import { useTestPlanStore } from "../../store/testPlanStore";
import type { TestSet } from "../../store/testPlanStore";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import type { TestCase } from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestSetModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  editSet?: TestSet | null;
}

export default function TestSetModal({
  projectId,
  isOpen,
  onClose,
  editSet,
}: TestSetModalProps) {
  const { createTestSet, updateTestSet } = useTestPlanStore();
  const { testCases, fetchTestCases } = useTestRepositoryStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTestCases(projectId);
      if (editSet) {
        setName(editSet.name);
        setDescription(editSet.description || "");
        const existingIds = new Set(
          editSet.testCases?.map((c) => c.testCaseId) || []
        );
        setSelectedCaseIds(existingIds);
      } else {
        setName("");
        setDescription("");
        setSelectedCaseIds(new Set());
      }
      setSearch("");
    }
  }, [isOpen, editSet, projectId, fetchTestCases]);

  if (!isOpen) return null;

  const toggleCase = (id: string) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCases = testCases.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.key.toLowerCase().includes(search.toLowerCase())
  );

  const selectAllFiltered = () => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      filteredCases.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      filteredCases.forEach((c) => next.delete(c.id));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên Test Set.");
      return;
    }

    setIsSubmitting(true);
    try {
      const caseIdsArray = Array.from(selectedCaseIds);
      if (editSet) {
        await updateTestSet(projectId, editSet.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          testCaseIds: caseIdsArray,
        });
        toast.success(`Đã cập nhật Test Set "${name}"!`);
      } else {
        await createTestSet(projectId, {
          name: name.trim(),
          description: description.trim() || undefined,
          testCaseIds: caseIdsArray,
        });
        toast.success(`Đã tạo Test Set "${name}" thành công!`);
      }
      onClose();
    } catch {
      toast.error("Lưu Test Set thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-[16px]">
            <Layers size={18} className="text-indigo-600" />
            <span>{editSet ? "Chỉnh sửa Test Set" : "Tạo Test Set mới"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">
              Tên Test Set *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Smoke Test Đăng Nhập & Giỏ Hàng"
              required
              className="w-full text-[13px] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">
              Mô tả mục đích nhóm test (tuỳ chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tập hợp các test case kiểm tra chức năng cốt lõi trước khi release..."
              className="w-full text-[13px] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* Test Cases Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-700">
                Chọn các Test Case vào nhóm ({selectedCaseIds.size} đã chọn)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllFiltered}
                  className="text-slate-500 hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm test case theo tiêu đề hoặc mã key..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
              />
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-slate-400 italic">
                  Không tìm thấy test case nào phù hợp.
                </div>
              ) : (
                filteredCases.map((tc) => {
                  const isChecked = selectedCaseIds.has(tc.id);
                  return (
                    <div
                      key={tc.id}
                      onClick={() => toggleCase(tc.id)}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer text-[12px] transition-colors ${
                        isChecked ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <button type="button" className="text-indigo-600">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-300" />}
                      </button>
                      <span className="font-mono font-bold text-indigo-700 text-[11px] w-20 shrink-0">
                        {tc.key}
                      </span>
                      <span className="flex-1 text-slate-800 truncate font-medium">
                        {tc.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tc.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 size={15} />
            <span>{editSet ? "Lưu thay đổi" : "Tạo Test Set"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}