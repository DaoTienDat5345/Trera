import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Notfound from "./pages/Notfound";
import { ProtectedRoute, PublicRoute } from "./components/common/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          {/* Trang giới thiệu (Introduce) */}
          <Route path="/" element={<LandingPage />} />

          {/* Trang Đăng nhập & Đăng ký (chuyển hướng vào /projects nếu đã đăng nhập) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthPage initialMode="login" />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AuthPage initialMode="register" />
              </PublicRoute>
            }
          />

          {/* Các route yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<div className="p-8 text-center">Dashboard Dự án (Đang xây dựng)</div>} />
            <Route path="/projects/:id" element={<div className="p-8 text-center">Kanban Board (Đang xây dựng)</div>} />
          </Route>

          {/* 404 Not Found */}
          <Route path="/404" element={<Notfound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
