import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodayLeavesWidget } from "../TodayLeavesWidget";
import type { LeaveRequest } from "../../services/leaveService";
import type { AuthUser } from "../../services/authService";

const { getTodayLeaves, getThisWeekLeaves, updateMyOffsiteRequest, updateAdminLeaveRequest, readStoredUser } = vi.hoisted(() => ({
  getTodayLeaves: vi.fn(),
  getThisWeekLeaves: vi.fn(),
  updateMyOffsiteRequest: vi.fn(),
  updateAdminLeaveRequest: vi.fn(),
  readStoredUser: vi.fn(),
}));

vi.mock("../../services/leaveService", () => ({
  getTodayLeaves,
  getThisWeekLeaves,
  updateMyOffsiteRequest,
  updateAdminLeaveRequest,
}));

vi.mock("../../services/authSession", () => ({ readStoredUser }));

const owner = {
  id: 26,
  full_name: "นายธีรพงศ์ ตึ๊บหิน",
  english_name: "Teerapong T",
  employee_code: "MKT-0018",
  department: "การตลาด",
  role: "user",
  supervisor_id: null,
  email: "owner@example.com",
  email_2: "owner2@example.com",
  phone: "0982237677",
} as const;

function makeLeave(id: number, date: string, overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id,
    user_id: owner.id,
    leave_type_id: 9,
    start_date: date,
    end_date: date,
    leave_unit: "day",
    request_type: "offsite",
    total_days: 1,
    reason: "WFH",
    status: "approved",
    created_at: "2026-10-01",
    leave_type: { id: 9, name: "ทำงานนอกสถานที่" } as LeaveRequest["leave_type"],
    user: { ...owner },
    ...overrides,
  };
}

function asUser(user: Partial<AuthUser>) {
  readStoredUser.mockReturnValue({ ...owner, ...user } as AuthUser);
}

async function openPopup() {
  render(<TodayLeavesWidget />);
  const cards = await screen.findAllByRole("button", { name: /นายธีรพงศ์/ });
  await userEvent.click(cards[0]);
  return screen.getByRole("dialog");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 10, 9, 0, 0));
  getTodayLeaves.mockResolvedValue([]);
  getThisWeekLeaves.mockResolvedValue([makeLeave(1, "2026-10-12"), makeLeave(2, "2026-10-14")]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TodayLeavesWidget calendar", () => {
  it("lists each person under every day they are away", async () => {
    asUser({ id: 99, role: "user" });
    render(<TodayLeavesWidget />);

    const day12 = await screen.findByTestId("calendar-day-2026-10-12");
    const day13 = screen.getByTestId("calendar-day-2026-10-13");
    const day14 = screen.getByTestId("calendar-day-2026-10-14");
    expect(within(day12).getByRole("button", { name: /นายธีรพงศ์/ })).toBeInTheDocument();
    expect(within(day13).queryByRole("button", { name: /นายธีรพงศ์/ })).not.toBeInTheDocument();
    expect(within(day13).getByText("ไม่มีผู้ลา")).toBeInTheDocument();
    expect(within(day14).getByRole("button", { name: /นายธีรพงศ์/ })).toBeInTheDocument();
    expect(screen.getByTestId("calendar-day-2026-10-10")).toHaveTextContent("วันนี้");
  });

  it("opens a printable report", async () => {
    asUser({ id: 99, role: "user" });
    const doc = { open: vi.fn(), write: vi.fn(), close: vi.fn() };
    const win = { document: doc, focus: vi.fn(), print: vi.fn(), setTimeout: (fn: () => void) => fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
    render(<TodayLeavesWidget />);
    await screen.findByTestId("calendar-day-2026-10-12");

    await userEvent.click(screen.getByRole("button", { name: /พิมพ์รายงาน/ }));

    expect(open).toHaveBeenCalled();
    const html = doc.write.mock.calls[0][0] as string;
    expect(html).toContain("รายงานผู้ลา");
    expect(html).toContain("MKT-0018");
    expect(html).toContain("ไม่มีผู้ลา");
    expect(win.print).toHaveBeenCalled();
    open.mockRestore();
  });
});

describe("TodayLeavesWidget popup", () => {
  it("shows the person's full details", async () => {
    asUser({ id: 99, role: "user" });
    const dialog = await openPopup();

    expect(within(dialog).getAllByText("MKT-0018").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Teerapong T").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("owner2@example.com")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "แก้ไข" })).not.toBeInTheDocument();
  });

  it("lets the owner edit their offsite entry", async () => {
    asUser({ role: "user" });
    updateMyOffsiteRequest.mockResolvedValue(undefined);
    const dialog = await openPopup();

    await userEvent.click(within(dialog).getAllByRole("button", { name: "แก้ไข" })[0]);
    const reason = within(dialog).getByLabelText("หมายเหตุ");
    await userEvent.clear(reason);
    await userEvent.type(reason, "ออกหน้างาน");
    await userEvent.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    await waitFor(() =>
      expect(updateMyOffsiteRequest).toHaveBeenCalledWith(1, { start_date: "2026-10-12", end_date: "2026-10-12", reason: "ออกหน้างาน" })
    );
    expect(getThisWeekLeaves).toHaveBeenCalledTimes(2);
  });

  it("uses the admin API when an admin edits someone else's leave", async () => {
    asUser({ id: 1, role: "admin" });
    getThisWeekLeaves.mockResolvedValue([makeLeave(1, "2026-10-12", { request_type: "leave" })]);
    updateAdminLeaveRequest.mockResolvedValue({});
    const dialog = await openPopup();

    await userEvent.click(within(dialog).getByRole("button", { name: "แก้ไข" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    await waitFor(() => expect(updateAdminLeaveRequest).toHaveBeenCalledTimes(1));
    expect(updateAdminLeaveRequest.mock.calls[0][0]).toBe(1);
    expect(updateAdminLeaveRequest.mock.calls[0][1]).toMatchObject({ user_id: 26, request_type: "leave", start_date: "2026-10-12", end_date: "2026-10-12", status: "approved" });
    expect(updateMyOffsiteRequest).not.toHaveBeenCalled();
  });

  it("shows the API error and keeps the form open", async () => {
    asUser({ role: "user" });
    updateMyOffsiteRequest.mockRejectedValue({ response: { data: { message: "วันที่ไม่ถูกต้อง" } } });
    const dialog = await openPopup();

    await userEvent.click(within(dialog).getAllByRole("button", { name: "แก้ไข" })[0]);
    await userEvent.click(within(dialog).getByRole("button", { name: "บันทึก" }));

    expect(await within(dialog).findByText("วันที่ไม่ถูกต้อง")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "บันทึก" })).toBeEnabled();
  });
});
