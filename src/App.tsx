// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import Dashboard from "./page/Dashboard";
import AdminDashboard from "./page/admin/AdminDashboard";
import SuperAdminDashboard from "./page/admin/SuperAdminDashboard";
import SystemSelectionPage from "./page/SystemSelectionPage";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Selection Page (หลังจาก login แล้ว) */}
        <Route
          path="/select-system"
          element={
            <ProtectedRoute requiredRole={["user", "manager", "hr"]}>
              <SystemSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* User (hr/admin/super_admin เข้าได้ด้วย ถ้าต้องการ) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["user", "manager", "hr"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredRole={["manager"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredRole={["hr"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}