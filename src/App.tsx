// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import Dashboard from "./page/Dashboard";
import AdminDashboard from "./page/admin/AdminDashboard";
import SystemSelectionPage from "./page/SystemSelectionPage";
import SuperAdminDashboard from "./page/admin/SuperAdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import OverviewDashboard from "./page/admin/OverviewDashboard";


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
            <ProtectedRoute requiredRole={["user", "lead", "assistant manager", "manager", "admin"]}>
              <SystemSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* User — พนักงานทั่วไปและระดับจัดการ (สำหรับการลาของตัวเอง) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["user", "lead", "assistant manager", "manager", "hr", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lead"
          element={
            <ProtectedRoute requiredRole={["lead"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Manager & Assistant Manager */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredRole={["manager", "assistant manager"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Global Admin (Overview & Reports) */}
        <Route
          path="/admin-reports"
          element={
            <ProtectedRoute requiredRole={["admin"]}>
              <OverviewDashboard />
            </ProtectedRoute>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}