import type { NavigateFunction } from "react-router";
import { logout } from "./authService";
import type { AuthUser } from "./authService";

export function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem("user");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function writeStoredUser(user: AuthUser) {
  localStorage.setItem("user", JSON.stringify(user));
}

export async function logoutAndRedirect(navigate: NavigateFunction) {
  await logout();
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  navigate("/", { replace: true });
}
