// services/superAdminService.ts
import api from "./api";

// ── Types ─────────────────────────────────────────────────────

export type AuditAction =
  | "leave.create" | "leave.cancel"
  | "leave.approve" | "leave.reject"
  | "balance.update"
  | "user.create" | "user.update"
  | "user.delete" | "user.role_change"
  | "auth.login" | "auth.logout" | "auth.login_failed";

export interface AuditLog {
  id: number;
  created_at: string;
  action: AuditAction | string;
  target_type: string | null;
  target_id: number | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  note: string | null;
  ip_address: string | null;
  actor_id: number;
  actor_role: string;
  actor_name: string;
  actor_code: string;
  actor_dept: string | null;
}

export interface AuditLogPagination {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type UserRole = "user" | "lead" | "assistant manager" | "manager" | "hr";

export interface SuperAdminUser {
  id: number;
  employee_code: string;
  full_name: string;
  department: string | null;
  role: UserRole;
  supervisor_id: number | null;
  created_at: string;
}

// ── Audit Logs ────────────────────────────────────────────────

export interface AuditLogParams {
  action?: string;
  actor_id?: number;
  target_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(params?: AuditLogParams): Promise<AuditLogPagination> {
  const res = await api.get("/api/super-admin/audit-logs", { params });
  return res.data;
}

export async function getAuditActions(): Promise<string[]> {
  const res = await api.get("/api/super-admin/audit-logs/actions");
  return res.data;
}

// ── User Management ───────────────────────────────────────────

export async function getSuperAdminUsers(params?: {
  role?: string;
  department?: string;
  search?: string;
}): Promise<SuperAdminUser[]> {
  const res = await api.get("/api/super-admin/users", { params });
  return res.data;
}

export async function createUser(payload: {
  employee_code: string;
  full_name: string;
  department?: string;
  password: string;
  role: UserRole;
}): Promise<SuperAdminUser> {
  const res = await api.post("/api/super-admin/users", payload);
  return res.data;
}export async function changeUserRole(id: number, role: UserRole): Promise<void> {
  await api.patch(`/api/super-admin/users/${id}/role`, { role });
}

export async function changeUserSupervisor(id: number, supervisor_id: number | null): Promise<void> {
  await api.patch(`/api/super-admin/users/${id}/supervisor`, { supervisor_id });
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/super-admin/users/${id}`);
}