// services/authService.ts
import api from "./api";

export interface AuthUser {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  role: "user" | "manager" | "hr";
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