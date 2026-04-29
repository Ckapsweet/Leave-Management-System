// components/DetailDrawer.tsx
import type { LeaveRequest } from "../services/leaveService";
import { STATUS_META, TYPE_COLORS, fmtDate, fmtDatetime, avatarColor } from "./adminHelpers";

interface DetailDrawerProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  canApprove?: boolean; 
}

export function DetailDrawer({ request: req, onClose, onApprove, onReject, canApprove = true }: DetailDrawerProps) {
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const meta = STATUS_META[req.status];
  const isHourly = req.leave_unit === "hour";
  const ac = avatarColor(req.user?.department);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">คำขอ #{req.id}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Employee */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ac}`}>
              {req.user?.full_name?.slice(0, 2) ?? "??"}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{req.user?.full_name}</p>
              <p className="text-xs text-gray-500">{req.user?.department} · {req.user?.employee_code}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
            <span className="text-xl">{meta.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
              {req.approved_at && (
                <p className="text-xs text-gray-500">{fmtDatetime(req.approved_at)}</p>
              )}
            </div>
          </div>

          {/* Leave Type */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">ประเภทการลา</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColor}`}>
                {req.leave_type.name}
              </span>
              {isHourly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  ลาชั่วโมง
                </span>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่ลา</span>
              <span className="font-medium text-gray-800">{fmtDate(req.start_date)}</span>
            </div>
            {!isHourly && req.start_date !== req.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">ถึงวันที่</span>
                <span className="font-medium text-gray-800">{fmtDate(req.end_date)}</span>
              </div>
            )}
            {isHourly && req.start_time && (
              <div className="flex justify-between">
                <span className="text-gray-500">ช่วงเวลา</span>
                <span className="font-medium text-gray-800">{req.start_time} – {req.end_time} น.</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-500">รวม</span>
              <span className="font-bold text-gray-900">
                {isHourly ? `${req.total_hours} ชั่วโมง` : `${req.total_days} วัน`}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">เหตุผล</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{req.reason}</p>
          </div>

          {/* Comment */}
          {req.comment && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">หมายเหตุ</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">"{req.comment}"</p>
                {req.approver_name && (
                  <p className="text-xs text-amber-600 mt-1">— {req.approver_name}</p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">ส่งคำขอเมื่อ {fmtDatetime(req.created_at)}</p>
        </div>

        {/* Action buttons */}
        {req.status === "pending" && canApprove && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors"
            >
              อนุมัติ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
