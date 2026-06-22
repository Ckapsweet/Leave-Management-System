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

import dayjs from "dayjs";
import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createAdminHistoricalLeaveRequest,
  createLeaveRequest,
  deleteAdminLeaveRequest,
  getAdminLeaveRequests,
  getAdminUserPool,
  getLeavePool,
  rejectLeaveRequest,
  updateAdminLeaveRequest,
  updateLeavePool,
} from "../leaveService";

describe("leaveService admin and payload edges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: { id: 1 } });
    mockPatch.mockResolvedValue({ data: { status: "approved", current_assignee_id: null } });
    mockDelete.mockResolvedValue({ data: undefined });
  });

  it("uses the requested year when loading user leave pool", async () => {
    await getLeavePool(2025);

    expect(mockGet).toHaveBeenCalledWith("/api/leave-balances", { params: { year: 2025 } });
  });

  it("sends attachments as FormData and omits null time fields", async () => {
    const file = new File(["hello"], "medical.pdf", { type: "application/pdf" });

    await createLeaveRequest({
      leave_type_id: 1,
      leave_unit: "day",
      start_date: "2026-05-18",
      end_date: "2026-05-18",
      start_time: null,
      end_time: null,
      reason: "Medical",
      attachments: [file],
    });

    const body = mockPost.mock.calls[0][1] as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("leave_type_id")).toBe("1");
    expect(body.get("total_days")).toBe("1");
    expect(body.get("start_time")).toBeNull();
    expect(body.getAll("attachments")).toEqual([file]);
  });

  it("keeps hourly leave on the start date and formats times", async () => {
    await createLeaveRequest({
      leave_type_id: 2,
      leave_unit: "hour",
      start_date: "2026-05-18",
      end_date: "2026-05-20",
      start_time: dayjs("2026-05-18 09:10"),
      end_time: dayjs("2026-05-18 10:20"),
      reason: "Appointment",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/leave-requests",
      expect.objectContaining({
        start_date: "2026-05-18",
        end_date: "2026-05-18",
        start_time: "09:10",
        end_time: "10:20",
        total_hours: 1.5,
        total_days: 0,
      })
    );
  });

  it("creates half-day leave requests as 0.5 day on a single date", async () => {
    await createLeaveRequest({
      leave_type_id: 1,
      leave_unit: "half_day",
      start_date: "2026-05-18",
      end_date: "2026-05-20",
      start_time: null,
      end_time: null,
      reason: "Half day leave",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/leave-requests",
      expect.objectContaining({
        start_date: "2026-05-18",
        end_date: "2026-05-18",
        total_days: 0.5,
        start_time: null,
        end_time: null,
      })
    );
  });

  it("creates admin historical half-day leave as 0.5 day", async () => {
    await createAdminHistoricalLeaveRequest({
      user_id: 7,
      leave_type_id: 1,
      leave_unit: "half_day",
      start_date: "2026-01-05",
      end_date: "2026-01-06",
      start_time: null,
      end_time: null,
      reason: "Backfilled half-day leave",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/admin/leave-requests",
      expect.objectContaining({
        user_id: 7,
        start_date: "2026-01-05",
        end_date: "2026-01-05",
        total_days: 0.5,
        historical: true,
      })
    );
  });

  it("calls admin leave request endpoints with params and comments", async () => {
    await getAdminLeaveRequests({ status: "pending", user_id: 7, year: 2026 });
    await approveLeaveRequest(10, "ok");
    await rejectLeaveRequest(11, "not enough info");
    await cancelLeaveRequest(12);
    await deleteAdminLeaveRequest(13);

    expect(mockGet).toHaveBeenCalledWith("/api/admin/leave-requests", {
      params: { status: "pending", user_id: 7, year: 2026 },
    });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-requests/10/approve", { comment: "ok" });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-requests/11/reject", { comment: "not enough info" });
    expect(mockDelete).toHaveBeenCalledWith("/api/leave-requests/12");
    expect(mockDelete).toHaveBeenCalledWith("/api/admin/leave-requests/13");
  });

  it("creates admin historical leave requests as approved history", async () => {
    await createAdminHistoricalLeaveRequest({
      user_id: 7,
      leave_type_id: 1,
      leave_unit: "day",
      start_date: "2026-01-05",
      end_date: "2026-01-06",
      start_time: null,
      end_time: null,
      reason: "Backfilled sick leave",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/admin/leave-requests",
      expect.objectContaining({
        user_id: 7,
        leave_type_id: 1,
        start_date: "2026-01-05",
        end_date: "2026-01-06",
        total_days: 2,
        status: "approved",
        historical: true,
      })
    );
  });

  it("updates admin leave requests with formatted hourly values", async () => {
    await updateAdminLeaveRequest(21, {
      user_id: 7,
      leave_type_id: 1,
      leave_unit: "hour",
      request_type: "leave",
      start_date: "2026-01-05",
      end_date: "2026-01-05",
      start_time: dayjs("2026-01-05 08:30"),
      end_time: dayjs("2026-01-05 11:00"),
      reason: "Updated historical leave",
      status: "approved",
    });

    expect(mockPatch).toHaveBeenCalledWith(
      "/api/admin/leave-requests/21",
      expect.objectContaining({
        user_id: 7,
        leave_type_id: 1,
        start_date: "2026-01-05",
        end_date: "2026-01-05",
        start_time: "08:30",
        end_time: "11:00",
        total_hours: 2.5,
        total_days: 0,
        status: "approved",
      })
    );
  });

  it("calls admin leave pool endpoints with the selected year", async () => {
    await getAdminUserPool(7, 2026);
    await updateLeavePool(7, [{ leave_type_id: 1, remaining_days: 12 }], 2026);

    expect(mockGet).toHaveBeenCalledWith("/api/admin/leave-pool/7", { params: { year: 2026 } });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-pool/7", {
      balances: [{ leave_type_id: 1, remaining_days: 12 }],
      year: 2026,
    });
  });
});
