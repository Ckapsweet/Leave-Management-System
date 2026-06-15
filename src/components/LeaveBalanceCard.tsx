import type { LeaveBalance } from "../services/leaveService";
import { formatLeaveDays, formatLeaveUsage } from "../services/leaveTime";
export { formatLeaveDays, formatLeaveUsage } from "../services/leaveTime";

const TYPE_COLORS: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-orange-100 text-orange-700",
};

export function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const typeColor = TYPE_COLORS[balance.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const total = Math.max(0, balance.total_days);
  const remaining = Math.max(0, balance.remaining);
  const used = Math.max(0, balance.used_days);
  const remainingRatio = total > 0 ? remaining / total : 0;
  const barColor = remainingRatio < 0.2 ? "bg-red-400" : remainingRatio < 0.5 ? "bg-amber-400" : "bg-indigo-500";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {balance.name}
          </span>
          <p className="text-xs text-gray-400 mt-2">สิทธิ์ประจำปี</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${remaining <= 3 ? "text-red-600" : "text-indigo-600"}`}>
            {formatLeaveDays(remaining)}
          </p>
          <p className="text-xs text-gray-400">วันคงเหลือ</p>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {total > 0 && (
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, remainingRatio * 100)}%` }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400">สิทธิ์รวม</p>
          <p className="text-sm font-bold text-gray-800">{formatLeaveDays(total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ใช้ไปแล้ว</p>
          <p className="text-sm font-bold text-gray-800">{formatLeaveUsage(used, balance.used_day_units, balance.used_hours)}</p>
        </div>
      </div>
    </div>
  );
}
