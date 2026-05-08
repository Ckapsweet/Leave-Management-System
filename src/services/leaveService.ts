// services/leaveService.ts
import api from "./api";
import type { Dayjs } from "dayjs";
import type { UserRole } from "./superAdminService";
import { calculateLeaveHours } from "./leaveTime";

// ── Types ─────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveUnit   = "day" | "hour";
export type RequestKind = "leave" | "late";

export interface LeaveType {
  id:          number;
  name:        string;
  description: string;
  max_days:    number;
}

// Pool รวมของ user (ไม่แยกประเภท)
export interface LeaveBalance {
  leave_type_id: number;
  name:          string;
  total_days:    number;
  used_days:     number;
  remaining:     number;
}

export interface LeavePool {
  id?:        number | null;
  user_id:    number;
  total_days: number;
  used_days:  number;
  remaining:  number;
  year:       number;
  balances?:  LeaveBalance[];
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
  request_type?:   RequestKind;
  total_days:     number;
  total_hours?:   number | null;
  reason:         string;
  status:         LeaveStatus;
  approved_by?:   number;
  approved_at?:   string;
  current_assignee_id?: number | null;
  created_at:     string;
  leave_type:     LeaveType;
  approver_name?: string;
  comment?:       string;
  attachments?:   LeaveAttachment[];
  attachment_urls?: string[];
  user?: {
    id:            number;
    full_name:     string;
    employee_code: string;
    department:    string;
    role:          UserRole;
    supervisor_id: number | null;
    email?:        string | null;
    email_2?:      string | null;
    phone?:        string | null;
  };
}

export interface LeaveAttachment {
  id?: number | string;
  name?: string;
  file_name?: string;
  original_name?: string;
  filename?: string;
  url?: string;
  file_url?: string;
  download_url?: string;
  path?: string;
  mime_type?: string;
  size?: number | string | null;
}

// ✅ LeaveRequestPayload ใช้ string แทน Dayjs เพื่อให้ตรงกับ LeaveRequestForm จาก Modal
export interface LeaveRequestPayload {
  leave_type_id: number;
  leave_unit:    LeaveUnit;
  request_type?:  RequestKind;
  start_date:    string;
  end_date:      string;
  start_time?:   Dayjs | null;
  end_time?:     Dayjs | null;
  reason:        string;
  attachments?:   File[];
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

// ✅ รับ LeaveRequestPayload ที่ start_date/end_date เป็น string แล้ว
export async function getTodayLeaves(): Promise<LeaveRequest[]> {
  const res = await api.get("/api/leave-requests/today");
  return res.data;
}

export async function getThisWeekLeaves(): Promise<LeaveRequest[]> {
  const res = await api.get("/api/leave-requests/week");
  return res.data;
}

export async function createLeaveRequest(payload: LeaveRequestPayload): Promise<LeaveRequest> {
  const isHour = payload.leave_unit === "hour";
  const request_type = payload.request_type ?? "leave";
  const hasAttachments = (payload.attachments?.length ?? 0) > 0;

  // คำนวณ total_hours จาก Dayjs start_time/end_time
  const total_hours = isHour && payload.start_time && payload.end_time
    ? calculateLeaveHours(payload.start_time, payload.end_time)
    : null;

  // คำนวณ total_days จาก string start_date/end_date
  const total_days = isHour
    ? 0
    : (() => {
        const from = new Date(payload.start_date).getTime();
        const to   = new Date(payload.end_date).getTime();
        return Math.max(1, Math.ceil((to - from) / 86_400_000) + 1);
      })();

  const body: Record<string, unknown> = {
    leave_type_id: payload.leave_type_id,
    start_date:    payload.start_date,
    end_date:      isHour ? payload.start_date : payload.end_date,
    reason:        payload.reason,
    total_days,
    request_type,
    start_time:    isHour && payload.start_time?.isValid() ? payload.start_time.format("HH:mm") : null,
    end_time:      isHour && payload.end_time?.isValid()   ? payload.end_time.format("HH:mm")   : null,
    total_hours:   isHour ? total_hours : null,
  };

  const requestBody = hasAttachments
    ? (() => {
        const formData = new FormData();
        Object.entries(body).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          formData.append(key, String(value));
        });
        payload.attachments?.forEach((file) => formData.append("attachments", file));
        return formData;
      })()
    : body;

  const res = await api.post("/api/leave-requests", requestBody);
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

export async function approveLeaveRequest(id: number, comment?: string): Promise<{ status: LeaveStatus, current_assignee_id: number | null }> {
  const res = await api.patch(`/api/admin/leave-requests/${id}/approve`, { comment });
  return res.data;
}

export async function rejectLeaveRequest(id: number, comment: string): Promise<{ status: LeaveStatus, current_assignee_id: number | null }> {
  const res = await api.patch(`/api/admin/leave-requests/${id}/reject`, { comment });
  return res.data;
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
  balances: { leave_type_id: number; total_days: number }[],
  year?: number
): Promise<LeavePool> {
  const res = await api.patch(`/api/admin/leave-pool/${userId}`, {
    balances,
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
