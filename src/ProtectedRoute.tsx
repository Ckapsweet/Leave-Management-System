import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, roleRequired }: any) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
}