import type { LeaveBalance } from "../services/leaveService";
import { formatLeaveDays, formatLeaveUsage } from "../services/leaveTime";
export { formatLeaveDays, formatLeaveUsage } from "../services/leaveTime";

const TYPE_COLORS: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-orange-100 text-orange-700",
};

const DEFAULT_SUBTITLE = "สิทธิ์ประจำปี";

export function LeaveBalanceCard({
  balance,
  subtitle = DEFAULT_SUBTITLE,
}: {
  balance: LeaveBalance;
  subtitle?: string;
}) {
  const typeColor = TYPE_COLORS[balance.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const displaySubtitle = subtitle.trim() || DEFAULT_SUBTITLE;
  const total = Math.max(0, balance.total_days);
  const remaining = Math.max(0, balance.remaining);
  const used = Math.max(0, balance.used_days);
  const usedLabel = formatLeaveUsage(used, balance.used_day_units, balance.used_hours);
  const remainingRatio = total > 0 ? remaining / total : 0;
  const barColor = remainingRatio < 0.2 ? "bg-red-400" : remainingRatio < 0.5 ? "bg-amber-400" : "bg-indigo-500";

  return (
    <div className="h-full min-h-[230px] rounded-2xl border border-gray-100 bg-white p-6 flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {balance.name}
          </span>
          <p className="mt-2 min-h-[2.5rem] overflow-hidden break-words text-xs leading-5 text-gray-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {displaySubtitle}
          </p>
        </div>
        <div className="min-w-[5.5rem] text-right">
          <p className={`whitespace-nowrap text-3xl font-bold leading-none ${remaining <= 3 ? "text-red-600" : "text-indigo-600"}`}>
            {formatLeaveDays(remaining)}
          </p>
          <p className="mt-2 whitespace-nowrap text-xs text-gray-400">วันคงเหลือ</p>
        </div>
      </div>

      <div className="mt-5 h-2 bg-gray-100 rounded-full overflow-hidden">
        {total > 0 && (
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, remainingRatio * 100)}%` }}
          />
        )}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
        <div className="min-w-0">
          <p className="text-xs text-gray-400">สิทธิ์รวม</p>
          <p className="mt-1 whitespace-nowrap text-sm font-bold text-gray-800">{formatLeaveDays(total)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400">ใช้ไปแล้ว</p>
          <p className="mt-1 truncate text-sm font-bold text-gray-800" title={usedLabel}>
            {usedLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
