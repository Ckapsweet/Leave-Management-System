import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { calculateLateLeaveHours, calculateLeaveHours, formatLeaveHours, formatLeaveRemaining, leaveHoursToDays } from "../leaveTime";

describe("leaveTime", () => {
  it("rounds hourly leave up to the next half hour", () => {
    expect(calculateLeaveHours(dayjs("2026-03-01 08:00"), dayjs("2026-03-01 08:22"))).toBe(0.5);
    expect(calculateLeaveHours("08:00", "08:31")).toBe(1);
  });

  it("rounds late leave with the same half-hour rule", () => {
    expect(calculateLateLeaveHours(dayjs("2026-03-01 08:00"), dayjs("2026-03-01 08:22"))).toBe(0.5);
    expect(calculateLateLeaveHours("08:00", "08:31")).toBe(1);
  });

  it("formats decimal hours as hours and minutes", () => {
    expect(formatLeaveHours(0.5)).toBe("30 นาที");
    expect(formatLeaveHours(1.5)).toBe("1 ชั่วโมง 30 นาที");
    expect(formatLeaveHours(2)).toBe("2 ชั่วโมง");
  });

  it("converts hourly leave using 7.5 work hours per day", () => {
    expect(leaveHoursToDays(3.5)).toBe(0.47);
  });

  it("formats remaining leave using a 7.5-hour day", () => {
    expect(formatLeaveRemaining(5 + (7 / 7.5))).toBe("5 วัน 7 ชั่วโมง");
    expect(formatLeaveRemaining(0.5)).toBe("3 ชั่วโมง 45 นาที");
    expect(formatLeaveRemaining(1 / 15)).toBe("30 นาที");
  });
});
