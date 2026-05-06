import { useEffect, useState } from "react";
import type { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { toast } from "./Toast";
import type { LeavePool } from "../services/leaveService";

type LeaveUnit = "day" | "hour";
type RequestKind = "leave" | "late";

interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days: number;
}

export interface LeaveRequestForm {
  request_type: RequestKind;
  leave_type_id: number;
  leave_unit: LeaveUnit;
  start_date: string;
  end_date: string;
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  reason: string;
  attachments: File[];
}

export interface LeaveRequestModalProps {
  leaveTypes: LeaveType[];
  pool: LeavePool | null;
  onSubmit: (form: LeaveRequestForm) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  leave_type_id?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5";
const INPUT_CLASS = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow bg-white";
const ERROR_CLASS = "text-xs text-red-500 mt-1";

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
  const day = new Date(dateStr).getUTCDay();
  return day === 0 || day === 6;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${Math.round((size / (1024 * 1024)) * 10) / 10} MB`;
}

function isAllowedAttachment(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
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

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UnitToggle({
  value,
  requestType,
  onChange,
}: {
  value: LeaveUnit;
  requestType: RequestKind;
  onChange: (requestType: RequestKind, unit: LeaveUnit) => void;
}) {
  const options = [
    { key: "day", requestType: "leave" as const, unit: "day" as const, label: "ลาเป็นวัน" },
    { key: "hour", requestType: "leave" as const, unit: "hour" as const, label: "ลาเป็นชั่วโมง" },
    { key: "late", requestType: "late" as const, unit: "hour" as const, label: "ลาสาย" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = requestType === option.requestType && value === option.unit;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.requestType, option.unit)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              selected
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.unit === "day" ? <CalendarIcon /> : <ClockIcon />}
            {option.label}
          </button>
        );
      })}
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
      <span className="text-xs text-indigo-600 font-medium">{form.request_type === "late" ? "ลาสาย" : "รวม"}</span>
      <span className="text-sm font-bold text-indigo-700">{hours} ชั่วโมง</span>
    </div>
  );
}

export function LeaveRequestModal({ leaveTypes, pool, onSubmit, onClose, isLoading = false }: LeaveRequestModalProps) {
  const [form, setForm] = useState<LeaveRequestForm>({
    request_type: "leave",
    leave_type_id: 0,
    leave_unit: "day",
    start_date: "",
    end_date: "",
    start_time: null,
    end_time: null,
    reason: "",
    attachments: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (form.leave_unit === "hour" && form.start_date) setForm((f) => ({ ...f, end_date: f.start_date }));
    if (form.leave_unit === "day") setForm((f) => ({ ...f, request_type: "leave", start_time: null, end_time: null }));
  }, [form.leave_unit, form.start_date]);

  const set = <K extends keyof LeaveRequestForm>(key: K, value: LeaveRequestForm[K]) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  };

  const setRequestMode = (requestType: RequestKind, unit: LeaveUnit) => {
    const updated = { ...form, request_type: requestType, leave_unit: unit };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  };

  const removeAttachment = (index: number) => {
    const updated = { ...form, attachments: form.attachments.filter((_, i) => i !== index) };
    setForm(updated);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await onSubmit(form);
      toast.success(form.request_type === "late" ? "ส่งคำขอลาสายสำเร็จ!" : "ส่งคำขอลาสำเร็จ!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isLate = form.request_type === "late";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{isLate ? "ยื่นคำขอลาสาย" : "ยื่นคำขอลา"}</h2>
              <p className="text-xs text-gray-400">{isLate ? "กรอกข้อมูลการมาสายให้ครบถ้วน" : "กรอกข้อมูลการลาให้ครบถ้วน"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          <div>
            <label className={LABEL_CLASS}>รูปแบบคำขอ</label>
            <UnitToggle value={form.leave_unit} requestType={form.request_type} onChange={setRequestMode} />
          </div>

          <div>
            <label className={LABEL_CLASS}>
              {isLate ? "ประเภทที่ใช้บันทึก" : "ประเภทการลา"} <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {leaveTypes.map((t) => {
                const bal = pool?.balances?.find((b) => b.leave_type_id === t.id);
                const remaining = bal ? bal.remaining : 0;
                const isSelected = form.leave_type_id === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set("leave_type_id", t.id)}
                    className={`flex flex-col items-start px-4 py-3 rounded-2xl text-xs font-medium border transition-all ${
                      isSelected
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
                <label className={LABEL_CLASS}>{isLate ? "วันที่ลาสาย" : "วันที่ลา"} <span className="text-red-400">*</span></label>
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
                    <label className={LABEL_CLASS}>{isLate ? "เวลาเริ่มงานปกติ" : "เวลาเริ่ม"} <span className="text-red-400">*</span></label>
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
                    <label className={LABEL_CLASS}>{isLate ? "เวลาเข้างานจริง" : "เวลาสิ้นสุด"} <span className="text-red-400">*</span></label>
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

          <SummaryPill form={form} />

          <div>
            <label className={LABEL_CLASS}>{isLate ? "เหตุผลการลาสาย" : "เหตุผลการลา"} <span className="text-red-400">*</span></label>
            <textarea
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
              placeholder={isLate ? "ระบุเหตุผลการลาสาย..." : "ระบุเหตุผลการลา..."}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
            />
            {errors.reason && <p className={ERROR_CLASS}>{errors.reason}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>ไฟล์แนบประกอบเหตุผล</label>
            <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-4 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span>เลือกไฟล์แนบ</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  const allowed = selected.filter(isAllowedAttachment);
                  if (allowed.length !== selected.length) {
                    toast.error("แนบได้เฉพาะไฟล์รูปภาพหรือ PDF");
                  }
                  set("attachments", [...form.attachments, ...allowed]);
                  e.target.value = "";
                }}
              />
            </label>
            {form.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {form.attachments.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-700">{file.name}</p>
                      <p className="text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                {isLate ? "ส่งคำขอลาสาย" : "ส่งคำขอลา"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequestModal;
