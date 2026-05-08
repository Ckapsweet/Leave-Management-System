import type { LeavePool, LeaveRequest } from "./leaveService";
import { leaveHoursToDays } from "./leaveTime";

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getLeaveUsageDays(request: LeaveRequest) {
  if (request.leave_unit === "hour") return leaveHoursToDays(request.total_hours);
  return toNumber(request.total_days);
}

export function deriveLeavePoolFromRequests(pool: LeavePool | null, requests: LeaveRequest[], year = new Date().getFullYear()) {
  if (!pool) return pool;

  const approvedRequests = requests.filter(
    (request) => request.status === "approved" && new Date(request.start_date).getFullYear() === year
  );

  const balances = (pool.balances ?? []).map((balance) => {
    const usedDays = approvedRequests
      .filter((request) => request.leave_type_id === balance.leave_type_id)
      .reduce((sum, request) => sum + getLeaveUsageDays(request), 0);
    const used_days = Math.max(toNumber(balance.used_days), usedDays);
    const total_days = toNumber(balance.total_days);
    return {
      ...balance,
      total_days,
      used_days,
      remaining: Math.max(0, total_days - used_days),
    };
  });

  const usedFromBalances = balances.reduce((sum, balance) => sum + toNumber(balance.used_days), 0);
  const usedFromRequests = approvedRequests.reduce((sum, request) => sum + getLeaveUsageDays(request), 0);
  const used_days = Math.max(toNumber(pool.used_days), usedFromBalances, usedFromRequests);
  const total_days = toNumber(pool.total_days);

  return {
    ...pool,
    total_days,
    used_days,
    remaining: Math.max(0, total_days - used_days),
    balances,
  };
}
