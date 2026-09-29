import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MinusCircle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { useTestPlanStore } from "../../store/testPlanStore";
import type { TestPlan, ExecutionStatus } from "../../store/testPlanStore";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestPlanDetailViewProps {
  projectId: string;
  plan: TestPlan;
  onBack: () => void;
  onEditPlan: (plan: TestPlan) => void;
}

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  PASSED: {
    label: "PASS",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    icon: <CheckCircle2 size={13} className="text-emerald-600" />,
  },
  FAILED: {
    label: "FAIL",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: <XCircle size={13} className="text-red-600" />,
  },
  BLOCKED: {
    label: "BLOCKED",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: <AlertTriangle size={13} className="text-amber-600" />,
  },
  SKIPPED: {
    label: "SKIPPED",
    bg: "bg-purple-100",
    text: "text-purple-800",
    icon: <MinusCircle size={13} className="text-purple-600" />,
  },
  UNTESTED: {
    label: "CHƯA TEST",
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: <Clock size={13} className="text-slate-400" />,
  },
};

export default function TestPlanDetailView({
  projectId,
  plan,
  onBack,
  onEditPlan,
}: TestPlanDetailViewProps) {
  const { updatePlanCaseStatus, removeCaseFromPlan, addCasesToPlan, deleteTestPlan } =
    useTestPlanStore();
  const { testCases, fetchTestCases } = useTestRepositoryStore();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showAddCasesModal, setShowAddCasesModal] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());

  const metrics = plan.metrics || {
    total: plan.testCases?.length || 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: plan.testCases?.length || 0,
    completed: 0,
    passPercentage: 0,
    failPercentage: 0,
    blockedPercentage: 0,
    completionPercentage: 0,
  };

  const handleStatusChange = async (caseId: string, newStatus: ExecutionStatus) => {
    try {
      await updatePlanCaseStatus(projectId, plan.id, caseId, { status: newStatus });
      toast.success(`Đã cập nhật trạng thái test case sang ${newStatus}`);
    } catch {
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  const handleNoteChange = async (caseId: string, note: string) => {
    try {
      const current = plan.testCases?.find((c) => c.testCaseId === caseId);
      if (current) {
        await updatePlanCaseStatus(projectId, plan.id, caseId, {
          status: current.status,
          note,
        });
      }
    } catch {
      toast.error("Cập nhật ghi chú thất bại.");
    }
  };

  const handleRemoveCase = async (caseId: string, title: string) => {
    if (!confirm(`Gỡ test case "${title}" khỏi kế hoạch?`)) return;
    try {
      await removeCaseFromPlan(projectId, plan.id, caseId);
      toast.success("Đã gỡ test case khỏi kế hoạch.");
    } catch {
      toast.error("Gỡ test case thất bại.");
    }
  };

  const handleDeletePlan = async () => {
    if (!confirm(`Xoá Kế hoạch kiểm thử "${plan.name}"?`)) return;
    try {
      await deleteTestPlan(projectId, plan.id);
      toast.success("Đã xoá Kế hoạch kiểm thử!");
      onBack();
    } catch {
      toast.error("Xoá kế hoạch thất bại.");
    }
  };

  const handleOpenAddModal = () => {
    fetchTestCases(projectId);
    const existingIds = new Set(plan.testCases?.map((c) => c.testCaseId) || []);
    setSelectedCaseIds(new Set());
    setShowAddCasesModal(true);
  };

  const handleAddCasesSubmit = async () => {
    if (selectedCaseIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một test case.");
      return;
    }
    try {
      const added = await addCasesToPlan(projectId, plan.id, {
        testCaseIds: Array.from(selectedCaseIds),
      });
      toast.success(`Đã thêm ${added} test case vào kế hoạch!`);
      setShowAddCasesModal(false);
    } catch {
      toast.error("Thêm test case thất bại.");
    }
  };

  // Filter test cases in plan
  const planCases = plan.testCases || [];
  const existingInPlanIds = new Set(planCases.map((c) => c.testCaseId));

  const filteredPlanCases = planCases.filter((c) => {
    const matchesSearch =
      c.testCase.title.toLowerCase().includes(search.toLowerCase()) ||
      c.testCase.key.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Candidate cases for adding
  const availableToAdd = testCases.filter((c) => !existingInPlanIds.has(c.id));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Quay lại danh sách Kế hoạch</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 text-[12px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Thêm Test Cases</span>
            </button>
            <button
              onClick={() => onEditPlan(plan)}
              className="px-3 py-1.5 text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <Edit2 size={13} />
              <span>Chỉnh sửa</span>
            </button>
            <button
              onClick={handleDeletePlan}
              className="px-3 py-1.5 text-[12px] font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Xoá</span>
            </button>
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-slate-900">{plan.name}</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {plan.status}
              </span>
              {plan.sprint && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Sprint: {plan.sprint.name}
                </span>
              )}
            </div>
            {plan.description && (
              <p className="text-[13px] text-slate-500 mt-1">{plan.description}</p>
            )}
          </div>

          {plan.dueDate && (
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Calendar size={14} className="text-slate-500" />
              <span>Hạn: {new Date(plan.dueDate).toLocaleDateString("vi-VN")}</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Counters */}
        <div className="mt-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-slate-700">Tiến độ thực thi kiểm thử</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-bold">
                Pass: {metrics.passPercentage}% ({metrics.passed}/{metrics.total})
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-semibold">
                Đã test: {metrics.completionPercentage}% ({metrics.completed}/{metrics.total})
              </span>
            </div>
          </div>

          {/* Multi-segmented Progress Bar */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${metrics.passPercentage}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Pass: ${metrics.passed}`}
            />
            <div
              style={{ width: `${metrics.failPercentage}%` }}
              className="bg-red-500 h-full transition-all duration-300"
              title={`Fail: ${metrics.failed}`}
            />
            <div
              style={{ width: `${metrics.blockedPercentage}%` }}
              className="bg-amber-400 h-full transition-all duration-300"
              title={`Blocked: ${metrics.blocked}`}
            />
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Tổng số Test</div>
              <div className="text-[16px] font-bold text-slate-800 mt-0.5">{metrics.total}</div>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Đạt (Pass)</div>
              <div className="text-[16px] font-bold text-emerald-700 mt-0.5">{metrics.passed}</div>
            </div>
            <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-200 text-center">
              <div className="text-[10px] uppercase font-bold text-red-700">Thất bại (Fail)</div>
              <div className="text-[16px] font-bold text-red-700 mt-0.5">{metrics.failed}</div>
            </div>
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-700">Bị nghẽn (Block)</div>
              <div className="text-[16px] font-bold text-amber-700 mt-0.5">{metrics.blocked}</div>
            </div>
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500">Chưa test</div>
              <div className="text-[16px] font-bold text-slate-600 mt-0.5">{metrics.untested}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases Table Section */}
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm test case trong kế hoạch..."
              className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-[12px] border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PASSED">Chỉ Pass</option>
              <option value="FAILED">Chỉ Fail</option>
              <option value="BLOCKED">Chỉ Blocked</option>
              <option value="UNTESTED">Chưa test</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-28">Mã Key</th>
                <th className="py-3 px-4">Tiêu đề Test Case</th>
                <th className="py-3 px-3 w-28">Loại Test</th>
                <th className="py-3 px-3 w-40">Trạng thái kết quả</th>
                <th className="py-3 px-3 w-48">Ghi chú thực tế</th>
                <th className="py-3 px-3 w-32">Ngày chạy</th>
                <th className="py-3 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlanCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Chưa có test case nào trong kế hoạch hoặc không khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredPlanCases.map((pc) => {
                  const cfg = STATUS_CONFIG[pc.status];
                  return (
                    <tr key={pc.testCaseId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {pc.testCase.key}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {pc.testCase.title}
                        {pc.testCase.folder && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Module: {pc.testCase.folder.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {pc.testCase.type}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={pc.status}
                          onChange={(e) =>
                            handleStatusChange(pc.testCaseId, e.target.value as ExecutionStatus)
                          }
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none ${cfg.bg} ${cfg.text}`}
                        >
                          <option value="UNTESTED">⏳ Chưa test</option>
                          <option value="PASSED">✅ PASS</option>
                          <option value="FAILED">❌ FAIL</option>
                          <option value="BLOCKED">⚠️ BLOCKED</option>
                          <option value="SKIPPED">⏭️ SKIPPED</option>
                        </select>
                      </td>

                      {/* Inline Note */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          defaultValue={pc.note || ""}
                          placeholder="Ghi chú (e.g. Lỗi UI)..."
                          onBlur={(e) => handleNoteChange(pc.testCaseId, e.target.value)}
                          className="w-full text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded px-1.5 py-1 focus:outline-none bg-transparent"
                        />
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                        {pc.executedAt
                          ? new Date(pc.executedAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--"}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleRemoveCase(pc.testCaseId, pc.testCase.title)}
                          className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          title="Gỡ khỏi kế hoạch"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Test Cases vào Plan */}
      {showAddCasesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="font-bold text-slate-800 text-[15px] flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                <span>Thêm Test Cases vào Kế hoạch</span>
              </div>
              <button
                onClick={() => setShowAddCasesModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="text-[12px] text-slate-600">
                Chọn các test case chưa có trong kế hoạch ({selectedCaseIds.size} đã chọn):
              </div>

              <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                {availableToAdd.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-slate-400 italic">
                    Tất cả test case trong dự án đã có trong kế hoạch này!
                  </div>
                ) : (
                  availableToAdd.map((tc) => {
                    const isChecked = selectedCaseIds.has(tc.id);
                    return (
                      <div
                        key={tc.id}
                        onClick={() => {
                          setSelectedCaseIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(tc.id)) next.delete(tc.id);
                            else next.add(tc.id);
                            return next;
                          });
                        }}
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
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCasesModal(false)}
                className="px-4 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Huỷ
              </button>
              <button
                onClick={handleAddCasesSubmit}
                disabled={selectedCaseIds.size === 0}
                className="px-4 py-1.5 text-[12px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                Thêm {selectedCaseIds.size} Test Cases
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}