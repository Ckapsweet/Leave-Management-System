import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddLeaveBalanceModal } from "../AddLeaveBalanceModal";
import type { LeavePool } from "../../services/leaveService";

const user = {
  id: 7,
  full_name: "Balance User",
  employee_code: "EMP007",
  department: "IT",
};

const pool: LeavePool = {
  user_id: 7,
  total_days: 12,
  used_days: 2,
  remaining: 10,
  year: 2026,
  balances: [
    { leave_type_id: 1, name: "Annual", total_days: 10, used_days: 2, remaining: 8 },
    { leave_type_id: 2, name: "Sick", total_days: 2, used_days: 0, remaining: 2 },
  ],
};

function renderModal(overrides: Partial<React.ComponentProps<typeof AddLeaveBalanceModal>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <AddLeaveBalanceModal
      user={user}
      pool={pool}
      year={2026}
      onSubmit={onSubmit}
      onClose={onClose}
      {...overrides}
    />
  );
  return { onSubmit, onClose };
}

function saveButton() {
  return screen.getAllByRole("button").at(-1) as HTMLButtonElement;
}

describe("AddLeaveBalanceModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits edited leave balances and closes on success", async () => {
    const { onSubmit, onClose } = renderModal();
    const inputs = screen.getAllByRole("spinbutton");

    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "12");
    await userEvent.click(saveButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith([
        { leave_type_id: 1, total_days: 12 },
        { leave_type_id: 2, total_days: 2 },
      ]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("does not allow total days to go below zero", async () => {
    const { onSubmit } = renderModal();
    const decreaseSickDays = screen.getByRole("button", { name: "ลดวัน Sick" });

    await userEvent.click(decreaseSickDays);
    await userEvent.click(decreaseSickDays);
    await userEvent.click(decreaseSickDays);
    await userEvent.click(saveButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.arrayContaining([{ leave_type_id: 2, total_days: 0 }]));
    });
  });

  it("adds hourly entitlement using 7.5 hours per day", async () => {
    const { onSubmit } = renderModal();

    await userEvent.click(screen.getByRole("button", { name: "เพิ่มชั่วโมง Annual" }));
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มชั่วโมง Annual" }));
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มชั่วโมง Annual" }));
    await userEvent.click(saveButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.arrayContaining([
        { leave_type_id: 1, total_days: 10.4 },
      ]));
    });
  });

  it("adds minute entitlement using sixty minutes per hour", async () => {
    const { onSubmit } = renderModal();
    const minuteInput = screen.getByRole("spinbutton", { name: "จำนวนนาที Annual" });

    await userEvent.clear(minuteInput);
    await userEvent.type(minuteInput, "30");
    await userEvent.click(saveButton());

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.arrayContaining([
        { leave_type_id: 1, total_days: 10.066667 },
      ]));
    });
  });

  it("keeps the modal open and shows the API error when save fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue({ response: { data: { message: "Only admin can update" } } });
    const onClose = vi.fn();
    renderModal({ onSubmit, onClose });

    await userEvent.click(saveButton());

    expect(await screen.findByText("Only admin can update")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
