import { describe, expect, it } from "vitest";
import { countLeaveRequestsByStatus, filterLeaveRequests, normalizeDepartment, uniqueLeaveRequestsById } from "../leaveFilters";
import type { LeaveRequest } from "../leaveService";

function request(overrides: Partial<LeaveRequest>): LeaveRequest {
  return {
    id: 1,
    user_id: 1,
    leave_type_id: 1,
    start_date: "2026-05-01",
    end_date: "2026-05-01",
    leave_unit: "day",
    total_days: 1,
    reason: "test",
    status: "pending",
    created_at: "2026-04-01T00:00:00Z",
    leave_type: { id: 1, name: "Annual", description: "", max_days: 10 },
    user: {
      id: 1,
      full_name: "สมชาย ใจดี",
      employee_code: "EMP001",
      department: "IT",
      role: "user",
      supervisor_id: null,
    },
    ...overrides,
  };
}

describe("leaveFilters", () => {
  it("filters leave requests by status, search, year, and month", () => {
    const requests = [
      request({ id: 1, status: "pending", start_date: "2026-05-12" }),
      request({ id: 2, status: "approved", start_date: "2026-05-13" }),
      request({ id: 3, status: "pending", start_date: "2025-05-12" }),
      request({
        id: 4,
        status: "pending",
        start_date: "2026-06-01",
        user: {
          id: 4,
          full_name: "มานะ",
          employee_code: "EMP004",
          department: "HR",
          role: "user",
          supervisor_id: null,
        },
      }),
    ];

    expect(
      filterLeaveRequests(requests, {
        status: "pending",
        search: "EMP001",
        viewMode: "monthly",
        year: 2026,
        month: 5,
      }).map((item) => item.id)
    ).toEqual([1]);
  });

  it("counts requests by status", () => {
    expect(
      countLeaveRequestsByStatus([
        request({ id: 1, status: "pending" }),
        request({ id: 2, status: "approved" }),
        request({ id: 3, status: "approved" }),
        request({ id: 4, status: "rejected" }),
      ])
    ).toEqual({ pending: 1, approved: 2, rejected: 1 });
  });

  it("deduplicates requests by id before filtering and counting", () => {
    const requests = [
      request({ id: 1, status: "pending" }),
      request({ id: 1, status: "pending" }),
      request({ id: 2, status: "approved" }),
    ];

    expect(uniqueLeaveRequestsById(requests)).toHaveLength(2);
    expect(filterLeaveRequests(requests, { status: "pending" })).toHaveLength(1);
    expect(countLeaveRequestsByStatus(requests)).toEqual({ pending: 1, approved: 1, rejected: 0 });
  });

  it("normalizes blank department values", () => {
    expect(normalizeDepartment(" HR ")).toBe("HR");
    expect(normalizeDepartment(null)).toBe("");
  });
});
