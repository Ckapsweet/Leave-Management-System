// services/leaveService.ts
import api from "./api";
import type { Dayjs } from "dayjs";

// ── Types ─────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveUnit   = "day" | "hour";

export interface LeaveType {
  id:          number;
  name:        string;
  description: string;
  max_days:    number;
}

// Pool รวมของ user (ไม่แยกประเภท)
export interface LeavePool {
  id?:        number | null;
  user_id:    number;
  total_days: number;
  used_days:  number;
  remaining:  number;
  year:       number;
}

export interface LeaveRequest {
  id:             number;
  user_id:        number;
  leave_type_id:  number;
  start_date:     string;
  end_date:       string;
  start_time?:    string;
  end_time?:      string;
  leave_unit:     LeaveUnit;
  total_days:     number;
  total_hours?:   number | null;
  reason:         string;
  status:         LeaveStatus;
  approved_by?:   number;
  approved_at?:   string;
  created_at:     string;
  leave_type:     LeaveType;
  approver_name?: string;
  comment?:       string;
  user?: {
    id:            number;
    full_name:     string;
    employee_code: string;
    department:    string;
  };
}

export interface LeaveRequestPayload {
  leave_type_id: number;
  leave_unit:    LeaveUnit;
  start_date:    Dayjs | null;
  end_date:      Dayjs | null;
  start_time?:   Dayjs | null;
  end_time?:     Dayjs | null;
  reason:        string;
}

// ── Leave Types ───────────────────────────────────────────────

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const res = await api.get("/api/leave-types");
  return res.data;
}

// ── Leave Pool (user) — pool รวม ──────────────────────────────

export async function getLeavePool(year?: number): Promise<LeavePool> {
  const res = await api.get("/api/leave-balances", {
    params: { year: year ?? new Date().getFullYear() },
  });
  return res.data;
}

// ── Leave Requests (user) ─────────────────────────────────────

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  const res = await api.get("/api/leave-requests/my");
  return res.data;
}

export async function createLeaveRequest(payload: LeaveRequestPayload): Promise<LeaveRequest> {
  const isHour = payload.leave_unit === "hour";
  const total_hours = isHour && payload.start_time && payload.end_time
    ? Math.max(0, Math.round((payload.end_time.diff(payload.start_time, "minute") / 60) * 10) / 10)
    : null;

  const body: Record<string, unknown> = {
    leave_type_id: payload.leave_type_id,
    start_date:    payload.start_date?.format("YYYY-MM-DD"),
    end_date:      isHour
      ? payload.start_date?.format("YYYY-MM-DD")
      : payload.end_date?.format("YYYY-MM-DD"),
    reason:        payload.reason,
  };

  if (isHour) {
    body.start_time  = payload.start_time?.format("HH:mm") ?? null;
    body.end_time    = payload.end_time?.format("HH:mm") ?? null;
    body.total_hours = total_hours;
    body.total_days  = 0;
  } else {
    const days = payload.end_date && payload.start_date
      ? Math.max(1, payload.end_date.diff(payload.start_date, "day") + 1)
      : 1;
    body.total_days = days;
    body.start_time = null;
    body.end_time   = null;
  }

    console.log("[createLeaveRequest] body:", body);
    const res = await api.post("/api/leave-requests", body);
    console.log("[createLeaveRequest] response:", res.data);
  return res.data;
}

export async function cancelLeaveRequest(id: number): Promise<void> {
  await api.delete(`/api/leave-requests/${id}`);
}

// ── Admin ─────────────────────────────────────────────────────

export async function getAdminLeaveRequests(params?: {
  status?:  LeaveStatus;
  user_id?: number;
  year?:    number;
}): Promise<LeaveRequest[]> {
  const res = await api.get("/api/admin/leave-requests", { params });
  return res.data;
}

export async function approveLeaveRequest(id: number, comment?: string): Promise<void> {
  await api.patch(`/api/admin/leave-requests/${id}/approve`, { comment });
}

export async function rejectLeaveRequest(id: number, comment: string): Promise<void> {
  await api.patch(`/api/admin/leave-requests/${id}/reject`, { comment });
}

// ── Admin Leave Pool ──────────────────────────────────────────

export async function getAdminUserPool(userId: number, year?: number): Promise<LeavePool> {
  const res = await api.get(`/api/admin/leave-pool/${userId}`, {
    params: { year: year ?? new Date().getFullYear() },
  });
  return res.data;
}

export async function updateLeavePool(
  userId: number,
  remaining_days: number,
  year?: number
): Promise<LeavePool> {
  const res = await api.patch(`/api/admin/leave-pool/${userId}`, {
    remaining_days,
    year: year ?? new Date().getFullYear(),
  });
  return res.data;
}

// ── Report Types ──────────────────────────────────────────────

export interface MonthStat {
  month:      number;
  month_name: string;
  total_days: number;
  by_type:    Record<string, number>;
}

export interface MonthlyReport {
  year:   number;
  months: MonthStat[];
}

export interface YearStat {
  year:       number;
  total_days: number;
  by_type:    Record<string, number>;
}

// ── User Reports ──────────────────────────────────────────────

export async function getMyMonthlyReport(year?: number): Promise<MonthlyReport> {
  const res = await api.get("/api/leave-requests/report/monthly", {
    params: { year: year ?? new Date().getFullYear() },
  });
  return res.data;
}

export async function getMyYearlyReport(): Promise<YearStat[]> {
  const res = await api.get("/api/leave-requests/report/yearly");
  return res.data;
}

// ── Admin Reports ─────────────────────────────────────────────

export async function getAdminMonthlyReport(userId: number, year?: number): Promise<MonthlyReport> {
  const res = await api.get("/api/admin/reports/monthly", {
    params: { user_id: userId, year: year ?? new Date().getFullYear() },
  });
  return res.data;
}

export async function getAdminYearlyReport(userId: number): Promise<YearStat[]> {
  const res = await api.get("/api/admin/reports/yearly", {
    params: { user_id: userId },
  });
  return res.data;
}