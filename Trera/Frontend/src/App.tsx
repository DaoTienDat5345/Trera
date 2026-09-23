import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Notfound from "./pages/Notfound";
import { ProtectedRoute, PublicRoute } from "./components/common/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationStore";
import { connectSocket, disconnectSocket } from "./lib/socket";

import ProjectsPage from "./pages/ProjectsPage";
import ProjectBoardPage from "./pages/ProjectBoardPage";
import SprintBacklogPage from "./pages/SprintBacklogPage";
import ProjectMembersPage from "./pages/ProjectMembersPage";
import ProjectReportsPage from "./pages/ProjectReportsPage";
import ProjectActivityPage from "./pages/ProjectActivityPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import ProfilePasswordPage from "./pages/ProfilePasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import InvitationResponsePage from "./pages/InvitationResponsePage";
import TestRepositoryPage from "./pages/TestRepositoryPage";
import TestPlansPage from "./pages/TestPlansPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import AutomationPage from "./pages/AutomationPage";

function App() {
  const { token, checkAuth } = useAuthStore();
  const { addRealtimeNotification } = useNotificationStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (token) {
      const socket = connectSocket(token);
      const handleNewNotification = (data: any) => {
        addRealtimeNotification(data);
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    } else {
      disconnectSocket();
    }
  }, [token, addRealtimeNotification]);

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

          {/* Invitation Response - public, no auth required */}
          <Route path="/invitations/:token" element={<InvitationResponsePage />} />

          {/* Các route yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectBoardPage />} />
            <Route path="/projects/:id/sprints" element={<SprintBacklogPage />} />
            <Route path="/projects/:id/repository" element={<TestRepositoryPage />} />
            <Route path="/projects/:id/test-plans" element={<TestPlansPage />} />
            <Route path="/projects/:id/traceability" element={<TraceabilityPage />} />
            <Route path="/projects/:id/automation" element={<AutomationPage />} />
            <Route path="/projects/:id/members" element={<ProjectMembersPage />} />
            <Route path="/projects/:id/reports" element={<ProjectReportsPage />} />
            <Route path="/projects/:id/activity" element={<ProjectActivityPage />} />
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
