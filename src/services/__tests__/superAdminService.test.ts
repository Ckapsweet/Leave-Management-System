import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import {
  changeUserRole,
  changeUserSupervisor,
  createUser,
  deleteUser,
  getAuditActions,
  getAuditLogs,
  getSuperAdminUsers,
  normalizeUserRole,
} from "../superAdminService";

describe("superAdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: { id: 1 } });
    mockPatch.mockResolvedValue({ data: undefined });
    mockDelete.mockResolvedValue({ data: undefined });
  });

  it("passes audit log filters to the API", async () => {
    await getAuditLogs({ action: "user.create", actor_id: 1, date_from: "2026-05-01", page: 2 });
    await getAuditActions();

    expect(mockGet).toHaveBeenCalledWith("/api/super-admin/audit-logs", {
      params: { action: "user.create", actor_id: 1, date_from: "2026-05-01", page: 2 },
    });
    expect(mockGet).toHaveBeenCalledWith("/api/super-admin/audit-logs/actions");
  });

  it("passes user filters and create user payloads to the API", async () => {
    const payload = {
      employee_code: "EMP100",
      full_name: "New User",
      department: "IT",
      password: "secret",
      role: "lead" as const,
    };

    await getSuperAdminUsers({ role: "lead", department: "IT", search: "EMP100" });
    await createUser(payload);

    expect(mockGet).toHaveBeenCalledWith("/api/super-admin/users", {
      params: { role: "lead", department: "IT", search: "EMP100" },
    });
    expect(mockPost).toHaveBeenCalledWith("/api/super-admin/users", payload);
  });

  it("normalizes display HR role to database hr before sending", async () => {
    const payload = {
      employee_code: "HR001",
      full_name: "HR User",
      department: "HR",
      password: "secret",
      role: "HR",
    };

    expect(normalizeUserRole("HR")).toBe("hr");

    await createUser(payload);
    await changeUserRole(5, "HR");

    expect(mockPost).toHaveBeenCalledWith("/api/super-admin/users", {
      ...payload,
      role: "hr",
    });
    expect(mockPatch).toHaveBeenCalledWith("/api/super-admin/users/5/role", { role: "hr" });
  });

  it("updates role, supervisor, and deletes users through the expected endpoints", async () => {
    await changeUserRole(5, "manager");
    await changeUserSupervisor(5, null);
    await deleteUser(5);

    expect(mockPatch).toHaveBeenCalledWith("/api/super-admin/users/5/role", { role: "manager" });
    expect(mockPatch).toHaveBeenCalledWith("/api/super-admin/users/5/supervisor", { supervisor_id: null });
    expect(mockDelete).toHaveBeenCalledWith("/api/super-admin/users/5");
  });
});
