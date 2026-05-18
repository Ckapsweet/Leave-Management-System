import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UserLeaveDashboard from "../Dashboard";

const {
  getLeaveTypes,
  getLeavePool,
  getMyLeaveRequests,
  createLeaveRequest,
  cancelLeaveRequest,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  getLeaveTypes: vi.fn(),
  getLeavePool: vi.fn(),
  getMyLeaveRequests: vi.fn(),
  createLeaveRequest: vi.fn(),
  cancelLeaveRequest: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../services/leaveService", () => ({
  getLeaveTypes,
  getLeavePool,
  getMyLeaveRequests,
  createLeaveRequest,
  cancelLeaveRequest,
}));

vi.mock("../../services/authSession", () => ({
  readStoredUser: () => ({
    id: 1,
    employee_code: "EMP001",
    full_name: "Frontend User",
    department: "IT",
    role: "user",
  }),
  writeStoredUser: vi.fn(),
  logoutAndRedirect: vi.fn(),
}));

vi.mock("../../components/Toast", () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock("../../components/TodayLeavesWidget", () => ({
  TodayLeavesWidget: () => <div data-testid="today-leaves-widget" />,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock("../../components/LeaveBalanceCard", () => ({
  LeaveBalanceCard: ({ balance }: any) => <div>{balance.name}: {balance.remaining}</div>,
}));

vi.mock("../../components/EditProfileModal", () => ({
  EditProfileModal: () => <div data-testid="edit-profile-modal" />,
}));

vi.mock("../../components/Leaverequestmodal", () => ({
  LeaveRequestModal: ({ onSubmit, onClose, isLoading }: any) => (
    <div data-testid="leave-request-modal">
      <span>{isLoading ? "submitting" : "idle"}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await onSubmit({
              request_type: "leave",
              leave_type_id: 1,
              leave_unit: "day",
              start_date: "2026-05-13",
              end_date: "2026-05-13",
              start_time: null,
              end_time: null,
              reason: "New request reason",
              attachments: [],
            });
          } catch (err: any) {
            toastError(err?.response?.data?.message || "submit failed");
          }
        }}
      >
        mock-submit
      </button>
      <button type="button" onClick={onClose}>mock-close</button>
    </div>
  ),
}));

const leaveTypes = [
  { id: 1, name: "Annual", description: "", max_days: 10 },
];

const leavePool = {
  id: 1,
  user_id: 1,
  total_days: 10,
  used_days: 0,
  remaining: 10,
  year: 2026,
  balances: [{ leave_type_id: 1, name: "Annual", total_days: 10, used_days: 0, remaining: 10 }],
};

function makeRequest(overrides = {}) {
  return {
    id: 99,
    user_id: 1,
    leave_type_id: 1,
    start_date: "2026-05-13",
    end_date: "2026-05-13",
    leave_unit: "day",
    request_type: "leave",
    total_days: 1,
    total_hours: null,
    reason: "Existing request",
    status: "pending",
    created_at: "2026-05-13T01:00:00.000Z",
    leave_type: leaveTypes[0],
    ...overrides,
  };
}

async function renderLoadedDashboard() {
  render(<UserLeaveDashboard />);
  await screen.findByTestId("today-leaves-widget");
}

async function openCreateModal() {
  const button = screen.getByText("เพิ่มการลา").closest("button");
  expect(button).toBeInTheDocument();
  await userEvent.click(button as HTMLButtonElement);
  expect(screen.getByTestId("leave-request-modal")).toBeInTheDocument();
}

function getRequestRow(reason: string) {
  const row = screen.getByText(reason).closest("tr");
  expect(row).toBeInTheDocument();
  return row as HTMLTableRowElement;
}

function getConfirmCancelButton() {
  const button = Array.from(screen.getAllByRole("button")).find((el) =>
    el.className.includes("bg-red-500")
  );
  expect(button).toBeInTheDocument();
  return button as HTMLButtonElement;
}

describe("UserLeaveDashboard create leave flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLeaveTypes.mockResolvedValue(leaveTypes);
    getLeavePool.mockResolvedValue(leavePool);
    getMyLeaveRequests.mockResolvedValue([makeRequest()]);
    createLeaveRequest.mockResolvedValue(makeRequest({ id: 100, reason: "New request reason", request_type: undefined }));
    cancelLeaveRequest.mockResolvedValue(undefined);
  });

  it("adds the created request to the list and closes the modal on success", async () => {
    await renderLoadedDashboard();
    await openCreateModal();

    await userEvent.click(screen.getByText("mock-submit"));

    await waitFor(() => {
      expect(createLeaveRequest).toHaveBeenCalledWith(expect.objectContaining({ reason: "New request reason" }));
      expect(screen.queryByTestId("leave-request-modal")).not.toBeInTheDocument();
      expect(screen.getByText("New request reason")).toBeInTheDocument();
    });
  });

  it("keeps the modal open and shows an error when create request fails", async () => {
    createLeaveRequest.mockRejectedValueOnce({
      response: { data: { message: "Balance is not enough" } },
    });

    await renderLoadedDashboard();
    await openCreateModal();

    await userEvent.click(screen.getByText("mock-submit"));

    await waitFor(() => {
      expect(createLeaveRequest).toHaveBeenCalled();
      expect(screen.getByTestId("leave-request-modal")).toBeInTheDocument();
      expect(toastError).toHaveBeenCalledWith("Balance is not enough");
    });
  });

  it("cancels a pending leave request after confirmation", async () => {
    await renderLoadedDashboard();

    const row = getRequestRow("Existing request");
    await userEvent.click(within(row).getByRole("button"));

    expect(cancelLeaveRequest).not.toHaveBeenCalled();
    await userEvent.click(getConfirmCancelButton());

    await waitFor(() => {
      expect(cancelLeaveRequest).toHaveBeenCalledWith(99);
      expect(screen.queryByText("Existing request")).not.toBeInTheDocument();
      expect(toastSuccess).toHaveBeenCalled();
    });
  });

  it("keeps the request visible and shows an error when cancel request fails", async () => {
    cancelLeaveRequest.mockRejectedValueOnce({
      response: { data: { message: "Cannot cancel approved leave" } },
    });

    await renderLoadedDashboard();

    const row = getRequestRow("Existing request");
    await userEvent.click(within(row).getByRole("button"));
    await userEvent.click(getConfirmCancelButton());

    await waitFor(() => {
      expect(cancelLeaveRequest).toHaveBeenCalledWith(99);
      expect(screen.getByText("Existing request")).toBeInTheDocument();
      expect(toastError).toHaveBeenCalledWith("Cannot cancel approved leave");
    });
  });
});
