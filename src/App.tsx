// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import Dashboard from "./page/Dashboard";
import AdminDashboard from "./page/admin/AdminDashboard";
import SystemSelectionPage from "./page/SystemSelectionPage";
import SuperAdminDashboard from "./page/admin/SuperAdminDashboard";
import ProtectedRoute from "./ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Selection Page (ทุก role เข้าได้หลัง login) */}
        <Route
          path="/select-system"
          element={
            <ProtectedRoute requiredRole={["user", "lead", "manager"]}>
              <SystemSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* User — พนักงานทั่วไป */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["user"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Lead — หัวหน้าทีม (ใช้ AdminDashboard เดียวกับ manager) */}
        <Route
          path="/lead"
          element={
            <ProtectedRoute requiredRole={["lead"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Manager — ผู้จัดการ */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredRole={["manager"]}>
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