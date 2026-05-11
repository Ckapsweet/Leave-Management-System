// services/authService.ts
import api from "./api";

import type { UserRole } from "./superAdminService";

export interface AuthUser {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  role: UserRole;
  supervisor_id?: number | null;
  email?: string | null;
  email_2?: string | null;
  phone?: string | null;
}

export async function login(employee_code: string, password: string): Promise<{ user: AuthUser }> {
  const res = await api.post("/api/auth/login", { employee_code, password });
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get("/api/auth/me");
  return res.data;
}

export async function updateProfile(data: {
  full_name: string;
  email?: string | null;
  email_2?: string | null;
  phone?: string | null;
}): Promise<AuthUser> {
  const res = await api.put("/api/auth/profile", data);
  return res.data;
}

export async function changePassword(data: { old_password: string; new_password: string }): Promise<{ message: string }> {
  const res = await api.post("/api/auth/change-password", data);
  return res.data;
}
