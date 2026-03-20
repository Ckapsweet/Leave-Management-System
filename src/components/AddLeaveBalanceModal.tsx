// components/AddLeaveBalanceModal.tsx
import { useState, useEffect } from "react";
import type { LeavePool } from "../services/leaveService";

export interface AddLeavePoolModalProps {
  user: { id: number; full_name: string; employee_code: string; department: string };
  pool: LeavePool;
  year: number;
  onSubmit: (remaining_days: number) => Promise<void>;
  onClose: () => void;
}

export function AddLeaveBalanceModal({
  user, pool, year, onSubmit, onClose,
}: AddLeavePoolModalProps) {
  const [remainingDays, setRemainingDays] = useState<number>(pool.remaining ?? 0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setRemainingDays(pool.remaining ?? 0);
    setError("");
  }, [pool]);

  const diff = remainingDays - (pool.remaining ?? 0);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async () => {
    if (remainingDays < 0) return setError("วันลาคงเหลือต้องไม่ติดลบ");
    if (diff === 0) return onClose();
    try {
      setLoading(true);
      setError("");
      await onSubmit(remainingDays);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const INPUT_CLS = "w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">กำหนดวันลา</h2>
              <p className="text-xs text-gray-400">ปี {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* User */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">
              {user.full_name.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
              <p className="text-xs text-gray-500">{user.department} · {user.employee_code}</p>
            </div>
          </div>

          {/* Current pool summary */}
          <div className="bg-slate-50 rounded-xl p-4 flex gap-4 text-sm">
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-0.5">สิทธิ์รวม</p>
              <p className="font-bold text-slate-700">{pool.total_days} วัน</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-0.5">ใช้ไปแล้ว</p>
              <p className="font-bold text-slate-700">{pool.used_days} วัน</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-0.5">คงเหลือ</p>
              <p className={`font-bold ${(pool.remaining ?? 0) <= 3 ? "text-red-600" : "text-emerald-600"}`}>
                {pool.remaining} วัน
              </p>
            </div>
          </div>

          {/* Input วันคงเหลือ */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              ตั้งวันลาคงเหลือ
            </label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => { setRemainingDays((v) => Math.max(0, v - 1)); setError(""); }}
                className="w-10 h-10 flex-shrink-0 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-xl font-medium transition-colors">
                −
              </button>
              <div className="relative flex-1">
                <input
                  type="number" min={0}
                  value={remainingDays}
                  onChange={(e) => { setRemainingDays(Math.max(0, Number(e.target.value))); setError(""); }}
                  className={`${INPUT_CLS} text-center text-2xl font-bold text-gray-900 pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">วัน</span>
              </div>
              <button type="button"
                onClick={() => { setRemainingDays((v) => v + 1); setError(""); }}
                className="w-10 h-10 flex-shrink-0 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-xl font-medium transition-colors">
                +
              </button>
            </div>

            {/* diff + new total */}
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span>
                {diff > 0 && <span className="text-emerald-600 font-medium">+{diff} วัน</span>}
                {diff < 0 && <span className="text-amber-600 font-medium">{diff} วัน</span>}
                {diff === 0 && <span className="text-gray-400">ไม่มีการเปลี่ยนแปลง</span>}
              </span>
              {diff !== 0 && (
                <span className="text-gray-400">
                  สิทธิ์รวมใหม่ <strong className="text-gray-600">{remainingDays + pool.used_days} วัน</strong>
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading || diff === 0}
            className="px-5 py-2.5 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังบันทึก...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>บันทึก</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddLeaveBalanceModal;