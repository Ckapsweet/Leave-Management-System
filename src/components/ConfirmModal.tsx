// components/ConfirmModal.tsx
import { useState } from "react";
import type { LeaveRequest } from "../services/leaveService";
import { fmtDate } from "./adminHelpers";

interface ConfirmModalProps {
  type: "approve" | "reject";
  request: LeaveRequest;
  onConfirm: (comment: string) => void;
  onClose: () => void;
  loading: boolean;
}

export function ConfirmModal({ type, request, onConfirm, onClose, loading }: ConfirmModalProps) {
  const [comment, setComment] = useState("");
  const isApprove = type === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isApprove ? "bg-emerald-100" : "bg-red-100"}`}>
              {isApprove ? "✓" : "✗"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{isApprove ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}</h3>
              <p className="text-xs text-gray-400">คำขอ #{request.id} — {request.user?.full_name}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ประเภท</span>
              <span className="font-medium">{request.leave_type.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่</span>
              <span className="font-medium">
                {fmtDate(request.start_date)}
                {request.start_date !== request.end_date ? ` – ${fmtDate(request.end_date)}` : ""}
                {request.leave_unit === "hour" && request.start_time
                  ? ` (${request.start_time}–${request.end_time} น.)`
                  : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">จำนวน</span>
              <span className="font-medium">
                {request.leave_unit === "hour"
                  ? `${request.total_hours} ชั่วโมง`
                  : `${request.total_days} วัน`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              หมายเหตุ {!isApprove && <span className="text-red-400">*</span>}
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              rows={3}
              placeholder={isApprove ? "หมายเหตุ (ถ้ามี)..." : "ระบุเหตุผลที่ปฏิเสธ..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => { if (!isApprove && !comment.trim()) return; onConfirm(comment); }}
            disabled={loading || (!isApprove && !comment.trim())}
            className={`px-5 py-2.5 text-sm text-white rounded-xl font-medium transition-colors flex items-center gap-2 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isApprove ? "กำลังอนุมัติ..." : "กำลังปฏิเสธ..."}
              </>
            ) : (isApprove ? "อนุมัติ" : "ปฏิเสธ")}
          </button>
        </div>
      </div>
    </div>
  );
}
