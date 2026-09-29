import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Layers,
  CheckSquare,
  ArrowRight,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Navbar from "../components/layout/Navbar";
import CreateProjectModal from "../components/project/CreateProjectModal";
import UserAvatar, { getAvatarColor } from "../components/common/UserAvatar";
import { useProjectStore, type Project } from "../store/projectStore";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

export const ProjectsPage: React.FC = () => {
  const { projects, fetchProjects, isLoading, deleteProject } = useProjectStore();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    e.preventDefault();

    if (
      window.confirm(
        `⚠️ Cảnh báo: Bạn có chắc chắn muốn xoá vĩnh viễn dự án "${project.name}" [${project.key}] cùng toàn bộ Sprints, Issues và dữ liệu liên quan không?`
      )
    ) {
      const res = await deleteProject(project.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navbar onOpenCreateProject={() => setIsModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dự án của bạn
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý và theo dõi tiến độ các dự án bạn đang tham gia hoặc sở hữu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Tìm tên hoặc mã Key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200"
              />
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm gap-1.5 h-10 px-4 shrink-0"
            >
              <Plus className="size-4" />
              <span>Tạo dự án</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-white border border-slate-200/80 p-6 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-4 bg-slate-100 rounded w-2/3 pt-4" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const isOwner = project.ownerId === user?.id;
              const colorClass = getAvatarColor(project.name);

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200 p-6 relative overflow-hidden"
                >
                  {/* Top: Icon Key & Title */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-sm ${colorClass}`}
                      >
                        {project.key.slice(0, 3)}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {project.name}
                        </h2>
                        <span className="text-xs font-mono font-medium text-slate-400">
                          [{project.key}]
                        </span>
                      </div>
                    </div>

                    {/* Role badge */}
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        isOwner
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isOwner ? "Chủ sở hữu" : "Thành viên"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 h-8 mb-5">
                    {project.description || "Chưa có mô tả cho dự án này."}
                  </p>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-50/80 border border-slate-100 mb-5 text-center">
                    <div>
                      <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                        <CheckSquare className="size-3" /> Công việc
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {project._count?.issues ?? 0}
                      </span>
                    </div>
                    <div className="border-x border-slate-200/60">
                      <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                        <Layers className="size-3" /> Sprint
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {project._count?.sprints ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                        <Users className="size-3" /> Thành viên
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {project._count?.members ?? 1}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Members Avatar & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {project.members && project.members.length > 0 ? (
                        project.members.slice(0, 4).map((m) => (
                          <UserAvatar
                            key={m.id}
                            name={m.user.name}
                            size="sm"
                            className="ring-2 ring-white"
                          />
                        ))
                      ) : (
                        <UserAvatar
                          name={project.owner?.name || user?.name}
                          size="sm"
                          className="ring-2 ring-white"
                        />
                      )}
                      {project.members && project.members.length > 4 && (
                        <div className="size-7 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProject(e, project)}
                          title="Xoá dự án"
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                      <div className="size-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg mx-auto mt-6">
            <div className="size-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <FolderKanban className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {searchTerm ? "Không tìm thấy dự án phù hợp" : "Bắt đầu với dự án đầu tiên"}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              {searchTerm
                ? `Không có dự án nào khớp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm khác.`
                : "Tạo dự án để bắt đầu quản lý task kéo thả Kanban, chạy Sprint và cộng tác cùng nhóm của bạn."}
            </p>
            {searchTerm ? (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="border-slate-200"
              >
                Xoá bộ lọc tìm kiếm
              </Button>
            ) : (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100 gap-2 h-11 px-6"
              >
                <Sparkles className="size-4" />
                <span>Tạo dự án ngay</span>
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Modal Tạo Dự Án Mới */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;
