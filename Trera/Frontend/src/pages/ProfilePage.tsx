import { Link } from "react-router";
import { User2, KeyRound, ChevronRight, Mail, Calendar, ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import Navbar from "../components/layout/Navbar";
import UserAvatar from "../components/common/UserAvatar";
import { useAuthStore } from "../store/authStore";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const handleLogout = () => {
    if (confirm("Ban chac chan muon Đăng xuất?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 px-4 py-8">
        <div className="max-w-xl mx-auto flex flex-col gap-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1">
              <ArrowLeft size={11} /> Dự án
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Hồ sơ cá nhân</span>
          </div>

          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
            <UserAvatar name={user?.name ?? "?"} avatar={user?.avatar} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-800 truncate mb-1">{user?.name}</h1>
              <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-1.5">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              {joinedDate && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
                  <Calendar size={12} className="shrink-0" />
                  <span>Tham gia từ {joinedDate}</span>
                </div>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-medium shrink-0">
              <ShieldCheck size={12} />
              Đã xác thực
            </span>
          </div>

          {/* Menu cards */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Quản lý tài khoản</p>

            {/* Account settings card */}
            <Link
              to="/profile/settings"
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <User2 size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-800">Thông tin tài khoản</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Cap nhat Tên hiển thị va xem thong tin ca nhan</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
            </Link>

            {/* Change password card */}
            <Link
              to="/profile/password"
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                <KeyRound size={20} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-800">Đổi mật khẩu</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Thay Đổi mật khẩu de bao ve tai khoan cua ban</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
            </Link>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-4 hover:bg-red-50 transition-colors group text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                <LogOut size={20} className="text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-red-600">Đăng xuất</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Kết thúc phiên làm việc hiện tại</p>
              </div>
              <ChevronRight size={18} className="text-red-200 group-hover:text-red-400 transition-colors shrink-0" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}