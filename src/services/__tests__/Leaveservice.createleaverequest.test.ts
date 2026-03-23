// src/services/__tests__/leaveService.createLeaveRequest.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import dayjs from "dayjs";

// ── ✅ vi.hoisted — ประกาศก่อน vi.mock hoist ──────────────────
const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("../api", () => ({
  default: {
    get:    vi.fn(),
    post:   mockPost,
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import { createLeaveRequest } from "../leaveService";
import type { LeaveRequestPayload } from "../leaveService";

// ── Helper — อ่าน body ของ POST call ล่าสุด ──────────────────
// ✅ ใช้ lastCall แทน calls[0] เพื่อกัน call สะสมจาก test ก่อน
function lastCallBody() {
  const calls = mockPost.mock.calls;
  return calls[calls.length - 1][1];
}

// ── Fixtures ──────────────────────────────────────────────────

const mockLeaveRequest = {
  id:            1,
  user_id:       1,
  leave_type_id: 1,
  start_date:    "2026-03-01",
  end_date:      "2026-03-03",
  start_time:    null,
  end_time:      null,
  leave_unit:    "day",
  total_days:    3,
  total_hours:   null,
  reason:        "ป่วย",
  status:        "pending",
  created_at:    "2026-03-01T00:00:00.000Z",
  leave_type: { id: 1, name: "ลาป่วย", description: "", max_days: 30 },
};

const dayPayload: LeaveRequestPayload = {
  leave_type_id: 1,
  leave_unit:    "day",
  start_date:    "2026-03-01",
  end_date:      "2026-03-03",
  start_time:    null,
  end_time:      null,
  reason:        "ป่วย",
};

const hourPayload: LeaveRequestPayload = {
  leave_type_id: 2,
  leave_unit:    "hour",
  start_date:    "2026-03-01",
  end_date:      "2026-03-01",
  start_time:    dayjs("2026-03-01 09:00"),
  end_time:      dayjs("2026-03-01 12:00"),
  reason:        "นัดแพทย์",
};

// ── Tests ─────────────────────────────────────────────────────

describe("createLeaveRequest — ลาเป็นวัน", () => {
  // ✅ reset ทุก test เพื่อไม่ให้ calls สะสม
  beforeEach(() => {
    mockPost.mockClear();
    mockPost.mockResolvedValue({ data: mockLeaveRequest });
  });

  it("เรียก POST /api/leave-requests", async () => {
    await createLeaveRequest(dayPayload);
    expect(mockPost).toHaveBeenCalledWith("/api/leave-requests", expect.any(Object));
  });

  it("ส่ง start_date และ end_date ถูกต้อง", async () => {
    await createLeaveRequest(dayPayload);
    const body = lastCallBody();
    expect(body.start_date).toBe("2026-03-01");
    expect(body.end_date).toBe("2026-03-03");
  });

  it("คำนวณ total_days ถูกต้อง (3 วัน)", async () => {
    await createLeaveRequest(dayPayload);
    expect(lastCallBody().total_days).toBe(3);
  });

  it("คำนวณ total_days ลาวันเดียว = 1", async () => {
    await createLeaveRequest({ ...dayPayload, start_date: "2026-03-01", end_date: "2026-03-01" });
    expect(lastCallBody().total_days).toBe(1);
  });

  it("ส่ง start_time และ end_time เป็น null", async () => {
    await createLeaveRequest(dayPayload);
    const body = lastCallBody();
    expect(body.start_time).toBeNull();
    expect(body.end_time).toBeNull();
  });

  it("ส่ง total_hours เป็น null", async () => {
    await createLeaveRequest(dayPayload);
    expect(lastCallBody().total_hours).toBeNull();
  });

  it("ส่ง reason ถูกต้อง", async () => {
    await createLeaveRequest(dayPayload);
    expect(lastCallBody().reason).toBe("ป่วย");
  });

  it("ส่ง leave_type_id ถูกต้อง", async () => {
    await createLeaveRequest(dayPayload);
    expect(lastCallBody().leave_type_id).toBe(1);
  });

  it("return ข้อมูลจาก API ได้ถูกต้อง", async () => {
    const result = await createLeaveRequest(dayPayload);
    expect(result).toEqual(mockLeaveRequest);
  });
});

describe("createLeaveRequest — ลาเป็นชั่วโมง", () => {
  beforeEach(() => {
    mockPost.mockClear();
    mockPost.mockResolvedValue({
      data: { ...mockLeaveRequest, leave_unit: "hour", total_hours: 3, total_days: 0.38 },
    });
  });

  it("ส่ง start_time format HH:mm", async () => {
    await createLeaveRequest(hourPayload);
    expect(lastCallBody().start_time).toBe("09:00");
  });

  it("ส่ง end_time format HH:mm", async () => {
    await createLeaveRequest(hourPayload);
    expect(lastCallBody().end_time).toBe("12:00");
  });

  it("คำนวณ total_hours ถูกต้อง (3 ชั่วโมง)", async () => {
    await createLeaveRequest(hourPayload);
    expect(lastCallBody().total_hours).toBe(3);
  });

  it("คำนวณ total_hours แบบทศนิยม (1.5 ชั่วโมง)", async () => {
    await createLeaveRequest({
      ...hourPayload,
      start_time: dayjs("2026-03-01 09:00"),
      end_time:   dayjs("2026-03-01 10:30"),
    });
    expect(lastCallBody().total_hours).toBe(1.5);
  });

  it("ส่ง total_days เป็น 0", async () => {
    await createLeaveRequest(hourPayload);
    expect(lastCallBody().total_days).toBe(0);
  });

  it("ส่ง end_date = start_date เสมอ (ลาชั่วโมงอยู่วันเดียว)", async () => {
    await createLeaveRequest({ ...hourPayload, start_date: "2026-03-01", end_date: "2026-03-05" });
    expect(lastCallBody().end_date).toBe("2026-03-01");
  });
});

describe("createLeaveRequest — edge cases", () => {
  beforeEach(() => {
    mockPost.mockClear();
    mockPost.mockResolvedValue({ data: mockLeaveRequest });
  });

  it("เรียก POST ครั้งเดียวต่อ 1 request", async () => {
    await createLeaveRequest(dayPayload);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("throw error เมื่อ API ล้มเหลว", async () => {
    mockPost.mockRejectedValue(new Error("Network Error"));
    await expect(createLeaveRequest(dayPayload)).rejects.toThrow("Network Error");
  });

  it("throw error เมื่อ API คืน 400", async () => {
    mockPost.mockRejectedValue({
      response: { status: 400, data: { message: "กรุณากรอกข้อมูลให้ครบถ้วน" } },
    });
    await expect(createLeaveRequest(dayPayload)).rejects.toMatchObject({
      response: { data: { message: "กรุณากรอกข้อมูลให้ครบถ้วน" } },
    });
  });

  it("throw error เมื่อ API คืน 403 CSRF", async () => {
    mockPost.mockRejectedValue({
      response: { status: 403, data: { message: "CSRF token invalid" } },
    });
    await expect(createLeaveRequest(dayPayload)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it("throw error เมื่อ API คืน 409 วันลาทับซ้อน", async () => {
    mockPost.mockRejectedValue({
      response: { status: 409, data: { message: "วันที่ลาทับซ้อนกับคำขอที่อนุมัติแล้ว" } },
    });
    await expect(createLeaveRequest(dayPayload)).rejects.toMatchObject({
      response: { status: 409 },
    });
  });
});