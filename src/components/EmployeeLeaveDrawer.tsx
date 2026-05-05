// components/EmployeeLeaveDrawer.tsx
import { useState } from "react";
import type { LeaveRequest, LeaveStatus } from "../services/leaveService";
import type { EmployeeWithBalance } from "./adminHelpers";
import { STATUS_META, TYPE_COLORS, fmtDate, fmtDatetime, avatarColor } from "./adminHelpers";

interface EmployeeLeaveDrawerProps {
  employee: EmployeeWithBalance;
  leaveRequests: LeaveRequest[];
  loading: boolean;
  onClose: () => void;
  onOpenBalance?: () => void;
  canEditBalance?: boolean;
}

export function EmployeeLeaveDrawer({
  employee: emp,
  leaveRequests,
  loading,
  onClose,
  onOpenBalance,
  canEditBalance = true,
}: EmployeeLeaveDrawerProps) {
  const ac = avatarColor(emp.department);
  const pool = emp.pool;
  const remaining = pool ? Math.max(0, pool.total_days - pool.used_days) : 0;

  const [leaveFilter, setLeaveFilter] = useState<"all" | LeaveStatus>("all");
  const filtered = leaveRequests.filter((r) => leaveFilter === "all" || r.status === leaveFilter);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ac}`}>
              {emp.full_name.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{emp.full_name}</h3>
              <p className="text-xs text-gray-400">{emp.department} · {emp.employee_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >×</button>
        </div>

        {/* Leave balance summary */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-3">สรุปวันลาประจำปี</p>
            {pool ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{pool.total_days}</p>
                  <p className="text-xs text-gray-400 mt-0.5">สิทธิ์รวม</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{pool.used_days}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ใช้ไปแล้ว</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${remaining <= 3 ? "bg-red-50" : remaining <= 7 ? "bg-amber-50" : "bg-emerald-50"}`}>
                  <p className={`text-xl font-bold ${remaining <= 3 ? "text-red-600" : remaining <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
                    {remaining}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">คงเหลือ</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">ไม่พบข้อมูลวันลา</p>
            )}
          </div>

          {pool?.balances && pool.balances.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">สิทธิ์แยกตามประเภท</p>
              <div className="space-y-1.5">
                {pool.balances.map((b) => (
                  <div key={b.leave_type_id} className="flex items-center justify-between text-xs bg-slate-50/50 px-3 py-2 rounded-lg">
                    <span className="font-medium text-gray-600">{b.name}</span>
                    <span className="text-gray-500">
                      คงเหลือ <strong className="text-gray-800">{b.remaining}</strong> / {b.total_days} วัน
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onOpenBalance}
            hidden={!canEditBalance || !onOpenBalance}
            className="w-full py-2.5 text-xs bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            แก้ไขวันลา
          </button>
        </div>

        {/* Leave history filter */}
        <div className="px-6 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400">ประวัติการลา</p>
            <div className="flex gap-1">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setLeaveFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    leaveFilter === s
                      ? "bg-slate-800 text-white"
                      : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s === "all" ? "ทั้งหมด" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave history list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">ไม่พบประวัติการลา</div>
          ) : (
            filtered.map((req) => {
              const meta = STATUS_META[req.status];
              const tc = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
              const isHourly = req.leave_unit === "hour";
              return (
                <div key={req.id} className={`rounded-xl border p-4 space-y-2 ${meta.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tc}`}>
                        {req.leave_type.name}
                      </span>
                      {isHourly && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                          </svg>
                          ลาชั่วโมง
                        </span>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.color} whitespace-nowrap`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันที่</span>
                      <span className="font-medium">
                        {fmtDate(req.start_date)}
                        {req.start_date !== req.end_date ? ` – ${fmtDate(req.end_date)}` : ""}
                        {isHourly && req.start_time ? ` (${req.start_time}–${req.end_time} น.)` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">จำนวน</span>
                      <span className="font-semibold text-gray-700">
                        {isHourly ? `${req.total_hours} ชั่วโมง` : `${req.total_days} วัน`}
                      </span>
                    </div>
                    {req.reason && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400 flex-shrink-0">เหตุผล</span>
                        <span className="text-right text-gray-600 truncate">{req.reason}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400">ส่งเมื่อ {fmtDatetime(req.created_at)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
