import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import type { User } from "../store/authStore";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuthStore();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      if (error === "google_not_configured") {
        toast.error("Tính năng Google Login chưa được cấu hình Client ID / Secret trên backend.");
      } else {
        toast.error("Đăng nhập với Google thất bại. Vui lòng thử lại.");
      }
      navigate("/login", { replace: true });
      return;
    }

    if (!token || !userRaw) {
      toast.error("Không nhận được dữ liệu xác thực từ Google.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user: User = JSON.parse(decodeURIComponent(userRaw));
      setAuthData(user, token);
      toast.success(`Chào mừng ${user.name}! Đăng nhập Google thành công.`);
      navigate("/projects", { replace: true });
    } catch (err) {
      console.error("Lỗi parse thông tin user:", err);
      toast.error("Dữ liệu người dùng không hợp lệ.");
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, setAuthData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-sm w-full flex flex-col items-center text-center">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 mb-1">Đang xác thực với Google</h2>
        <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát trong khi chúng tôi hoàn tất đăng nhập...</p>
      </div>
    </div>
  );
}