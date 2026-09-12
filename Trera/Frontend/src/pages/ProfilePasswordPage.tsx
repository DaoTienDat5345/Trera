import { useState } from "react";
import { Link } from "react-router";
import { KeyRound, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/authStore";

export default function ProfilePasswordPage() {
  const { changePassword } = useAuthStore();

  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const getStrength = (pw: string) => {
    if (!pw) return 0;
    if (pw.length < 6) return 1;
    if (pw.length < 10) return 2;
    if (pw.length < 14) return 3;
    return 4;
  };
  const strength = getStrength(form.next);
  const strengthLabel = ["", "Yếu", "Trung bình", "Khá", "Mạnh"][strength];
  const strengthColor = ["", "text-red-500", "text-yellow-500", "text-blue-500", "text-emerald-600"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) { toast.error("Vui lòng điền đầy đủ các trường"); return; }
    if (form.next.length < 6) { toast.error("Mật khẩu mới phai co it nhat 6 ky tu"); return; }
    if (form.next !== form.confirm) { toast.error("Mat Kháu xac nhan chua khop"); return; }
    setSaving(true);
    const result = await changePassword(form.current, form.next);
    setSaving(false);
    if (result.success) {
      toast.success(result.message ?? "Đổi mật khẩu thành công!");
      setForm({ current: "", next: "", confirm: "" });
    } else {
      toast.error(result.message ?? "Đổi mật khẩu that bai");
    }
  };

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
            <span className="text-slate-600 font-medium">Đổi mật khẩu</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <KeyRound size={20} className="text-violet-600" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-slate-800">Đổi mật khẩu</h1>
              <p className="text-[12px] text-slate-400 mt-0.5">Thay Đổi mật khẩu de bao ve tai khoan cua ban</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Current password */}
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={show.current ? "text" : "password"}
                    value={form.current}
                    onChange={(e) => setForm({ ...form, current: e.target.value })}
                    placeholder="Nhap Mật khẩu hiện tại..."
                    className="w-full text-[14px] border border-slate-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-300"
                  />
                  <button type="button" onClick={() => setShow({ ...show, current: !show.current })} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-slate-100" />

              {/* New password */}
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">
                  Mật khẩu mới
                  {form.next && <span className={`ml-2 font-semibold ${strengthColor}`}>{strengthLabel}</span>}
                </label>
                <div className="relative">
                  <input
                    type={show.next ? "text" : "password"}
                    value={form.next}
                    onChange={(e) => setForm({ ...form, next: e.target.value })}
                    placeholder="Ít nhất 6 ký tự..."
                    className="w-full text-[14px] border border-slate-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-300"
                  />
                  <button type="button" onClick={() => setShow({ ...show, next: !show.next })} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show.next ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.next && (
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${lvl <= strength ? ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-emerald-500"][strength] : "bg-slate-100"}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="text-[12px] font-semibold text-slate-500 block mb-1.5">Xac nhan Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={show.confirm ? "text" : "password"}
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Nhap lai Mật khẩu mới..."
                    className={[
                      "w-full text-[14px] border rounded-xl px-4 py-3 pr-11 focus:outline-none text-slate-800 placeholder:text-slate-300",
                      form.confirm
                        ? form.next !== form.confirm ? "border-red-300 focus:border-red-400" : "border-emerald-300 focus:border-emerald-400"
                        : "border-slate-200 focus:border-indigo-400"
                    ].join(" ")}
                  />
                  <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {form.confirm && form.next === form.confirm && (
                    <Check size={14} className="absolute right-11 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
                {form.confirm && form.next !== form.confirm && (
                  <p className="text-[11px] text-red-500 mt-1.5">Mat Kháu xac nhan chua khop</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 text-[14px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><KeyRound size={15} /> Đổi mật khẩu</>
                )}
              </button>
            </div>
          </form>

          {/* Security tip */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
            <span className="text-amber-500 text-lg shrink-0">&#9432;</span>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Mat Kháu tot nen co it nhat 10 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet.
            </p>
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