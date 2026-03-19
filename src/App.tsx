import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import UserDashboard from "./page/users/Dashboard";
import HRDashboard from "./page/admin/AdminDashboard";
import Login from "./page/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* USER */}
        <Route
          path="/"
          element={
            <ProtectedRoute roleRequired="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* HR */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute roleRequired="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}