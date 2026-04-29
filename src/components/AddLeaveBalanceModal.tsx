// components/AddLeaveBalanceModal.tsx
import { useState, useEffect } from "react";
import type { LeavePool, LeaveBalance } from "../services/leaveService";

export interface AddLeavePoolModalProps {
  user: { id: number; full_name: string; employee_code: string; department: string };
  pool: LeavePool;
  year: number;
  onSubmit: (balances: { leave_type_id: number; total_days: number }[]) => Promise<void>;
  onClose: () => void;
}

export function AddLeaveBalanceModal({
  user, pool, year, onSubmit, onClose,
}: AddLeavePoolModalProps) {
  const [balances, setBalances] = useState<LeaveBalance[]>(pool.balances || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBalances(pool.balances || []);
    setError("");
  }, [pool]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleUpdateTotal = (typeId: number, newVal: number) => {
    setBalances(prev => prev.map(b => 
      b.leave_type_id === typeId ? { ...b, total_days: Math.max(0, newVal) } : b
    ));
    setError("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const payload = balances.map(b => ({
        leave_type_id: b.leave_type_id,
        total_days: b.total_days
      }));
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const INPUT_CLS = "w-20 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white text-center font-bold text-gray-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">กำหนดวันลาแยกประเภท</h2>
              <p className="text-xs text-gray-400">ปี {year}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

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

          <div className="space-y-4">
            {balances.map((b) => {
              const remaining = Math.max(0, b.total_days - b.used_days);
              return (
                <div key={b.leave_type_id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">{b.name}</p>
                    <p className="text-[10px] text-gray-400">ใช้ไปแล้ว {b.used_days} วัน · คงเหลือ {remaining} วัน</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => handleUpdateTotal(b.leave_type_id, b.total_days - 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors text-gray-500">
                      −
                    </button>
                    <input
                      type="number" min={0}
                      value={b.total_days}
                      onChange={(e) => handleUpdateTotal(b.leave_type_id, Number(e.target.value))}
                      className={INPUT_CLS}
                    />
                    <button type="button"
                      onClick={() => handleUpdateTotal(b.leave_type_id, b.total_days + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors text-gray-500">
                      +
                    </button>
                  </div>
                </div>
              );
            })}
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
        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-gray-50 pt-4">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังบันทึก...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>บันทึกทั้งหมด</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddLeaveBalanceModal;