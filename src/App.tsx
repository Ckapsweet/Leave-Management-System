import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import Dashboard from "./page/Dashboard";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
      </Routes>
    </BrowserRouter>
  );
}