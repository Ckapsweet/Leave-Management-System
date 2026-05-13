import type { LeavePool, LeaveRequest } from "./leaveService";
import { WORK_HOURS_PER_DAY } from "./leaveTime";

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getLeaveUsageDays(request: LeaveRequest) {
  if (request.leave_unit === "hour") return toNumber(request.total_hours) / WORK_HOURS_PER_DAY;
  return toNumber(request.total_days);
}

function balanceKey(name: string | null | undefined, id: number) {
  return (name || String(id)).trim().toLowerCase();
}

export function deriveLeavePoolFromRequests(pool: LeavePool | null, requests: LeaveRequest[], year = new Date().getFullYear()) {
  if (!pool) return pool;

  const usageByType = new Map<string, number>();
  let usedFromRequests = 0;
  requests.forEach((request) => {
    if (request.status !== "approved" || new Date(request.start_date).getFullYear() !== year) return;

    const usageDays = getLeaveUsageDays(request);
    const key = balanceKey(request.leave_type?.name, request.leave_type_id);
    usageByType.set(key, (usageByType.get(key) ?? 0) + usageDays);
    usedFromRequests += usageDays;
  });

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
    const usedDays = usageByType.get(key);
    const used_days = usedDays ?? toNumber(balance.used_days);
    const total_days = toNumber(balance.total_days);
    return {
      ...balance,
      total_days,
      used_days,
      remaining: Math.max(0, total_days - used_days),
    };
  });

  const usedFromBalances = balances.reduce((sum, balance) => sum + toNumber(balance.used_days), 0);
  const used_days = usedFromRequests > 0 ? usedFromRequests : Math.max(toNumber(pool.used_days), usedFromBalances);
  const total_days = toNumber(pool.total_days);

  return {
    ...pool,
    total_days,
    used_days,
    remaining: Math.max(0, total_days - used_days),
    balances,
  };
}
