// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage            from "./page/LoginPage";
import Dashboard            from "./page/Dashboard";
import AdminDashboard       from "./page/admin/AdminDashboard";
import SuperAdminDashboard  from "./page/admin/SuperAdminDashboard";
import ProtectedRoute       from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* User (hr/admin/super_admin เข้าได้ด้วย ถ้าต้องการ) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole={["user", "hr", "admin", "super_admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Super Admin */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole={["super_admin"]}>
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