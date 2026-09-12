import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Kanban, ArrowLeft, Loader2, CheckCircle2, Lock, Mail, User as UserIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

interface AuthPageProps {
  initialMode?: "login" | "register";
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = "login" }) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "google_not_configured") {
      toast.error("Google OAuth chưa được cấu hình Client ID / Secret trong file .env trên backend.");
    } else if (error === "google_failed") {
      toast.error("Xác thực với Google thất bại. Vui lòng thử lại.");
    }
  }, [searchParams]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        toast.error("Vui lòng nhập họ và tên của bạn.");
        return;
      }
      if (password.length < 6) {
        toast.error("Mật khẩu phải chứa ít nhất 6 ký tự.");
        return;
      }

      const res = await register(name, email, password);
      if (res.success) {
        toast.success("Đăng ký tài khoản thành công! Chào mừng bạn đến với Trera.");
        navigate("/projects");
      } else {
        toast.error(res.message);
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        toast.success("Đăng nhập thành công!");
        navigate("/projects");
      } else {
        toast.error(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* ─── CỘT TRÁI: BRAND BANNER (DESKTOP) ─────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white relative">
          {/* Top Logo */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 text-white mb-8 group">
              <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Kanban className="size-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Trera<span className="text-indigo-300">.</span>
              </span>
            </Link>

            <h2 className="text-2xl font-extrabold tracking-tight leading-snug mb-4">
              Không gian quản lý công việc và phát triển dự án Agile.
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed font-normal mb-8">
              Tham gia cùng hàng nghìn thành viên đang tối ưu hoá năng suất làm việc mỗi ngày với Trera.
            </p>

            <div className="space-y-3.5 text-sm text-indigo-50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Bảng kéo thả Kanban trực quan, mượt mà</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Quản lý Sprint và chuyển task Backlog tự động</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span>Gửi email thông báo cập nhật tiến độ tức thì</span>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof */}
          <div className="pt-8 border-t border-indigo-500/40">
            <p className="text-xs text-indigo-200 italic">
              "Trera mang đến sự tinh gọn và kỷ luật cần thiết của Jira nhưng với tốc độ cực kỳ nhanh chóng."
            </p>
          </div>
        </div>

        {/* ─── CỘT PHẢI: AUTH FORM ──────────────────────────────────────── */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Back button */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Quay lại trang chủ
              </Link>
              <div className="lg:hidden flex items-center gap-2">
                <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Kanban className="size-4" />
                </div>
                <span className="font-bold text-base text-slate-900">Trera</span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-8">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đăng ký tài khoản
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản Trera"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {mode === "login"
                  ? "Nhập email và mật khẩu của bạn để tiếp tục."
                  : "Bắt đầu trải nghiệm quản lý công việc chuyên nghiệp."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Họ và tên</label>
                  <div className="relative">
                    <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 border-slate-200 focus:border-indigo-600 focus:ring-indigo-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 border-slate-200 focus:border-indigo-600 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  {mode === "login" && (
                    <span className="text-xs text-indigo-600 hover:underline cursor-pointer">
                      Quên mật khẩu?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-11 border-slate-200 focus:border-indigo-600 focus:ring-indigo-600"
                    required
                  />
                </div>
                {mode === "register" && (
                  <p className="text-[11px] text-slate-500">Tối thiểu 6 ký tự</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-200 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </div>
                ) : mode === "login" ? (
                  "Đăng nhập"
                ) : (
                  "Tạo tài khoản miễn phí"
                )}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                  Hoặc
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => {
                window.location.href = "http://localhost:5001/api/auth/google";
              }}
              className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}</span>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {mode === "login" ? (
              <span>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </span>
            ) : (
              <span>
                Đã có tài khoản Trera?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Đăng nhập
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
