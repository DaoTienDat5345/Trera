import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router";
import { LayoutGrid, List, Users, Plus, Trash2, Crown, ArrowLeft, Mail, Shield, User2, X } from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import UserAvatar from "../components/common/UserAvatar";
import { useProjectStore } from "../store/projectStore";
import type { ProjectMember } from "../store/projectStore";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";

export default function ProjectMembersPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getProjectById, currentProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isInviting, setIsInviting] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    await getProjectById(projectId);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const isOwner = currentProject?.ownerId === user?.id;
  const myRole = currentProject?.members?.find((m) => m.user.id === user?.id)?.role;
  const canManage = isOwner || myRole === "ADMIN";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !projectId) return;
    setIsInviting(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Đã mời ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteModal(false);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Mời thành viên thất bại");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!projectId) return;
    if (!confirm(`Xoá "${memberName}" khỏi dự án?`)) return;
    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`);
      toast.success(`Đã xoá ${memberName}`);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Xoá thành viên thất bại");
    }
  };

  const members: ProjectMember[] = currentProject?.members ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50"><Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1"><ArrowLeft size={11} /> Dự án</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-slate-600">{currentProject?.name}</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Thành viên</span>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-[18px] font-bold text-slate-800">Thành viên dự án</h1>
            <nav className="flex items-center gap-1 ml-4">
              <Link to={`/projects/${projectId}`} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                <LayoutGrid size={14} /> Bảng
              </Link>
              <Link to={`/projects/${projectId}/sprints`} className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                <List size={14} /> Backlog
              </Link>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-indigo-50 text-indigo-700 rounded-lg font-medium">
                <Users size={14} /> Thành viên
              </button>
            </nav>
            {canManage && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="ml-auto flex items-center gap-1.5 text-[13px] bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
              >
                <Plus size={14} /> Mời thành viên
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Users size={15} className="text-slate-400" />
              <span className="text-[13px] font-semibold text-slate-600">{members.length} thành viên</span>
            </div>

            {members.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-slate-400 italic">Chưa có thành viên nào</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Owner first */}
                {currentProject?.owner && (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <UserAvatar name={currentProject.owner.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-800 truncate">{currentProject.owner.name}</span>
                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          <Crown size={9} /> Owner
                        </span>
                        {currentProject.owner.id === user?.id && (
                          <span className="text-[10px] text-slate-400">(Bạn)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-400">
                        <Mail size={11} /> {currentProject.owner.email}
                      </div>
                    </div>
                  </div>
                )}

                {/* Other members */}
                {members.filter((m) => m.user.id !== currentProject?.ownerId).map((member) => (
                  <div key={member.id} className="flex items-center gap-4 px-5 py-4 group">
                    <UserAvatar name={member.user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-slate-800 truncate">{member.user.name}</span>
                        <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${member.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                          {member.role === "ADMIN" ? <><Shield size={9} /> Admin</> : <><User2 size={9} /> Thành viên</>}
                        </span>
                        {member.user.id === user?.id && (
                          <span className="text-[10px] text-slate-400">(Bạn)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-400">
                        <Mail size={11} /> {member.user.email}
                      </div>
                    </div>

                    {/* Remove button */}
                    {canManage && member.user.id !== user?.id && (
                      <button
                        onClick={() => handleRemove(member.user.id, member.user.name)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Xoá khỏi dự án"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project info card */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 px-5 py-4">
            <h3 className="text-[13px] font-semibold text-slate-600 mb-3">Thông tin dự án</h3>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Tên dự án</span>
                <span className="text-slate-700 font-medium">{currentProject?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Mã dự án</span>
                <span className="font-mono font-bold text-indigo-600">{currentProject?.key}</span>
              </div>
              {currentProject?.description && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Mô tả</span>
                  <span className="text-slate-600">{currentProject.description}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Ngày tạo</span>
                <span className="text-slate-600">{currentProject?.createdAt ? new Date(currentProject.createdAt).toLocaleDateString("vi-VN") : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span className="font-semibold text-slate-800">Mời thành viên</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Địa chỉ email *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  autoFocus
                  className="w-full text-[14px] border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-300"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Vai trò</label>
                <div className="flex gap-3">
                  {(["MEMBER", "ADMIN"] as const).map((role) => (
                    <label key={role} className={`flex-1 flex items-center gap-2 px-4 py-2.5 border-2 rounded-xl cursor-pointer transition-colors ${inviteRole === role ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" name="role" value={role} checked={inviteRole === role} onChange={() => setInviteRole(role)} className="sr-only" />
                      {role === "ADMIN" ? <Shield size={14} className="text-indigo-500" /> : <User2 size={14} className="text-slate-400" />}
                      <div>
                        <div className="text-[13px] font-semibold text-slate-700">{role === "ADMIN" ? "Admin" : "Thành viên"}</div>
                        <div className="text-[11px] text-slate-400">{role === "ADMIN" ? "Toàn quyền quản lý" : "Xem & thực hiện công việc"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 text-[13px] border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">Huỷ</button>
                <button type="submit" disabled={isInviting} className="flex-1 py-2.5 text-[13px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {isInviting ? "Đang mời..." : "Gửi lời mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}