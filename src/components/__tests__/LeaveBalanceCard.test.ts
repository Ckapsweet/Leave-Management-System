import { describe, expect, it } from "vitest";
import { formatLeaveDays } from "../LeaveBalanceCard";

describe("formatLeaveDays", () => {
  it("formats whole days", () => {
    expect(formatLeaveDays(3)).toBe("3 วัน");
  });

  it("formats fractional days using 7.5 work hours per day", () => {
    expect(formatLeaveDays(1.59)).toBe("1 วัน 4 ชม. 26 นาที");
  });

  it("formats sub-day values", () => {
    expect(formatLeaveDays(0.5)).toBe("3 ชม. 45 นาที");
  });
});
