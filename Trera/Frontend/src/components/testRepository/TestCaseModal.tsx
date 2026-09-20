import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  FileText,
  Code2,
  Folder,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import type {
  TestCase,
  TestCaseType,
  TestPriority,
  TestStep,
} from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestCaseModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  editTestCase?: TestCase | null;
}

export default function TestCaseModal({
  projectId,
  isOpen,
  onClose,
  editTestCase,
}: TestCaseModalProps) {
  const {
    folders,
    selectedFolderId,
    sharedSteps,
    createTestCase,
    updateTestCase,
    fetchSharedSteps,
  } = useTestRepositoryStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TestCaseType>("MANUAL");
  const [priority, setPriority] = useState<TestPriority>("MEDIUM");
  const [folderId, setFolderId] = useState<string>("");
  const [preconditions, setPreconditions] = useState("");
  const [gherkinContent, setGherkinContent] = useState("");
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [selectedSharedStepId, setSelectedSharedStepId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSharedSteps(projectId);
      if (editTestCase) {
        setTitle(editTestCase.title || "");
        setDescription(editTestCase.description || "");
        setType(editTestCase.type || "MANUAL");
        setPriority(editTestCase.priority || "MEDIUM");
        setFolderId(editTestCase.folderId || "");
        setPreconditions(editTestCase.preconditions || "");
        setGherkinContent(editTestCase.gherkinContent || "");
        setSteps(
          editTestCase.steps && editTestCase.steps.length > 0
            ? editTestCase.steps.map((s) => ({ ...s }))
            : [
                { order: 1, action: "", testData: "", expectedResult: "" },
              ]
        );
      } else {
        setTitle("");
        setDescription("");
        setType("MANUAL");
        setPriority("MEDIUM");
        setFolderId(selectedFolderId && selectedFolderId !== "all" && selectedFolderId !== "root" ? selectedFolderId : "");
        setPreconditions("");
        setGherkinContent(`Feature: Tên tính năng cần test\n  Scenario: Trường hợp kiểm thử chuẩn\n    Given Điều kiện tiên quyết\n    When Hành động người dùng\n    Then Kết quả mong đợi`);
        setSteps([
          { order: 1, action: "", testData: "", expectedResult: "" },
        ]);
      }
    }
  }, [isOpen, editTestCase, selectedFolderId, projectId, fetchSharedSteps]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      { order: prev.length + 1, action: "", testData: "", expectedResult: "" },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  };

  const handleStepChange = (index: number, field: keyof TestStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleInsertSharedStep = () => {
    if (!selectedSharedStepId) return;
    const found = sharedSteps.find((s) => s.id === selectedSharedStepId);
    if (!found) return;

    setSteps((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        action: found.action,
        testData: found.testData || "",
        expectedResult: found.expectedResult,
      },
    ]);
    setSelectedSharedStepId("");
    toast.info(`Đã chèn bước: "${found.title}"`);
  };

  const insertGherkinKeyword = (kw: string) => {
    setGherkinContent((prev) => prev + `\n    ${kw} `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề test case.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        folderId: folderId || undefined,
        preconditions: preconditions.trim() || undefined,
      };

      if (type === "MANUAL") {
        // Lọc các bước hợp lệ
        const validSteps = steps.filter((s) => s.action.trim() || s.expectedResult.trim());
        payload.steps = validSteps;
      } else {
        payload.gherkinContent = gherkinContent.trim();
      }

      if (editTestCase) {
        await updateTestCase(projectId, editTestCase.id, payload);
        toast.success("Đã cập nhật test case!");
      } else {
        await createTestCase(projectId, payload);
        toast.success("Đã tạo test case thành công!");
      }
      onClose();
    } catch {
      toast.error("Lưu test case thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {editTestCase ? editTestCase.key : "TẠO TEST CASE"}
              </span>
              <h2 className="text-[16px] font-bold text-slate-800">
                {editTestCase ? "Chỉnh sửa Test Case" : "Tạo Test Case mới"}
              </h2>
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Hỗ trợ kịch bản Manual bước chi tiết hoặc BDD cú pháp Gherkin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Controls: Type Switch & Priority */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            {/* Type Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setType("MANUAL")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  type === "MANUAL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText size={14} />
                <span>Manual Test (Bảng bước)</span>
              </button>
              <button
                type="button"
                onClick={() => setType("BDD")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  type === "BDD"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Code2 size={14} />
                <span>BDD / Gherkin</span>
              </button>
            </div>

            {/* Folder & Priority Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[12px]">
                <Folder size={14} className="text-slate-400" />
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">(Chưa phân loại / Gốc)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-[12px]">
                <span className="text-slate-500 font-medium">Độ ưu tiên:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TestPriority)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="LOW">Thấp (Low)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="CRITICAL">Khẩn cấp (Critical 🚨)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">
              Tiêu đề Test Case *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Đăng nhập thành công khi nhập đúng email và password"
              required
              className="w-full text-[14px] border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-300 font-medium"
            />
          </div>

          {/* Preconditions */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1">
              Điều kiện tiên quyết (Preconditions)
            </label>
            <input
              type="text"
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              placeholder="Ví dụ: Tài khoản đã được kích hoạt, số dư tài khoản > 50.000 VNĐ..."
              className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* TYPE: MANUAL TEST - STEPS TABLE */}
          {type === "MANUAL" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-800">
                    Các bước kiểm thử ({steps.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Kéo thả hoặc thêm bước để thực thi)
                  </span>
                </div>

                {/* Insert Shared Step Dropdown */}
                {sharedSteps.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSharedStepId}
                      onChange={(e) => setSelectedSharedStepId(e.target.value)}
                      className="text-[12px] border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white"
                    >
                      <option value="">-- Chèn bước dùng chung --</option>
                      {sharedSteps.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleInsertSharedStep}
                      disabled={!selectedSharedStepId}
                      className="text-[12px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg disabled:opacity-40 transition-colors"
                    >
                      Chèn
                    </button>
                  </div>
                )}
              </div>

              {/* Steps Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-[40%]">Hành động (Action) *</th>
                      <th className="py-2.5 px-3 w-[25%]">Dữ liệu kiểm thử (Test Data)</th>
                      <th className="py-2.5 px-3">Kết quả mong đợi (Expected Result) *</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {steps.map((step, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <textarea
                            value={step.action}
                            onChange={(e) => handleStepChange(idx, "action", e.target.value)}
                            placeholder="Ví dụ: Bấm vào nút 'Xác nhận đơn hàng'..."
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-[12px] resize-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <textarea
                            value={step.testData || ""}
                            onChange={(e) => handleStepChange(idx, "testData", e.target.value)}
                            placeholder="Mã voucher: TET2026..."
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-[12px] resize-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <textarea
                            value={step.expectedResult}
                            onChange={(e) => handleStepChange(idx, "expectedResult", e.target.value)}
                            placeholder="Thông báo 'Đặt hàng thành công' xuất hiện..."
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-[12px] resize-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xoá bước này"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-colors"
              >
                <Plus size={15} />
                <span>Thêm bước kiểm thử mới</span>
              </button>
            </div>
          )}

          {/* TYPE: BDD / GHERKIN EDITOR */}
          {type === "BDD" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-slate-800">
                  Kịch bản BDD Gherkin (Given - When - Then)
                </label>
                {/* Keyword Buttons */}
                <div className="flex items-center gap-1">
                  {["Feature:", "Scenario:", "Given", "When", "Then", "And"].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => insertGherkinKeyword(kw)}
                      className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 hover:bg-indigo-100 text-indigo-700 rounded transition-colors"
                    >
                      +{kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={gherkinContent}
                  onChange={(e) => setGherkinContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-[13px] bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none shadow-inner"
                  placeholder={`Feature: Tên tính năng\n  Scenario: Kịch bản kiểm thử\n    Given ...\n    When ...\n    Then ...`}
                />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info size={12} />
                Kịch bản BDD tương thích 100% với Cucumber, SpecFlow, Behave và Behat.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-[13px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 size={16} />
            <span>{editTestCase ? "Lưu thay đổi" : "Tạo Test Case"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}