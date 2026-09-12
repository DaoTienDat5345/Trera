import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Notfound from "./pages/Notfound";
import { ProtectedRoute, PublicRoute } from "./components/common/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

import ProjectsPage from "./pages/ProjectsPage";
import ProjectBoardPage from "./pages/ProjectBoardPage";
import SprintBacklogPage from "./pages/SprintBacklogPage";
import ProjectMembersPage from "./pages/ProjectMembersPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import ProfilePasswordPage from "./pages/ProfilePasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

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
          {/* Trang giới thiệu */}
          <Route path="/" element={<LandingPage />} />

          {/* Trang Đăng nhập & Đăng ký */}
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

          {/* OAuth Callback */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Các route yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectBoardPage />} />
            <Route path="/projects/:id/sprints" element={<SprintBacklogPage />} />
            <Route path="/projects/:id/members" element={<ProjectMembersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/settings" element={<ProfileSettingsPage />} />
            <Route path="/profile/password" element={<ProfilePasswordPage />} />
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
