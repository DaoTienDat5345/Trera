import React, { useState, useEffect } from "react";
import { X, Calendar, CheckCircle2, Search, CheckSquare, Square, Layers, ListTodo } from "lucide-react";
import { useTestPlanStore } from "../../store/testPlanStore";
import type { TestPlan, TestPlanStatus } from "../../store/testPlanStore";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import type { TestCase } from "../../store/testRepositoryStore";
import { useSprintStore } from "../../store/sprintStore";
import { toast } from "sonner";

interface TestPlanModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  editPlan?: TestPlan | null;
}

export default function TestPlanModal({
  projectId,
  isOpen,
  onClose,
  editPlan,
}: TestPlanModalProps) {
  const { createTestPlan, updateTestPlan, testSets, fetchTestSets } = useTestPlanStore();
  const { testCases, fetchTestCases } = useTestRepositoryStore();
  const { sprints, fetchSprints } = useSprintStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TestPlanStatus>("DRAFT");
  const [dueDate, setDueDate] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTestCases(projectId);
      fetchTestSets(projectId);
      fetchSprints(projectId);

      if (editPlan) {
        setName(editPlan.name);
        setDescription(editPlan.description || "");
        setStatus(editPlan.status);
        setDueDate(editPlan.dueDate ? editPlan.dueDate.split("T")[0] : "");
        setSprintId(editPlan.sprintId || "");
        const existingIds = new Set(
          editPlan.testCases?.map((c) => c.testCaseId) || []
        );
        setSelectedCaseIds(existingIds);
      } else {
        setName("");
        setDescription("");
        setStatus("DRAFT");
        setDueDate("");
        setSprintId("");
        setSelectedCaseIds(new Set());
      }
      setSearch("");
    }
  }, [isOpen, editPlan, projectId, fetchTestCases, fetchTestSets, fetchSprints]);

  if (!isOpen) return null;

  const toggleCase = (id: string) => {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectSet = (setObj: any) => {
    if (!setObj.testCases) return;
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      setObj.testCases.forEach((tcLink: any) => next.add(tcLink.testCaseId));
      return next;
    });
    toast.info(`Đã thêm các test case từ Test Set "${setObj.name}"`);
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
      toast.error("Vui lòng nhập tên Kế hoạch kiểm thử.");
      return;
    }

    setIsSubmitting(true);
    try {
      const caseIdsArray = Array.from(selectedCaseIds);
      if (editPlan) {
        await updateTestPlan(projectId, editPlan.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          dueDate: dueDate || undefined,
          sprintId: sprintId || undefined,
          testCaseIds: caseIdsArray,
        });
        toast.success(`Đã cập nhật Kế hoạch kiểm thử "${name}"!`);
      } else {
        await createTestPlan(projectId, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          dueDate: dueDate || undefined,
          sprintId: sprintId || undefined,
          testCaseIds: caseIdsArray,
        });
        toast.success(`Đã tạo Kế hoạch kiểm thử "${name}" thành công!`);
      }
      onClose();
    } catch {
      toast.error("Lưu Kế hoạch kiểm thử thất bại.");
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
            <ListTodo size={18} className="text-indigo-600" />
            <span>{editPlan ? "Chỉnh sửa Kế hoạch kiểm thử" : "Tạo Kế hoạch kiểm thử mới (Test Plan)"}</span>
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
              Tên Kế hoạch kiểm thử *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Kế hoạch QA Sprint 5, Regression Test Release v2.0"
              required
              className="w-full text-[13px] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                Trạng thái kế hoạch
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TestPlanStatus)}
                className="w-full text-[12px] border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="DRAFT">Nháp (Draft)</option>
                <option value="IN_PROGRESS">Đang thực hiện (In Progress)</option>
                <option value="COMPLETED">Đã hoàn thành (Completed)</option>
                <option value="ARCHIVED">Lưu trữ (Archived)</option>
              </select>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                Gắn với Sprint
              </label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full text-[12px] border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">(Không gắn Sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                Hạn chót (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-[12px] border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">
              Mô tả mục tiêu kiểm thử (tuỳ chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi release, các module trọng tâm cần test..."
              className="w-full text-[13px] border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* Quick Select from Test Sets */}
          {testSets.length > 0 && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-900 block mb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                Chọn nhanh từ Test Sets có sẵn:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {testSets.map((ts) => (
                  <button
                    key={ts.id}
                    type="button"
                    onClick={() => handleSelectSet(ts)}
                    className="text-[11px] font-semibold px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg transition-colors shadow-2xs"
                  >
                    + {ts.name} ({ts._count?.testCases || 0} cases)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Test Cases Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-slate-700">
                Danh sách Test Cases mục tiêu ({selectedCaseIds.size} đã chọn)
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
            <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
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
            <span>{editPlan ? "Lưu thay đổi" : "Tạo Kế hoạch"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}