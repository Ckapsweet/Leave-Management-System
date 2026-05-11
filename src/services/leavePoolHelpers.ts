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

function balanceKey(name: string | null | undefined, id: number) {
  return (name || String(id)).trim().toLowerCase();
}

export function deriveLeavePoolFromRequests(pool: LeavePool | null, requests: LeaveRequest[], year = new Date().getFullYear()) {
  if (!pool) return pool;

  const approvedRequests = requests.filter(
    (request) => request.status === "approved" && new Date(request.start_date).getFullYear() === year
  );

  const groupedBalances = new Map<string, NonNullable<LeavePool["balances"]>[number]>();
  (pool.balances ?? []).forEach((balance) => {
    const key = balanceKey(balance.name, balance.leave_type_id);
    const existing = groupedBalances.get(key);
    if (!existing) {
      groupedBalances.set(key, { ...balance });
      return;
    }

    existing.leave_type_id = Math.min(existing.leave_type_id, balance.leave_type_id);
    existing.total_days = Math.max(toNumber(existing.total_days), toNumber(balance.total_days));
    existing.used_days = toNumber(existing.used_days) + toNumber(balance.used_days);
    existing.remaining = Math.max(0, toNumber(existing.total_days) - toNumber(existing.used_days));
  });

  const balances = Array.from(groupedBalances.values()).map((balance) => {
    const key = balanceKey(balance.name, balance.leave_type_id);
    const usedDays = approvedRequests
      .filter((request) => balanceKey(request.leave_type?.name, request.leave_type_id) === key)
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
