import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  FileText,
  Code2,
  Trash2,
  Edit2,
  Library,
  Upload,
  Download,
  AlertCircle,
  Folder,
  Layers,
} from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import type { TestCase } from "../../store/testRepositoryStore";
import UserAvatar from "../common/UserAvatar";
import { toast } from "sonner";

interface TestCaseListProps {
  projectId: string;
  onOpenCreateModal: () => void;
  onOpenEditModal: (tc: TestCase) => void;
  onOpenSharedStepsModal: () => void;
  onOpenImportExportModal: (tab: "import" | "export") => void;
}

export default function TestCaseList({
  projectId,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenSharedStepsModal,
  onOpenImportExportModal,
}: TestCaseListProps) {
  const {
    testCases,
    folders,
    selectedFolderId,
    selectedType,
    selectedPriority,
    searchQuery,
    isLoading,
    setSelectedType,
    setSelectedPriority,
    setSearchQuery,
    deleteTestCase,
    fetchTestCases,
  } = useTestRepositoryStore();

  const currentFolder =
    selectedFolderId === "all"
      ? null
      : selectedFolderId === "root"
      ? { name: "Chưa phân loại (Root)" }
      : folders.find((f) => f.id === selectedFolderId);

  const handleDelete = async (tc: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xoá vĩnh viễn test case "${tc.key}: ${tc.title}"?`)) return;

    try {
      await deleteTestCase(projectId, tc.id);
      toast.success(`Đã xoá ${tc.key}`);
    } catch {
      toast.error("Xoá test case thất bại.");
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Khẩn cấp 🚨</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Cao</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Trung bình</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Thấp</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Kho Test Case</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold">
              {currentFolder ? currentFolder.name : "Tất cả test cases"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-[17px] font-bold text-slate-800">
              {currentFolder ? currentFolder.name : "Toàn bộ Test Cases"}
            </h2>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {testCases.length} kịch bản
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSharedStepsModal}
            className="px-3 py-1.5 text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Library size={14} className="text-indigo-600" />
            <span>Bước dùng chung</span>
          </button>

          <button
            onClick={() => onOpenImportExportModal("import")}
            className="px-3 py-1.5 text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Upload size={14} className="text-slate-600" />
            <span>Nhập / Xuất</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-1.5 text-[12px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>Tạo Test Case</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchTestCases(projectId);
            }}
            placeholder="Tìm theo mã key, tiêu đề, mô tả..."
            className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              fetchTestCases(projectId);
            }}
            className="text-[12px] border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">Loại: Tất cả</option>
            <option value="MANUAL">Manual Test</option>
            <option value="BDD">BDD / Gherkin</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              fetchTestCases(projectId);
            }}
            className="text-[12px] border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">Độ ưu tiên: Tất cả</option>
            <option value="CRITICAL">Khẩn cấp (Critical)</option>
            <option value="HIGH">Cao (High)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="LOW">Thấp (Low)</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : testCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileText size={22} />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">
              Chưa có Test Case nào trong phạm vi này
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              Bắt đầu tạo kịch bản kiểm thử Manual hoặc BDD Gherkin đầu tiên của bạn!
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 text-[12px] font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Tạo Test Case ngay</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28">Mã Key</th>
                  <th className="py-3 px-4">Tiêu đề Test Case</th>
                  <th className="py-3 px-3 w-28">Loại Test</th>
                  <th className="py-3 px-3 w-32">Độ ưu tiên</th>
                  <th className="py-3 px-3 w-36">Thư mục</th>
                  <th className="py-3 px-3 w-20 text-center">Số bước</th>
                  <th className="py-3 px-3 w-36">Người tạo</th>
                  <th className="py-3 px-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testCases.map((tc) => (
                  <tr
                    key={tc.id}
                    onClick={() => onOpenEditModal(tc)}
                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {tc.key}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {tc.title}
                      </div>
                      {tc.preconditions && (
                        <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                          Tiên quyết: {tc.preconditions}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {tc.type === "BDD" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          <Code2 size={11} /> BDD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          <FileText size={11} /> Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {getPriorityBadge(tc.priority)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {tc.folder ? (
                        <span className="flex items-center gap-1 truncate">
                          <Folder size={12} className="text-amber-500 shrink-0" />
                          <span className="truncate">{tc.folder.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân loại</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-600">
                      {tc.type === "MANUAL" ? tc._count?.steps ?? tc.steps?.length ?? 0 : "Gherkin"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={tc.author?.name || "Tester"} size="sm" />
                        <span className="truncate text-slate-600 text-[11px]">
                          {tc.author?.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => handleDelete(tc, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Xoá Test Case"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}