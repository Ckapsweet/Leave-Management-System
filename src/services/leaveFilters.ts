import type { LeaveRequest, LeaveStatus } from "./leaveService";

export type LeaveStatusFilter = "all" | LeaveStatus;
export type RequestViewMode = "all" | "yearly" | "monthly";

export interface LeaveRequestFilterOptions {
  status?: LeaveStatusFilter;
  search?: string;
  viewMode?: RequestViewMode;
  year?: number;
  month?: number;
}

export interface LeaveRequestStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

function matchesSearch(request: LeaveRequest, query: string) {
  if (!query) return true;
  return (
    request.user?.full_name?.includes(query) ||
    request.user?.employee_code?.includes(query) ||
    false
  );
}

function matchesDate(request: LeaveRequest, viewMode: RequestViewMode, year?: number, month?: number) {
  if (viewMode === "all") return true;

  const requestDate = new Date(request.start_date);
  if (Number.isNaN(requestDate.getTime())) return false;
  if (requestDate.getFullYear() !== year) return false;

  return viewMode === "yearly" || requestDate.getMonth() + 1 === month;
}

export function filterLeaveRequests(
  requests: LeaveRequest[],
  {
    status = "all",
    search = "",
    viewMode = "all",
    year,
    month,
  }: LeaveRequestFilterOptions = {}
) {
  const query = search.trim();

  return requests.filter((request) => {
    const matchStatus = status === "all" || request.status === status;
    return matchStatus && matchesSearch(request, query) && matchesDate(request, viewMode, year, month);
  });
}

export function countLeaveRequestsByStatus(requests: LeaveRequest[]): LeaveRequestStatusCounts {
  return requests.reduce<LeaveRequestStatusCounts>(
    (counts, request) => {
      counts[request.status] += 1;
      return counts;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );
}

export function normalizeDepartment(value?: string | null) {
  return (value ?? "").trim();
}
