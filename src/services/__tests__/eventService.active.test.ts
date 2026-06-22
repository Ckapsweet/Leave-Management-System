import { describe, expect, it } from "vitest";
import { isWorkEventActive, type WorkEvent } from "../eventService";

function event(overrides: Partial<WorkEvent> = {}): WorkEvent {
  return {
    id: 1,
    title: "Event",
    description: null,
    start_date: "2026-06-22",
    end_date: "2026-06-22",
    created_by: 1,
    lead_id: 2,
    department: "IT",
    created_at: "2026-06-01T00:00:00Z",
    participants: [],
    attendance_days: [{
      event_id: 1,
      event_date: "2026-06-22",
      check_in_time: "08:30:00",
      check_out_time: "18:45:00",
      check_in_at: null,
      check_out_at: null,
    }],
    ...overrides,
  };
}

describe("isWorkEventActive", () => {
  it("keeps an event visible until its final checkout time", () => {
    expect(isWorkEventActive(event(), new Date("2026-06-22T18:44:59+07:00"))).toBe(true);
  });

  it("hides an event after its final checkout time", () => {
    expect(isWorkEventActive(event(), new Date("2026-06-22T18:45:01+07:00"))).toBe(false);
  });

  it("uses the end of the final day when no checkout time exists", () => {
    expect(isWorkEventActive(event({ attendance_days: [] }), new Date("2026-06-22T20:00:00+07:00"))).toBe(true);
    expect(isWorkEventActive(event({ attendance_days: [] }), new Date("2026-06-23T00:00:00+07:00"))).toBe(false);
  });
});
