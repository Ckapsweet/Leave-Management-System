import { useState, useEffect } from "react";
import type { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { toast } from "./Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveUnit = "day" | "hour";

import type { LeavePool } from "../services/leaveService";

interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days: number;
}

export interface LeaveRequestForm {
  leave_type_id: number;
  leave_unit: LeaveUnit;
  start_date: string;
  end_date: string;
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  reason: string;
}

export interface LeaveRequestModalProps {
  leaveTypes: LeaveType[];
  pool: LeavePool | null;
  onSubmit: (form: LeaveRequestForm) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0;
  return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1);
}

function calcHours(startTime: Dayjs | null, endTime: Dayjs | null): number {
  if (!startTime || !endTime) return 0;
  const diff = endTime.diff(startTime, "minute");
  return Math.max(0, Math.round((diff / 60) * 10) / 10);
}

function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const day = new Date(dateStr).getUTCDay(); // 0 = อาทิตย์, 6 = เสาร์
  return day === 0 || day === 6;
}

const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5";
const INPUT_CLASS = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow bg-white";
const ERROR_CLASS = "text-xs text-red-500 mt-1";

// ── Validation ────────────────────────────────────────────────────────────────

interface FormErrors {
  leave_type_id?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

function validate(form: LeaveRequestForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.leave_type_id) errors.leave_type_id = "กรุณาเลือกประเภทการลา";

  if (!form.start_date) {
    errors.start_date = "กรุณาระบุวันที่";
  } else if (isWeekend(form.start_date)) {
    errors.start_date = "ไม่สามารถเลือกวันเสาร์หรืออาทิตย์ได้";
  }

  if (form.leave_unit === "day") {
    if (!form.end_date) {
      errors.end_date = "กรุณาระบุวันสิ้นสุด";
    } else if (isWeekend(form.end_date)) {
      errors.end_date = "ไม่สามารถเลือกวันเสาร์หรืออาทิตย์ได้";
    } else if (form.end_date < form.start_date) {
      errors.end_date = "วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น";
    }
  }

  if (form.leave_unit === "hour") {
    if (!form.start_time || !form.start_time.isValid()) errors.start_time = "กรุณาระบุเวลาเริ่ม";
    if (!form.end_time || !form.end_time.isValid()) errors.end_time = "กรุณาระบุเวลาสิ้นสุด";
    else if (form.start_time && form.start_time.isValid() && form.end_time.isBefore(form.start_time))
      errors.end_time = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";
  }

  if (!form.reason.trim()) errors.reason = "กรุณาระบุเหตุผล";

  return errors;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UnitToggle({ value, onChange }: { value: LeaveUnit; onChange: (v: LeaveUnit) => void }) {
  return (
    <div className="flex gap-2">
      {(["day", "hour"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${value === u
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
          {u === "day" ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              ลาเป็นวัน
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              ลาเป็นชั่วโมง
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function SummaryPill({ form }: { form: LeaveRequestForm }) {
  if (form.leave_unit === "day") {
    const days = calcDays(form.start_date, form.end_date);
    if (!days) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
        <span className="text-xs text-indigo-600 font-medium">รวม</span>
        <span className="text-sm font-bold text-indigo-700">{days} วัน</span>
      </div>
    );
  }
  const hours = calcHours(form.start_time, form.end_time);
  if (!hours) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
      <span className="text-xs text-indigo-600 font-medium">รวม</span>
      <span className="text-sm font-bold text-indigo-700">{hours} ชั่วโมง</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LeaveRequestModal({ leaveTypes, pool, onSubmit, onClose, isLoading = false }: LeaveRequestModalProps) {
  const [form, setForm] = useState<LeaveRequestForm>({
    leave_type_id: 0,
    leave_unit: "day",
    start_date: "",
    end_date: "",
    start_time: null,
    end_time: null,
    reason: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (form.leave_unit === "hour" && form.start_date)
      setForm((f) => ({ ...f, end_date: f.start_date }));
    if (form.leave_unit === "day")
      setForm((f) => ({ ...f, start_time: null, end_time: null }));
  }, [form.leave_unit]);

  const set = <K extends keyof LeaveRequestForm>(key: K, value: LeaveRequestForm[K]) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await onSubmit(form);
      toast.success("ส่งคำขอลาสำเร็จ!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">ยื่นคำขอลา</h2>
              <p className="text-xs text-gray-400">กรอกข้อมูลการลาให้ครบถ้วน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* รูปแบบการลา */}
          <div>
            <label className={LABEL_CLASS}>รูปแบบการลา</label>
            <UnitToggle value={form.leave_unit} onChange={(v) => set("leave_unit", v)} />
          </div>

          {/* ประเภทการลา */}
          <div>
            <label className={LABEL_CLASS}>ประเภทการลา <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {leaveTypes.map((t) => {
                const bal = pool?.balances?.find(b => b.leave_type_id === t.id);
                const remaining = bal ? bal.remaining : 0;
                const isSelected = form.leave_type_id === t.id;
                
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("leave_type_id", t.id)}
                    className={`flex flex-col items-start px-4 py-3 rounded-2xl text-xs font-medium border transition-all ${isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-sm mb-1">{t.name}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? "text-indigo-100" : "text-gray-400"}`}>
                      คงเหลือ: <strong className={isSelected ? "text-white" : "text-gray-600"}>{remaining} วัน</strong>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.leave_type_id && <p className={ERROR_CLASS}>{errors.leave_type_id}</p>}
          </div>

          {/* วันที่ */}
          {form.leave_unit === "day" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>วันที่เริ่มลา <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  className={`${INPUT_CLASS} ${errors.start_date ? "border-red-300 focus:ring-red-200" : ""}`}
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
                {errors.start_date && <p className={ERROR_CLASS}>{errors.start_date}</p>}
              </div>
              <div>
                <label className={LABEL_CLASS}>วันที่สิ้นสุด <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  className={`${INPUT_CLASS} ${errors.end_date ? "border-red-300 focus:ring-red-200" : ""}`}
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) => set("end_date", e.target.value)}
                />
                {errors.end_date && <p className={ERROR_CLASS}>{errors.end_date}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>วันที่ลา <span className="text-red-400">*</span></label>
                <input
                  type="date"
                  className={`${INPUT_CLASS} ${errors.start_date ? "border-red-300 focus:ring-red-200" : ""}`}
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                />
                {errors.start_date && <p className={ERROR_CLASS}>{errors.start_date}</p>}
              </div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>เวลาเริ่ม <span className="text-red-400">*</span></label>
                    <TimeField
                      value={form.start_time}
                      onChange={(v) => set("start_time", v)}
                      format="HH:mm"
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          error: !!errors.start_time,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              fontSize: "14px",
                              backgroundColor: "#fff",
                              "& fieldset": { borderColor: errors.start_time ? "#f87171" : "#e5e7eb" },
                              "&:hover fieldset": { borderColor: "#a5b4fc" },
                              "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "2px" },
                            },
                          },
                        },
                      }}
                    />
                    {errors.start_time && <p className={ERROR_CLASS}>{errors.start_time}</p>}
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>เวลาสิ้นสุด <span className="text-red-400">*</span></label>
                    <TimeField
                      value={form.end_time}
                      onChange={(v) => set("end_time", v)}
                      format="HH:mm"
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          error: !!errors.end_time,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              fontSize: "14px",
                              backgroundColor: "#fff",
                              "& fieldset": { borderColor: errors.end_time ? "#f87171" : "#e5e7eb" },
                              "&:hover fieldset": { borderColor: "#a5b4fc" },
                              "&.Mui-focused fieldset": { borderColor: "#6366f1", borderWidth: "2px" },
                            },
                          },
                        },
                      }}
                    />
                    {errors.end_time && <p className={ERROR_CLASS}>{errors.end_time}</p>}
                  </div>
                </div>
              </LocalizationProvider>
            </div>
          )}

          {/* Summary pill */}
          <SummaryPill form={form} />

          {/* เหตุผล */}
          <div>
            <label className={LABEL_CLASS}>เหตุผลการลา <span className="text-red-400">*</span></label>
            <textarea
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
              placeholder="ระบุเหตุผลการลา..."
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
            />
            {errors.reason && <p className={ERROR_CLASS}>{errors.reason}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                กำลังส่ง...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                ส่งคำขอลา
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequestModal;