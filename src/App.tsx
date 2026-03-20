// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage         from "./page/LoginPage";
import Dashboard         from "./page/Dashboard";
import AdminDashboard    from "./page/admin/AdminDashboard";
import ProtectedRoute    from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* User only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}