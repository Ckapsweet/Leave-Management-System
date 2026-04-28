// components/adminHelpers.ts — shared types, constants, helpers for admin pages
import type { LeaveStatus, LeavePool } from "../services/leaveService";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  role: string;
  supervisor_id?: number | null;
}

export interface EmployeeWithBalance extends Employee {
  pool: LeavePool | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const STATUS_META: Record<
  LeaveStatus,
  { label: string; color: string; bg: string; dot: string; icon: string }
> = {
  pending: { label: "รออนุมัติ", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: "⏳" },
  approved: { label: "อนุมัติแล้ว", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", icon: "✓" },
  rejected: { label: "ปฏิเสธ", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-400", icon: "✗" },
};

export const TYPE_COLORS: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-orange-100 text-orange-700",
};

const COLORS_PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function avatarColor(dept = "") {
  if (!dept) return "bg-gray-100 text-gray-600";
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS_PALETTE[Math.abs(hash) % COLORS_PALETTE.length];
}
