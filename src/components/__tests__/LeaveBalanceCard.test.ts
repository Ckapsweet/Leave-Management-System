import { describe, expect, it } from "vitest";
import { formatLeaveDays, formatLeaveUsage } from "../LeaveBalanceCard";

describe("leave balance formatting", () => {
  it("formats whole days", () => {
    expect(formatLeaveDays(3)).toBe("3 วัน");
  });

  it("formats fractional day units as day decimals", () => {
    expect(formatLeaveDays(0.5)).toBe("0.5 วัน");
    expect(formatLeaveDays(1.59)).toBe("1.59 วัน");
  });

  it("formats mixed day units and hourly leave", () => {
    expect(formatLeaveUsage(4.97, 4.5, 3.5)).toBe("4.5 วัน 3 ชั่วโมง 30 นาที");
  });
});
