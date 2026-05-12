import { useMemo, useState } from "react";
import type { LeaveRequest } from "../services/leaveService";
import {
  countLeaveRequestsByStatus,
  filterLeaveRequests,
  type LeaveStatusFilter,
  type RequestViewMode,
} from "../services/leaveFilters";

interface UseLeaveRequestFiltersOptions {
  initialStatus?: LeaveStatusFilter;
}

export function useLeaveRequestFilters(
  requests: LeaveRequest[],
  { initialStatus = "all" }: UseLeaveRequestFiltersOptions = {}
) {
  const currentYear = new Date().getFullYear();
  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>(initialStatus);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<RequestViewMode>("all");
  const [selYear, setSelYear] = useState<number>(currentYear);
  const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1);

  const filtered = useMemo(
    () =>
      filterLeaveRequests(requests, {
        status: statusFilter,
        search,
        viewMode,
        year: selYear,
        month: selMonth,
      }),
    [requests, search, selMonth, selYear, statusFilter, viewMode]
  );

  const counts = useMemo(() => countLeaveRequestsByStatus(requests), [requests]);

  return {
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    selYear,
    setSelYear,
    selMonth,
    setSelMonth,
    filtered,
    pending: counts.pending,
    approved: counts.approved,
    rejected: counts.rejected,
  };
}
