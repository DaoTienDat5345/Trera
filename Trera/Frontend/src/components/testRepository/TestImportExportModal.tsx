import React, { useState } from "react";
import { X, Upload, Download, FileSpreadsheet, Code2, FileText, CheckCircle2 } from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestImportExportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "import" | "export";
}

export default function TestImportExportModal({
  projectId,
  isOpen,
  onClose,
  defaultTab = "import",
}: TestImportExportModalProps) {
  const { folders, selectedFolderId, importTestCases, exportTestCases } =
    useTestRepositoryStore();

  const [activeTab, setActiveTab] = useState<"import" | "export">(defaultTab);
  const [importFormat, setImportFormat] = useState<"gherkin" | "csv" | "json">("gherkin");
  const [importContent, setImportContent] = useState("");
  const [importFolderId, setImportFolderId] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportContent(text || "");
      if (file.name.endsWith(".feature")) setImportFormat("gherkin");
      else if (file.name.endsWith(".csv")) setImportFormat("csv");
      else if (file.name.endsWith(".json")) setImportFormat("json");
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent.trim()) {
      toast.error("Vui lòng nhập hoặc chọn file dữ liệu test.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importTestCases(projectId, {
        format: importFormat,
        content: importContent,
        folderId: importFolderId || undefined,
      });

      if (result.success) {
        toast.success(`Nhập thành công ${result.count} test case!`);
        onClose();
      } else {
        toast.error(result.message || "Nhập test case thất bại.");
      }
    } catch {
      toast.error("Lỗi khi nhập dữ liệu.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportSubmit = async () => {
    setIsExporting(true);
    try {
      await exportTestCases(
        projectId,
        exportFormat,
        selectedFolderId && selectedFolderId !== "all" ? selectedFolderId : undefined
      );
      toast.success("Đã tải xuống file test cases!");
      onClose();
    } catch {
      toast.error("Xuất test cases thất bại.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between px-6 pt-4 pb-0 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex items-center gap-1.5 pb-3 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "import"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Upload size={16} />
              <span>Nhập Test Cases (Import)</span>
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-1.5 pb-3 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "export"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Download size={16} />
              <span>Xuất Test Cases (Export)</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mt-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "import" ? (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Format selection */}
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                  Định dạng dữ liệu:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportFormat("gherkin")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[12px] font-semibold transition-colors ${
                      importFormat === "gherkin"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Code2 size={14} />
                    <span>Cucumber (.feature)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportFormat("csv")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[12px] font-semibold transition-colors ${
                      importFormat === "csv"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportFormat("json")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[12px] font-semibold transition-colors ${
                      importFormat === "json"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText size={14} />
                    <span>JSON Raw</span>
                  </button>
                </div>
              </div>

              {/* Target Folder */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1">
                  Đưa vào thư mục:
                </label>
                <select
                  value={importFolderId}
                  onChange={(e) => setImportFolderId(e.target.value)}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">(Chưa phân loại / Gốc)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload or Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Nội dung kịch bản hoặc tải tệp lên:
                  </label>
                  <label className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">
                    Chọn tệp từ máy...
                    <input
                      type="file"
                      accept=".feature,.csv,.json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  rows={8}
                  placeholder={
                    importFormat === "gherkin"
                      ? `Feature: Đăng nhập\n  Scenario: Đăng nhập thành công\n    Given Đã mở trang web\n    When Nhập email và pass\n    Then Vào Dashboard`
                      : importFormat === "csv"
                      ? `Key,Title,Type,Priority,Folder,Preconditions,Step #,Action,Test Data,Expected Result\n,Test Login,MANUAL,HIGH,,,1,Nhập email,,Hiển thị đúng email`
                      : `[{"title": "Test case sample", "type": "MANUAL", "priority": "HIGH"}]`
                  }
                  className="w-full font-mono text-[12px] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 text-slate-800 resize-none bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isImporting || !importContent.trim()}
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Upload size={15} />
                  <span>{isImporting ? "Đang xử lý..." : "Tiến hành Nhập (Import)"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-2">
                  Chọn định dạng tải về:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                      exportFormat === "csv"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FileSpreadsheet size={24} className="text-emerald-600" />
                    <div>
                      <div className="font-bold text-[13px]">Bảng tính CSV / Excel</div>
                      <div className="text-[11px] text-slate-500">
                        Xuất bảng chi tiết các bước, dữ liệu và kết quả
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("json")}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                      exportFormat === "json"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Code2 size={24} className="text-amber-600" />
                    <div>
                      <div className="font-bold text-[13px]">Tệp dữ liệu JSON</div>
                      <div className="text-[11px] text-slate-500">
                        Cấu trúc JSON đầy đủ thích hợp cho backup / API
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[12px] text-slate-600 space-y-1 border border-slate-200/80">
                <p>
                  <strong>Phạm vi xuất:</strong>{" "}
                  {selectedFolderId && selectedFolderId !== "all"
                    ? `Thư mục đang chọn (${
                        folders.find((f) => f.id === selectedFolderId)?.name || "Chưa phân loại"
                      })`
                    : "Toàn bộ test cases trong dự án"}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExportSubmit}
                  disabled={isExporting}
                  className="px-6 py-2.5 text-[13px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={16} />
                  <span>{isExporting ? "Đang xuất..." : "Tải xuống ngay"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}