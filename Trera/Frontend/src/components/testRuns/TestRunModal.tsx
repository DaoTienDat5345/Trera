import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Calendar,
  Layers,
  Search,
  CheckSquare,
  Square,
  Users,
  Monitor,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useTestRunStore } from "../../store/testRunStore";
import type { TestRun } from "../../store/testRunStore";
import { useTestPlanStore } from "../../store/testPlanStore";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import { useProjectStore } from "../../store/projectStore";
import { toast } from "sonner";

interface TestRunModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  editRun?: TestRun | null;
  defaultPlanId?: string;
}

export default function TestRunModal({
  projectId,
  isOpen,
  onClose,
  editRun,
  defaultPlanId,
}: TestRunModalProps) {
  const {
    createTestRun,
    updateTestRun,
    environments,
    fetchEnvironments,
    createEnvironment,
  } = useTestRunStore();
  const { testPlans, fetchTestPlans } = useTestPlanStore();
  const { testCases, fetchTestCases } = useTestRepositoryStore();
  const { currentProject } = useProjectStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [planId, setPlanId] = useState(defaultPlanId || "");
  const [assignedToId, setAssignedToId] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick add environment
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvCategory, setNewEnvCategory] = useState("Web");

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments(projectId);
      fetchTestPlans(projectId);
      fetchTestCases(projectId);

      if (editRun) {
        setName(editRun.name);
        setDescription(editRun.description || "");
        setEnvironmentId(editRun.environmentId || "");
        setPlanId(editRun.planId || "");
        setAssignedToId(editRun.assignedToId || "");
        const ids = new Set(editRun.results?.map((r) => r.testCaseId) || []);
        setSelectedCaseIds(ids);
      } else {
        const defaultName = `Đợt kiểm thử ${new Date().toLocaleDateString("vi-VN")}`;
        setName(defaultName);
        setDescription("");
        setPlanId(defaultPlanId || "");
        setEnvironmentId(environments[0]?.id || "");
        setAssignedToId(currentProject?.ownerId || "");
        setSelectedCaseIds(new Set());
      }
    }
  }, [isOpen, editRun, defaultPlanId, projectId]);

  // Set default environment when loaded
  useEffect(() => {
    if (environments.length > 0 && !environmentId) {
      setEnvironmentId(environments[0].id);
    }
  }, [environments, environmentId]);

  if (!isOpen) return null;

  const handleCreateEnv = async () => {
    if (!newEnvName.trim()) return;
    try {
      const env = await createEnvironment(projectId, {
        name: newEnvName.trim(),
        category: newEnvCategory,
      });
      if (env) {
        setEnvironmentId(env.id);
        setNewEnvName("");
        setShowAddEnv(false);
        toast.success("Đã thêm môi trường kiểm thử mới");
      }
    } catch {
      toast.error("Không thể thêm môi trường");
    }
  };

  const handleToggleCase = (caseId: string) => {
    const next = new Set(selectedCaseIds);
    if (next.has(caseId)) {
      next.delete(caseId);
    } else {
      next.add(caseId);
    }
    setSelectedCaseIds(next);
  };

  const handleSelectAll = (cases: typeof testCases) => {
    const allSelected = cases.every((c) => selectedCaseIds.has(c.id));
    const next = new Set(selectedCaseIds);
    if (allSelected) {
      cases.forEach((c) => next.delete(c.id));
    } else {
      cases.forEach((c) => next.add(c.id));
    }
    setSelectedCaseIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên đợt thực thi kiểm thử");
      return;
    }

    if (!planId && selectedCaseIds.size === 0) {
      toast.error("Vui lòng chọn một Kế hoạch kiểm thử hoặc ít nhất một ca test thủ công");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editRun) {
        await updateTestRun(projectId, editRun.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          environmentId: environmentId || undefined,
          assignedToId: assignedToId || undefined,
        });
        toast.success("Cập nhật đợt thực thi kiểm thử thành công");
      } else {
        await createTestRun(projectId, {
          name: name.trim(),
          description: description.trim() || undefined,
          planId: planId || undefined,
          environmentId: environmentId || undefined,
          assignedToId: assignedToId || undefined,
          testCaseIds: planId ? undefined : Array.from(selectedCaseIds),
        });
        toast.success("Khởi tạo đợt thực thi kiểm thử thành công");
      }
      onClose();
    } catch {
      toast.error("Thao tác thất bại, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCases = testCases.filter((tc) =>
    tc.title.toLowerCase().includes(search.toLowerCase()) ||
    tc.key.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPlanObj = testPlans.find((p) => p.id === planId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Play size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">
                {editRun ? "Chỉnh sửa Đợt Thực Thi" : "Tạo Đợt Thực Thi Mới (Test Run)"}
              </h2>
              <p className="text-[12px] text-slate-500">
                Thiết lập môi trường và phạm vi ca kiểm thử để bắt đầu chạy
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Run Name */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1">
              Tên đợt kiểm thử <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Test Run Sprint 4 - Regression Checkout"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1">
              Mô tả / Mục tiêu
            </label>
            <textarea
              rows={2}
              placeholder="Mục tiêu kiểm thử của đợt này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Environment & Assignee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Environment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Monitor size={14} className="text-indigo-600" />
                  Môi trường kiểm thử
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddEnv(!showAddEnv)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {showAddEnv ? "Đóng" : "+ Thêm mới"}
                </button>
              </div>

              {showAddEnv ? (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tên môi trường (VD: iOS 18 Safari)"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    className="w-full px-3 py-1.5 text-[12px] bg-white border border-indigo-200 rounded-lg focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newEnvCategory}
                      onChange={(e) => setNewEnvCategory(e.target.value)}
                      className="px-2.5 py-1 text-[12px] bg-white border border-indigo-200 rounded-lg text-slate-700"
                    >
                      <option value="Web">Web</option>
                      <option value="Mobile">Mobile</option>
                      <option value="API">API</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleCreateEnv}
                      className="px-3 py-1 text-[12px] bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                    >
                      Lưu môi trường
                    </button>
                  </div>
                </div>
              ) : null}

              <select
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium"
              >
                <option value="">-- Chọn môi trường --</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.category || "General"})
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Người thực hiện kiểm thử
                </span>
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium"
              >
                <option value="">-- Chưa chỉ định --</option>
                {currentProject?.members?.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user?.name || m.user?.email} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope: Select from Plan OR Select Cases */}
          {!editRun && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                Kế hoạch kiểm thử liên quan (Test Plan)
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium mb-2"
              >
                <option value="">-- Không gắn Kế hoạch (Chọn ca test thủ công bên dưới) --</option>
                {testPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sprint ? `[Sprint: ${p.sprint.name}]` : ""} ({p.testCases?.length || 0} ca test)
                  </option>
                ))}
              </select>

              {planId ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[12px] text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>
                      Đã chọn kế hoạch <strong>"{selectedPlanObj?.name}"</strong>. Toàn bộ{" "}
                      <strong>{selectedPlanObj?.testCases?.length || 0} ca test</strong> trong kế hoạch sẽ tự động được đưa vào đợt chạy này.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-[13px] font-semibold text-slate-700">
                      Chọn ca test từ Kho ({selectedCaseIds.size} đã chọn)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(filteredCases)}
                      className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {filteredCases.every((c) => selectedCaseIds.has(c.id))
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả"}
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm kiếm ca test..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {filteredCases.length === 0 ? (
                      <div className="p-4 text-center text-[12px] text-slate-400">
                        Không tìm thấy ca kiểm thử nào.
                      </div>
                    ) : (
                      filteredCases.map((tc) => {
                        const isSelected = selectedCaseIds.has(tc.id);
                        return (
                          <div
                            key={tc.id}
                            onClick={() => handleToggleCase(tc.id)}
                            className="flex items-center gap-2.5 p-2.5 hover:bg-white transition-colors cursor-pointer text-[12px]"
                          >
                            <span className="text-slate-400">
                              {isSelected ? (
                                <CheckSquare size={16} className="text-indigo-600" />
                              ) : (
                                <Square size={16} />
                              )}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                              {tc.key}
                            </span>
                            <span className="font-medium text-slate-800 truncate flex-1">
                              {tc.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {tc.steps?.length || 0} bước
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Play size={14} />
              <span>{editRun ? "Lưu thay đổi" : "Bắt đầu Đợt kiểm thử"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
