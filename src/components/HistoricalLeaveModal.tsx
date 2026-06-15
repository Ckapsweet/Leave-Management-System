import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { LeaveType, LeaveUnit, RequestKind } from "../services/leaveService";
import type { EmployeeWithBalance } from "./adminHelpers";
import { formatLeaveDays, formatLeaveUsage } from "../services/leaveTime";

export interface HistoricalLeaveForm {
  user_id: number;
  leave_type_id: number;
  leave_unit: LeaveUnit;
  request_type: RequestKind;
  start_date: string;
  end_date: string;
  start_time: ReturnType<typeof dayjs> | null;
  end_time: ReturnType<typeof dayjs> | null;
  reason: string;
}

interface HistoricalLeaveModalProps {
  employees: EmployeeWithBalance[];
  leaveTypes: LeaveType[];
  loading: boolean;
  initialForm?: HistoricalLeaveForm;
  mode?: "create" | "edit";
  onSubmit: (form: HistoricalLeaveForm) => Promise<void>;
  onClose: () => void;
}

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white";
const LABEL = "block text-xs font-medium text-gray-500 mb-1.5";
const HOURS_24 = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

export function HistoricalLeaveModal({
  employees,
  leaveTypes,
  loading,
  initialForm,
  mode = "create",
  onSubmit,
  onClose,
}: HistoricalLeaveModalProps) {
  const [form, setForm] = useState<HistoricalLeaveForm>({
    user_id: initialForm?.user_id ?? employees[0]?.id ?? 0,
    leave_type_id: initialForm?.leave_type_id ?? leaveTypes[0]?.id ?? 0,
    leave_unit: initialForm?.leave_unit ?? "day",
    request_type: initialForm?.request_type ?? "leave",
    start_date: initialForm?.start_date ?? "",
    end_date: initialForm?.end_date ?? "",
    start_time: initialForm?.start_time ?? null,
    end_time: initialForm?.end_time ?? null,
    reason: initialForm?.reason ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      user_id: current.user_id || employees[0]?.id || 0,
      leave_type_id: current.leave_type_id || leaveTypes[0]?.id || 0,
    }));
  }, [employees, leaveTypes]);

  useEffect(() => {
    if (form.leave_unit === "hour" && form.start_date) {
      setForm((current) => ({ ...current, end_date: current.start_date }));
    }
  }, [form.leave_unit, form.start_date]);

  const selectedEmployee = employees.find((employee) => employee.id === form.user_id);
  const selectedType = leaveTypes.find((type) => type.id === form.leave_type_id);
  const errors = validateHistoricalLeave(form);

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) =>
      [employee.full_name, employee.employee_code, employee.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [employeeSearch, employees]);

  const set = <K extends keyof HistoricalLeaveForm>(key: K, value: HistoricalLeaveForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setMode = (requestType: RequestKind, unit: LeaveUnit) => {
    setForm((current) => ({
      ...current,
      request_type: requestType,
      leave_unit: unit,
      end_date: unit === "hour" || unit === "half_day" ? current.start_date : current.end_date,
      start_time: unit === "day" || unit === "half_day" ? null : current.start_time,
      end_time: unit === "day" || unit === "half_day" ? null : current.end_time,
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M8 2v4M16 2v4M3 10h18" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M12 14v4M10 16h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{mode === "edit" ? "แก้ไขรายการลา" : "เพิ่มประวัติการลาย้อนหลัง"}</h2>
            <p className="text-xs text-gray-400">{mode === "edit" ? "แก้ไขรายละเอียดรายการลาและปรับยอดวันลาให้อัตโนมัติ" : "บันทึกรายการลาในอดีตให้พนักงานโดยตรง"}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className={LABEL}>พนักงาน *</label>
            <input
              className={`${INPUT} mb-2`}
              placeholder="ค้นหาชื่อ รหัส หรือแผนก..."
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
            />
            <select
              className={`${INPUT} ${submitted && errors.user_id ? "border-red-300" : ""}`}
              value={form.user_id}
              onChange={(event) => set("user_id", Number(event.target.value))}
            >
              <option value={0} disabled>เลือกพนักงาน...</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code}) - {employee.department}
                </option>
              ))}
            </select>
            {submitted && errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
          </div>

          {selectedEmployee?.pool && (
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-slate-50 p-3">
              <BalanceStat label="สิทธิ์รวม" value={formatLeaveDays(selectedEmployee.pool.total_days)} />
              <BalanceStat label="ใช้ไปแล้ว" value={formatLeaveUsage(selectedEmployee.pool.used_days, selectedEmployee.pool.used_day_units, selectedEmployee.pool.used_hours)} />
              <BalanceStat label="คงเหลือ" value={formatLeaveDays(Math.max(0, selectedEmployee.pool.total_days - selectedEmployee.pool.used_days))} />
            </div>
          )}

          <div>
            <label className={LABEL}>รูปแบบรายการ</label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { label: "ลาเป็นวัน", requestType: "leave" as const, unit: "day" as const },
                { label: "ลาครึ่งวัน", requestType: "leave" as const, unit: "half_day" as const },
                { label: "ลาเป็นชั่วโมง", requestType: "leave" as const, unit: "hour" as const },
                { label: "มาสาย", requestType: "late" as const, unit: "hour" as const },
              ].map((option) => {
                const selected = form.request_type === option.requestType && form.leave_unit === option.unit;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setMode(option.requestType, option.unit)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? "bg-slate-800 text-white border-slate-800"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL}>ประเภทการลา *</label>
            <select
              className={`${INPUT} ${submitted && errors.leave_type_id ? "border-red-300" : ""}`}
              value={form.leave_type_id}
              onChange={(event) => set("leave_type_id", Number(event.target.value))}
            >
              <option value={0} disabled>เลือกประเภทการลา...</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {selectedType && <p className="text-xs text-gray-400 mt-1">{selectedType.description}</p>}
            {submitted && errors.leave_type_id && <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>}
          </div>

          {form.leave_unit === "day" ? (
            <div className="grid grid-cols-2 gap-4">
              <DateInput label="วันที่เริ่มลา" value={form.start_date} error={submitted ? errors.start_date : undefined} onChange={(value) => set("start_date", value)} />
              <DateInput label="วันที่สิ้นสุด" value={form.end_date} min={form.start_date} error={submitted ? errors.end_date : undefined} onChange={(value) => set("end_date", value)} />
            </div>
          ) : form.leave_unit === "half_day" ? (
            <DateInput label="วันที่ลา" value={form.start_date} error={submitted ? errors.start_date : undefined} onChange={(value) => set("start_date", value)} />
          ) : (
            <div className="space-y-4">
              <DateInput label={form.request_type === "late" ? "วันที่มาสาย" : "วันที่ลา"} value={form.start_date} error={submitted ? errors.start_date : undefined} onChange={(value) => set("start_date", value)} />
              <div className="grid grid-cols-2 gap-4">
                <TimeInput
                  label={form.request_type === "late" ? "เวลาเข้างานปกติ" : "เวลาเริ่ม"}
                  value={form.start_time?.format("HH:mm") ?? ""}
                  error={submitted ? errors.start_time : undefined}
                  onChange={(value) => set("start_time", value ? dayjs(`${form.start_date || "2000-01-01"} ${value}`) : null)}
                />
                <TimeInput
                  label={form.request_type === "late" ? "เวลาเข้างานจริง" : "เวลาสิ้นสุด"}
                  value={form.end_time?.format("HH:mm") ?? ""}
                  error={submitted ? errors.end_time : undefined}
                  onChange={(value) => set("end_time", value ? dayjs(`${form.start_date || "2000-01-01"} ${value}`) : null)}
                />
              </div>
            </div>
          )}

          <div>
            <label className={LABEL}>เหตุผล / หมายเหตุ *</label>
            <textarea
              className={`${INPUT} resize-none ${submitted && errors.reason ? "border-red-300" : ""}`}
              rows={3}
              placeholder="ระบุเหตุผลหรือหมายเหตุของรายการย้อนหลัง..."
              value={form.reason}
              onChange={(event) => set("reason", event.target.value)}
            />
            {submitted && errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mode === "edit" ? "บันทึกการแก้ไข" : "บันทึกย้อนหลัง"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function DateInput({
  label,
  value,
  min,
  error,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={LABEL}>{label} *</label>
      <input
        type="date"
        className={`${INPUT} ${error ? "border-red-300" : ""}`}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function TimeInput({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [hour = "", minute = ""] = value.split(":");

  const updateTime = (nextHour: string, nextMinute: string) => {
    if (!nextHour && !nextMinute) {
      onChange("");
      return;
    }
    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  };

  return (
    <div>
      <label className={LABEL}>{label} *</label>
      <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border bg-white px-3 py-2 ${error ? "border-red-300" : "border-gray-200"} focus-within:ring-2 focus-within:ring-slate-300`}>
        <select
          className="w-full bg-transparent text-sm focus:outline-none"
          value={hour}
          onChange={(event) => updateTime(event.target.value, minute)}
          aria-label={`${label} ชั่วโมง`}
        >
          <option value="">--</option>
          {HOURS_24.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span className="text-sm font-semibold text-gray-400">:</span>
        <select
          className="w-full bg-transparent text-sm focus:outline-none"
          value={minute}
          onChange={(event) => updateTime(hour, event.target.value)}
          aria-label={`${label} นาที`}
        >
          <option value="">--</option>
          {MINUTES.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function validateHistoricalLeave(form: HistoricalLeaveForm) {
  const errors: Record<string, string> = {};
  if (!form.user_id) errors.user_id = "กรุณาเลือกพนักงาน";
  if (!form.leave_type_id) errors.leave_type_id = "กรุณาเลือกประเภทการลา";
  if (!form.start_date) errors.start_date = "กรุณาระบุวันที่";
  if (form.leave_unit === "day") {
    if (!form.end_date) errors.end_date = "กรุณาระบุวันที่สิ้นสุด";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errors.end_date = "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม";
    }
  }
  if (form.leave_unit === "hour") {
    if (!form.start_time || !form.start_time.isValid()) errors.start_time = "กรุณาระบุเวลาเริ่ม";
    if (!form.end_time || !form.end_time.isValid()) {
      errors.end_time = "กรุณาระบุเวลาสิ้นสุด";
    } else if (form.start_time && form.end_time.isBefore(form.start_time)) {
      errors.end_time = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";
    }
  }
  if (!form.reason.trim()) errors.reason = "กรุณาระบุเหตุผล";
  return errors;
}

export default HistoricalLeaveModal;
