import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AdminReportWidget } from "../AdminReportWidget";
import type { LeaveRequest } from "../../services/leaveService";
import type { EmployeeWithBalance } from "../adminHelpers";

const leaveType = { id: 1, name: "Annual", description: "", max_days: 10 };

function makeRequest(overrides: Partial<LeaveRequest>): LeaveRequest {
  return {
    id: 1,
    user_id: 1,
    leave_type_id: 1,
    start_date: "2026-05-18",
    end_date: "2026-05-18",
    leave_unit: "day",
    request_type: "leave",
    total_days: 1,
    total_hours: null,
    reason: "Test",
    status: "approved",
    created_at: "2026-05-18T01:00:00.000Z",
    leave_type: leaveType,
    user: {
      id: 1,
      employee_code: "EMP001",
      full_name: "Leave User",
      department: "IT",
      role: "user",
      supervisor_id: 9,
    },
    ...overrides,
  };
}

const employees: EmployeeWithBalance[] = [
  {
    id: 1,
    employee_code: "EMP001",
    full_name: "Leave User",
    department: "IT",
    role: "user",
    supervisor_id: 9,
    pool: {
      user_id: 1,
      total_days: 10,
      used_days: 8,
      remaining: 2,
      year: 2026,
      balances: [{ leave_type_id: 1, name: "Annual", total_days: 10, used_days: 8, remaining: 2 }],
    },
  },
  {
    id: 9,
    employee_code: "LEAD001",
    full_name: "Team Lead",
    department: "IT",
    role: "lead",
    supervisor_id: null,
    pool: null,
  },
];

describe("AdminReportWidget", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("summarizes employees, approved leave usage, pending requests, and low balances", () => {
    render(
      <AdminReportWidget
        employees={employees}
        requests={[
          makeRequest({ id: 1, total_days: 1 }),
          makeRequest({
            id: 2,
            status: "pending",
            created_at: "2026-05-14T01:00:00.000Z",
            reason: "Pending",
          }),
          makeRequest({
            id: 3,
            leave_unit: "hour",
            total_days: 0,
            total_hours: 3.75,
            reason: "Half day",
          }),
        ]}
      />
    );

    expect(screen.getByText("2", { selector: ".text-3xl" })).toBeInTheDocument();
    expect(screen.getAllByText("1.47 วัน").length).toBeGreaterThan(0);
    expect(screen.getByText("1 pending")).toBeInTheDocument();
    expect(screen.getAllByText("Leave User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Annual").length).toBeGreaterThan(0);
  });

  it("counts today, tomorrow, and week leave windows from approved requests", () => {
    render(
      <AdminReportWidget
        employees={employees}
        requests={[
          makeRequest({ id: 1, start_date: "2026-05-18", end_date: "2026-05-18" }),
          makeRequest({ id: 2, start_date: "2026-05-19", end_date: "2026-05-19" }),
          makeRequest({ id: 3, start_date: "2026-05-23", end_date: "2026-05-23" }),
        ]}
      />
    );

    const dateSummary = screen
      .getByRole("heading", { name: "คนลาวันนี้ / พรุ่งนี้ / สัปดาห์นี้" })
      .closest("section") as HTMLElement;
    expect(within(dateSummary).getAllByText("1")).toHaveLength(2);
    expect(within(dateSummary).getByText("3")).toBeInTheDocument();
  });
});
