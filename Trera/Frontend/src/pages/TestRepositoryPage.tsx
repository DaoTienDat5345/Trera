import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import {
  LayoutGrid,
  List,
  Users,
  BarChart3,
  GitMerge,
  ArrowLeft,
  FlaskConical,
  ClipboardList,
  GitFork,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { useProjectStore } from "../store/projectStore";
import { useTestRepositoryStore } from "../store/testRepositoryStore";
import type { TestCase } from "../store/testRepositoryStore";
import TestFolderTree from "../components/testRepository/TestFolderTree";
import TestCaseList from "../components/testRepository/TestCaseList";
import TestCaseModal from "../components/testRepository/TestCaseModal";
import TestSharedStepsModal from "../components/testRepository/TestSharedStepsModal";
import TestImportExportModal from "../components/testRepository/TestImportExportModal";

export default function TestRepositoryPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { getProjectById, currentProject } = useProjectStore();
  const { fetchFolders, fetchTestCases, selectedFolderId } = useTestRepositoryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [showSharedStepsModal, setShowSharedStepsModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportTab, setImportExportTab] = useState<"import" | "export">("import");

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    await Promise.all([
      getProjectById(projectId),
      fetchFolders(projectId),
      fetchTestCases(projectId),
    ]);
    setIsLoading(false);
  }, [projectId, getProjectById, fetchFolders, fetchTestCases]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (projectId) {
      fetchTestCases(projectId);
    }
  }, [projectId, selectedFolderId, fetchTestCases]);

  const handleOpenCreateModal = () => {
    setEditingTestCase(null);
    setShowCaseModal(true);
  };

  const handleOpenEditModal = (tc: TestCase) => {
    setEditingTestCase(tc);
    setShowCaseModal(true);
  };

  const handleOpenImportExport = (tab: "import" | "export") => {
    setImportExportTab(tab);
    setShowImportExportModal(true);
  };

  if (!projectId) return null;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar />

      {/* Project Subheader Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600">
              {currentProject?.name}
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-semibold">Kho Test Case</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical size={18} className="text-indigo-600" />
            <span>Quản lý Test Case</span>
          </h1>

          <nav className="flex items-center gap-1 ml-4">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <LayoutGrid size={14} /> Bảng
            </Link>
            <Link
              to={`/projects/${projectId}/sprints`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <List size={14} /> Backlog
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
              <FlaskConical size={14} /> Kho Test Case
            </button>
            <Link
              to={`/projects/${projectId}/test-plans`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ClipboardList size={14} /> Kế hoạch Test
            </Link>
            <Link
              to={`/projects/${projectId}/traceability`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitFork size={14} /> Ma trận truy vết
            </Link>
            <Link
              to={`/projects/${projectId}/members`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Users size={14} /> Thành viên
            </Link>
            <Link
              to={`/projects/${projectId}/reports`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <BarChart3 size={14} /> Báo cáo
            </Link>
            <Link
              to={`/projects/${projectId}/activity`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <GitMerge size={14} /> Lịch sử
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Workspace: Folder Tree (Left) + TestCase List (Right) */}
      <div className="flex-1 flex overflow-hidden">
        <TestFolderTree projectId={projectId} />

        <TestCaseList
          projectId={projectId}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenEditModal={handleOpenEditModal}
          onOpenSharedStepsModal={() => setShowSharedStepsModal(true)}
          onOpenImportExportModal={handleOpenImportExport}
        />
      </div>

      {/* Modals */}
      <TestCaseModal
        projectId={projectId}
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
        editTestCase={editingTestCase}
      />

      <TestSharedStepsModal
        projectId={projectId}
        isOpen={showSharedStepsModal}
        onClose={() => setShowSharedStepsModal(false)}
      />

      <TestImportExportModal
        projectId={projectId}
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        defaultTab={importExportTab}
      />
    </div>
  );
}