import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Library, CheckCircle2 } from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestSharedStepsModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TestSharedStepsModal({
  projectId,
  isOpen,
  onClose,
}: TestSharedStepsModalProps) {
  const { sharedSteps, fetchSharedSteps, createSharedStep, deleteSharedStep } =
    useTestRepositoryStore();

  const [title, setTitle] = useState("");
  const [action, setAction] = useState("");
  const [testData, setTestData] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSharedSteps(projectId);
    }
  }, [isOpen, projectId, fetchSharedSteps]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !action.trim()) {
      toast.error("Vui lòng nhập tên và hành động của bước.");
      return;
    }

    setIsCreating(true);
    try {
      await createSharedStep(projectId, {
        title: title.trim(),
        action: action.trim(),
        testData: testData.trim() || undefined,
        expectedResult: expectedResult.trim() || "",
      });
      toast.success("Đã tạo bước dùng chung mới!");
      setTitle("");
      setAction("");
      setTestData("");
      setExpectedResult("");
    } catch {
      toast.error("Tạo bước dùng chung thất bại.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, stepTitle: string) => {
    if (!confirm(`Xoá bước dùng chung "${stepTitle}"?`)) return;
    try {
      await deleteSharedStep(projectId, id);
      toast.success("Đã xoá bước dùng chung!");
    } catch {
      toast.error("Xoá thất bại.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Library size={18} className="text-indigo-600" />
            <h2 className="text-[16px] font-bold text-slate-800">
              Thư Viện Bước Dùng Chung (Reusable Steps)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Form */}
          <form
            onSubmit={handleCreate}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3"
          >
            <span className="text-[12px] font-bold text-slate-700 block">
              + Thêm bước kiểm thử dùng chung mới
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Tên gợi nhớ *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đăng nhập quyền Admin..."
                  required
                  className="w-full text-[12px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Dữ liệu test (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder="Ví dụ: admin / pass123..."
                  className="w-full text-[12px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Hành động thực hiện (Action) *
                </label>
                <textarea
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Ví dụ: Nhập tài khoản admin và bấm Đăng nhập..."
                  rows={2}
                  required
                  className="w-full text-[12px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Kết quả mong đợi
                </label>
                <textarea
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  placeholder="Ví dụ: Hiển thị Dashboard quản trị..."
                  rows={2}
                  className="w-full text-[12px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-1.5 text-[12px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Thêm vào thư viện</span>
              </button>
            </div>
          </form>

          {/* List of Shared Steps */}
          <div>
            <div className="text-[13px] font-bold text-slate-700 mb-2">
              Danh sách bước sẵn có ({sharedSteps.length})
            </div>

            {sharedSteps.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-slate-400 italic bg-slate-50 rounded-xl">
                Chưa có bước dùng chung nào được định nghĩa.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {sharedSteps.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-[13px]">
                          {step.title}
                        </span>
                        {step._count?.testCases !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            Dùng trong {step._count.testCases} test case
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-600 mt-1">
                        <strong>Hành động:</strong> {step.action}
                      </p>
                      {step.testData && (
                        <p className="text-[11px] text-slate-500">
                          <strong>Dữ liệu:</strong> {step.testData}
                        </p>
                      )}
                      {step.expectedResult && (
                        <p className="text-[11px] text-emerald-700">
                          <strong>Kỳ vọng:</strong> {step.expectedResult}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(step.id, step.title)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xoá bước dùng chung"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}