import type { LeavePool, LeaveRequest } from "./leaveService";
import { isOffsiteWorkType } from "./leaveTime";

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getLeaveUsageDays(request: LeaveRequest) {
  if (request.leave_unit === "hour") return toNumber(request.total_hours) / 8;
  return toNumber(request.total_days);
}

function roundLeaveDays(value: number) {
  return Number(value.toFixed(6));
}

function balanceKey(name: string | null | undefined, id: number) {
  return (name || String(id)).trim().toLowerCase();
}

export function deriveLeavePoolFromRequests(pool: LeavePool | null, requests: LeaveRequest[], _year = new Date().getFullYear()) {
  if (!pool) return pool;

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
    existing.remaining = Math.max(0, roundLeaveDays(toNumber(existing.total_days) - toNumber(existing.used_days)));
  });

  const balances = Array.from(groupedBalances.values()).map((balance) => {
    const used_days = toNumber(balance.used_days);
    const total_days = toNumber(balance.total_days);
    const offsiteUsed = isOffsiteWorkType(balance.name)
      ? requests
          .filter((request) => request.status === "approved" && request.request_type === "offsite" && request.leave_type_id === balance.leave_type_id)
          .reduce((sum, request) => sum + getLeaveUsageDays(request), 0)
      : 0;
    const nextUsedDays = roundLeaveDays(used_days + offsiteUsed);
    return {
      ...balance,
      total_days,
      used_days: nextUsedDays,
      used_day_units: isOffsiteWorkType(balance.name)
        ? roundLeaveDays(toNumber(balance.used_day_units) + offsiteUsed)
        : balance.used_day_units,
      remaining: Math.max(0, roundLeaveDays(total_days - nextUsedDays)),
    };
  });

  const usedFromBalances = balances.reduce((sum, balance) => sum + toNumber(balance.used_days), 0);
  const used_days = roundLeaveDays(usedFromBalances);
  const total_days = toNumber(pool.total_days);

  return {
    ...pool,
    total_days,
    used_days,
    remaining: Math.max(0, roundLeaveDays(total_days - used_days)),
    balances,
  };
}
