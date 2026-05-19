import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
}));

vi.mock("../authService", () => ({
  logout: logoutMock,
}));

import { logoutAndRedirect, readStoredUser, writeStoredUser } from "../authSession";
import type { AuthUser } from "../authService";

const user: AuthUser = {
  id: 1,
  employee_code: "EMP001",
  full_name: "Test User",
  department: "IT",
  role: "user",
};

describe("authSession", () => {
  beforeEach(() => {
    localStorage.clear();
    logoutMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads and writes the stored user", () => {
    writeStoredUser(user);

    expect(readStoredUser()).toEqual(user);
  });

  it("removes broken stored user JSON and returns null", () => {
    localStorage.setItem("user", "{broken");

    expect(readStoredUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("logs out, clears session storage, and redirects to login", async () => {
    const navigate = vi.fn();
    localStorage.setItem("role", "admin");
    localStorage.setItem("user", JSON.stringify(user));

    await logoutAndRedirect(navigate);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("role")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
