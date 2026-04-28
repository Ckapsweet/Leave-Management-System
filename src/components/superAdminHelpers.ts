// components/superAdminHelpers.ts — shared types, constants, helpers for super admin pages
import type { UserRole } from "../services/superAdminService";

// ── Constants ──────────────────────────────────────────────────────────────────

export const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  "leave.approve": { label: "อนุมัติลา", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "✓" },
  "leave.reject": { label: "ปฏิเสธลา", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "✗" },
  "leave.create": { label: "ยื่นคำขอลา", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "+" },
  "leave.cancel": { label: "ยกเลิกคำขอ", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: "×" },
  "balance.update": { label: "แก้ไขวันลา", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: "✎" },
  "user.create": { label: "สร้าง user", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: "👤" },
  "user.delete": { label: "ลบ user", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "🗑" },
  "user.role_change": { label: "เปลี่ยน role", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "⚑" },
  "auth.login": { label: "เข้าสู่ระบบ", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: "→" },
  "auth.logout": { label: "ออกจากระบบ", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: "←" },
  "auth.login_failed": { label: "Login ล้มเหลว", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "!" },
};

export const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  hr: { label: "HR", color: "bg-violet-100 text-violet-700" },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700" },
  "assistant manager": { label: "Assistant Manager", color: "bg-indigo-100 text-indigo-700" },
  lead: { label: "Lead", color: "bg-emerald-100 text-emerald-700" },
  user: { label: "User", color: "bg-gray-100 text-gray-600" },
  admin: { label: "Admin", color: "bg-red-100 text-red-700" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function getActionMeta(action: string) {
  return ACTION_META[action] ?? {
    label: action, color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: "•",
  };
}
