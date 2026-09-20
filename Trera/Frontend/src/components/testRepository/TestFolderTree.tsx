import React, { useState } from "react";
import {
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  Inbox,
  Plus,
  X,
} from "lucide-react";
import { useTestRepositoryStore } from "../../store/testRepositoryStore";
import type { TestFolder } from "../../store/testRepositoryStore";
import { toast } from "sonner";

interface TestFolderTreeProps {
  projectId: string;
}

export default function TestFolderTree({ projectId }: TestFolderTreeProps) {
  const {
    folders,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useTestRepositoryStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [parentForNewFolder, setParentForNewFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [editingFolder, setEditingFolder] = useState<TestFolder | null>(null);
  const [editName, setEditName] = useState("");

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive tree
  const rootFolders = folders.filter((f) => !f.parentId);
  const getSubFolders = (parentId: string) => folders.filter((f) => f.parentId === parentId);

  const handleOpenCreateModal = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setParentForNewFolder(parentId);
    setNewFolderName("");
    setNewFolderDesc("");
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder(projectId, {
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        parentId: parentForNewFolder,
      });
      toast.success("Đã tạo thư mục thành công!");
      if (parentForNewFolder) {
        setExpandedFolders((prev) => ({ ...prev, [parentForNewFolder]: true }));
      }
      setShowCreateModal(false);
    } catch {
      toast.error("Tạo thư mục thất bại.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editName.trim()) return;

    try {
      await updateFolder(projectId, editingFolder.id, { name: editName.trim() });
      toast.success("Đã đổi tên thư mục!");
      setEditingFolder(null);
    } catch {
      toast.error("Đổi tên thư mục thất bại.");
    }
  };

  const handleDelete = async (folder: TestFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xoá thư mục "${folder.name}" và toàn bộ thư mục con?`)) return;

    try {
      await deleteFolder(projectId, folder.id);
      toast.success("Đã xoá thư mục!");
    } catch {
      toast.error("Xoá thư mục thất bại.");
    }
  };

  const renderFolderItem = (folder: TestFolder, level: number = 0) => {
    const subFolders = getSubFolders(folder.id);
    const hasChildren = subFolders.length > 0;
    const isExpanded = !!expandedFolders[folder.id];
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => setSelectedFolderId(folder.id)}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer text-[13px] transition-colors ${
            isSelected
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {isExpanded ? (
              <FolderOpen size={15} className={isSelected ? "text-indigo-600" : "text-amber-500"} />
            ) : (
              <Folder size={15} className={isSelected ? "text-indigo-600" : "text-amber-500"} />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
              }`}
            >
              {folder._count?.testCases ?? 0}
            </span>

            {/* Actions menu on hover */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
              <button
                type="button"
                onClick={(e) => handleOpenCreateModal(folder.id, e)}
                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200"
                title="Thêm thư mục con"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolder(folder);
                  setEditName(folder.name);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                title="Đổi tên"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(folder, e)}
                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                title="Xoá thư mục"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{subFolders.map((sub) => renderFolderItem(sub, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
          <Folder size={16} className="text-indigo-600" />
          <span>Thư mục Test</span>
        </div>
        <button
          onClick={() => handleOpenCreateModal(null)}
          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[12px] font-medium"
          title="Tạo thư mục gốc mới"
        >
          <FolderPlus size={15} />
        </button>
      </div>

      {/* Static Items: All & Root */}
      <div className="p-2 space-y-0.5">
        <div
          onClick={() => setSelectedFolderId("all")}
          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors ${
            selectedFolderId === "all"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} className={selectedFolderId === "all" ? "text-indigo-600" : "text-slate-400"} />
            <span>Tất cả Test Cases</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedFolderId("root")}
          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors ${
            selectedFolderId === "root"
              ? "bg-indigo-50 text-indigo-700 font-semibold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox size={15} className={selectedFolderId === "root" ? "text-indigo-600" : "text-slate-400"} />
            <span>Chưa phân loại (Root)</span>
          </div>
        </div>
      </div>

      <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Cấu trúc Module
      </div>

      {/* Recursive Folders List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {rootFolders.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-slate-400 italic">
            Chưa có thư mục nào.
            <br />
            Bấm + để thêm mới.
          </div>
        ) : (
          rootFolders.map((rf) => renderFolderItem(rf, 0))
        )}
      </div>

      {/* Modal Tạo Thư Mục */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-[15px]">
                <FolderPlus size={18} className="text-indigo-600" />
                <span>{parentForNewFolder ? "Thêm thư mục con" : "Tạo thư mục mới"}</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                  Tên thư mục / Module *
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ví dụ: Giỏ hàng & Thanh toán"
                  required
                  autoFocus
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="Mô tả phạm vi các test case..."
                  rows={2}
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-slate-800 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-[13px] border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-[13px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Tạo thư mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Tên Thư Mục */}
      {editingFolder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-[15px]">
                <Edit2 size={16} className="text-indigo-600" />
                <span>Đổi tên thư mục</span>
              </div>
              <button
                onClick={() => setEditingFolder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-600 block mb-1">
                  Tên thư mục mới *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-[13px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="flex-1 py-2 text-[13px] border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-[13px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}