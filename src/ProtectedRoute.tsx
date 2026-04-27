// ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type Role = "user" | "lead" | "assistant manager" | "manager" | "hr" | "admin";

type Props = {
  children: ReactNode;
  requiredRole?: Role | Role[];   // รับได้ทั้ง string เดียวและ array
};

// ── หมายเหตุ ──────────────────────────────────────────────────
// role ใน localStorage ใช้เพื่อ redirect เท่านั้น
// ความปลอดภัยจริงอยู่ที่ httpOnly cookie + backend middleware
// ถ้าใครแก้ role ใน localStorage ก็จะเข้าหน้าได้ แต่ทุก API call
// จะ return 401/403 เพราะ cookie ไม่มี / role ไม่ตรง

function roleToPath(role: string): string {
  if (role === "lead") return "/lead";
  if (role === "assistant manager") return "/manager";
  if (role === "manager") return "/manager";
  if (role === "admin") return "/admin-reports";
  return "/dashboard";            // user → /dashboard
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const role = localStorage.getItem("role");

  if (!role || role === "undefined") return <Navigate to="/" replace />;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role as Role)) {
      return <Navigate to={roleToPath(role)} replace />;
    }
  }

  return <>{children}</>;
}