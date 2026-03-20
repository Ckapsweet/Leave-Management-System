// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  children:      ReactNode;
  requiredRole?: "admin" | "user";
};

// ── หมายเหตุ ──────────────────────────────────────────────────
// role ใน localStorage ใช้เพื่อ redirect เท่านั้น
// ความปลอดภัยจริงอยู่ที่ httpOnly cookie + backend middleware
// ถ้าใครแก้ role ใน localStorage ก็จะเข้าหน้าได้ แต่ทุก API call
// จะ return 401/403 เพราะ cookie ไม่มี / role ไม่ตรง

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const role = localStorage.getItem("role");

  // ไม่มี role = ยังไม่ได้ login
  if (!role) return <Navigate to="/" replace />;

  // มี requiredRole และ role ไม่ตรง → redirect ไปหน้าที่ควรอยู่
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}