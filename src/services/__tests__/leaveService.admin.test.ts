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
  createLeaveRequest,
  getAdminLeaveRequests,
  getAdminUserPool,
  getLeavePool,
  rejectLeaveRequest,
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

  it("calls admin leave request endpoints with params and comments", async () => {
    await getAdminLeaveRequests({ status: "pending", user_id: 7, year: 2026 });
    await approveLeaveRequest(10, "ok");
    await rejectLeaveRequest(11, "not enough info");
    await cancelLeaveRequest(12);

    expect(mockGet).toHaveBeenCalledWith("/api/admin/leave-requests", {
      params: { status: "pending", user_id: 7, year: 2026 },
    });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-requests/10/approve", { comment: "ok" });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-requests/11/reject", { comment: "not enough info" });
    expect(mockDelete).toHaveBeenCalledWith("/api/leave-requests/12");
  });

  it("calls admin leave pool endpoints with the selected year", async () => {
    await getAdminUserPool(7, 2026);
    await updateLeavePool(7, [{ leave_type_id: 1, total_days: 12 }], 2026);

    expect(mockGet).toHaveBeenCalledWith("/api/admin/leave-pool/7", { params: { year: 2026 } });
    expect(mockPatch).toHaveBeenCalledWith("/api/admin/leave-pool/7", {
      balances: [{ leave_type_id: 1, total_days: 12 }],
      year: 2026,
    });
  });
});
