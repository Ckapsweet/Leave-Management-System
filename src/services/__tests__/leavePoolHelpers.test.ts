import { describe, expect, it } from "vitest";
import { deriveLeavePoolFromRequests } from "../leavePoolHelpers";
import type { LeavePool, LeaveRequest } from "../leaveService";

const pool: LeavePool = {
  user_id: 7,
  total_days: 3,
  used_days: 0.47,
  remaining: 2.53,
  year: 2026,
  balances: [
    {
      leave_type_id: 2,
      name: "Personal",
      total_days: 3,
      used_days: 0.47,
      remaining: 2.53,
    },
  ],
};

const hourlyRequest: LeaveRequest = {
  id: 101,
  user_id: 7,
  leave_type_id: 2,
  start_date: "2026-05-13",
  end_date: "2026-05-13",
  start_time: "08:00",
  end_time: "11:30",
  leave_unit: "hour",
  request_type: "leave",
  total_days: 0.47,
  total_hours: 3.5,
  reason: "test",
  status: "approved",
  created_at: "2026-05-13T01:00:00.000Z",
  leave_type: {
    id: 2,
    name: "Personal",
    description: "Personal leave",
    max_days: 3,
  },
};

describe("deriveLeavePoolFromRequests", () => {
  it("uses exact total_hours for hourly leave instead of rounded stored days", () => {
    const result = deriveLeavePoolFromRequests(pool, [hourlyRequest], 2026);

    expect(result?.used_days).toBe(3.5 / 8);
    expect(result?.remaining).toBe(3 - 3.5 / 8);
    expect(result?.balances?.[0].used_days).toBe(3.5 / 8);
    expect(result?.balances?.[0].remaining).toBe(3 - 3.5 / 8);
  });
});
