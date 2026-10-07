// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import LoginPage from "./page/LoginPage";
import Dashboard from "./page/Dashboard";
import LeadDashboard from "./page/admin/LeadDashboard";
import SystemSelectionPage from "./page/SystemSelectionPage";
import ManagerDashboard from "./page/admin/ManagerDashboard";
import ProtectedRoute from "./ProtectedRoute";
import OverviewDashboard from "./page/admin/OverviewDashboard";
import HrDashboard from "./page/admin/HrDashboard";


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
            <ProtectedRoute requiredRole={["user", "lead", "assistant manager", "manager", "hr", "admin"]}>
              <SystemSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* User — พนักงานทั่วไปและระดับจัดการ (สำหรับการลาของตัวเอง) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["user", "lead", "assistant manager", "manager", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lead"
          element={
            <ProtectedRoute requiredRole={["lead"]}>
              <LeadDashboard />
            </ProtectedRoute>
          }
        />

        {/* Manager & Assistant Manager */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute requiredRole={["manager", "assistant manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr"
          element={
            <ProtectedRoute requiredRole={["hr"]}>
              <HrDashboard />
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
