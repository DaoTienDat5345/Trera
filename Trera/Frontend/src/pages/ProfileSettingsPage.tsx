import { useState } from "react";
import { Link } from "react-router";
import { User2, Edit2, Check, X, Mail, Calendar, ShieldCheck, ArrowLeft, Hash } from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import UserAvatar from "../components/common/UserAvatar";
import { useAuthStore } from "../store/authStore";

export default function ProfileSettingsPage() {
  const { user, updateName } = useAuthStore();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nameValue.trim()) { toast.error("Tên không được để trống"); return; }
    if (nameValue.trim() === user?.name) { setEditingName(false); return; }
    setSaving(true);
    const result = await updateName(nameValue.trim());
    setSaving(false);
    if (result.success) { toast.success("Da cap nhat Tên hiển thị"); setEditingName(false); }
    else toast.error(result.message ?? "Cập nhật thất bại");
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 py-8">
        <div className="max-w-xl mx-auto flex flex-col gap-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400">
            <Link to="/projects" className="hover:text-slate-600 flex items-center gap-1"><ArrowLeft size={11} /> Dự án</Link>
            <span>/</span>
            <Link to="/profile" className="hover:text-slate-600">Hồ sơ cá nhân</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Thông tin tài khoản</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <User2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-slate-800">Thông tin tài khoản</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Quản lý thông tin cá nhân của bạn</p>
            </div>
          </div>

          {/* Avatar + name edit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
              <UserAvatar name={user?.name ?? "?"} avatar={user?.avatar} size="lg" />
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") { setEditingName(false); setNameValue(user?.name ?? ""); }
                      }}
                      autoFocus
                      className="flex-1 text-[18px] font-bold text-slate-800 border-b-2 border-indigo-400 bg-transparent outline-none"
                    />
                    <button onClick={handleSave} disabled={saving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-60">
                      {saving ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameValue(user?.name ?? ""); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-slate-800">{user?.name}</span>
                    <button onClick={() => setEditingName(true)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Chỉnh sửa tên">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mt-1">
                  <Mail size={12} /> {user?.email}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-0">
              {[
                { icon: <Mail size={14} />, label: "Email", value: <span className="text-[13px] text-slate-700">{user?.email}</span> },
                {
                  icon: <User2 size={14} />, label: "Tên hiển thị",
                  value: (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-slate-700 font-medium">{user?.name}</span>
                      <button onClick={() => setEditingName(true)} className="text-[11px] text-indigo-500 hover:underline">Sửa</button>
                    </div>
                  )
                },
                { icon: <Calendar size={14} />, label: "Ngày tham gia", value: <span className="text-[13px] text-slate-600">{joinedDate ?? "---"}</span> },
                {
                  icon: <ShieldCheck size={14} />, label: "Trạng thái",
                  value: <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium"><ShieldCheck size={13} /> Đã xác thực</span>
                },
              ].map((row, i, arr) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <div className="flex items-center gap-2 text-slate-400 text-[12px] font-medium min-w-[130px]">
                    {row.icon} {row.label}
                  </div>
                  <div className="flex-1 text-right">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Back */}
          <Link to="/profile" className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft size={14} /> Quay lai Hồ sơ cá nhân
          </Link>

        </div>
      </div>
    </div>
  );
}