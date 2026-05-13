import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import dayjs from "dayjs";
import { LeaveRequestModal } from "../Leaverequestmodal";

vi.mock("@mui/x-date-pickers/TimeField", () => ({
  TimeField: ({ onChange, value }: any) => (
    <input
      data-testid="time-field"
      type="time"
      value={value ? value.format("HH:mm") : ""}
      onChange={(e) => onChange(dayjs(`2026-01-01 ${e.target.value}`))}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: any) => children,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

vi.mock("../Toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const leaveTypes = [
  { id: 1, name: "Sick", description: "", max_days: 30 },
  { id: 2, name: "Personal", description: "", max_days: 10 },
];

const pool = {
  id: 1,
  user_id: 1,
  total_days: 40,
  used_days: 0,
  remaining: 40,
  year: 2026,
  balances: [
    { leave_type_id: 1, name: "Sick", total_days: 30, used_days: 0, remaining: 30 },
    { leave_type_id: 2, name: "Personal", total_days: 10, used_days: 0, remaining: 10 },
  ],
};

function renderModal(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const view = render(
    <LeaveRequestModal
      leaveTypes={leaveTypes}
      pool={pool}
      onSubmit={onSubmit}
      onClose={vi.fn()}
      isLoading={false}
    />
  );
  return { ...view, onSubmit };
}

describe("LeaveRequestModal submit modes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits hourly leave with the expected form data", async () => {
    const { container, onSubmit } = renderModal();

    await userEvent.click(screen.getByText("ลาเป็นชั่วโมง"));
    await userEvent.click(screen.getByText("Personal"));
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: "2026-03-03" },
    });
    const timeInputs = screen.getAllByTestId("time-field");
    fireEvent.change(timeInputs[0], { target: { value: "09:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "12:00" } });
    await userEvent.type(screen.getByRole("textbox"), "Doctor appointment");
    await userEvent.click(screen.getByText("ส่งคำขอลา"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          request_type: "leave",
          leave_type_id: 2,
          leave_unit: "hour",
          start_date: "2026-03-03",
          end_date: "2026-03-03",
          reason: "Doctor appointment",
        })
      );
    });
  });

  it("submits late request with the expected form data", async () => {
    const { container, onSubmit } = renderModal();

    await userEvent.click(screen.getByText("ลาสาย"));
    await userEvent.click(screen.getByText("Sick"));
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: "2026-03-03" },
    });
    const timeInputs = screen.getAllByTestId("time-field");
    fireEvent.change(timeInputs[0], { target: { value: "08:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "08:30" } });
    await userEvent.type(screen.getByRole("textbox"), "Traffic delay");
    await userEvent.click(screen.getByText("ส่งคำขอลาสาย"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          request_type: "late",
          leave_type_id: 1,
          leave_unit: "hour",
          start_date: "2026-03-03",
          end_date: "2026-03-03",
          reason: "Traffic delay",
        })
      );
    });
  });
});
