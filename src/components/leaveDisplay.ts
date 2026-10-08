import dayjs from "dayjs";
import type { LeaveRequest } from "../services/leaveService";
import { formatLeaveDays, formatLeaveHours } from "../services/leaveTime";

export function isOffsiteRequest(request: LeaveRequest) {
    return request.request_type === "offsite";
}

export function formatThaiDate(value: string) {
    return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function formatLeaveDateRange(request: LeaveRequest) {
    const start = formatThaiDate(request.start_date);
    const end = request.end_date ? formatThaiDate(request.end_date) : start;
    return start === end ? start : `${start} – ${end}`;
}

export function formatLeaveDuration(request: LeaveRequest) {
    if (request.leave_unit === "hour") {
        const time = request.start_time && request.end_time
            ? `${request.start_time.slice(0, 5)}–${request.end_time.slice(0, 5)} น.`
            : null;
        const hours = request.total_hours ? formatLeaveHours(request.total_hours) : null;
        return [time, hours && `(${hours})`].filter(Boolean).join(" ");
    }
    if (request.leave_unit === "half_day") return "ครึ่งวัน";
    return request.total_days ? `(${formatLeaveDays(request.total_days)})` : "";
}

export function leaveTypeLabel(request: LeaveRequest) {
    return isOffsiteRequest(request) ? "ทำงานนอกสถานที่" : request.leave_type?.name;
}

// วันที่จาก API อาจเป็น "2026-10-12" หรือ ISO (UTC) → แปลงเป็นวันที่ตามเวลาเครื่อง
export function toDateKey(value?: string | null) {
    return value ? dayjs(value).format("YYYY-MM-DD") : "";
}

// ใช้ระบุคนลาเดียวกันข้ามหลายรายการ
export function leaveUserKey(request: LeaveRequest) {
    return String(request.user_id ?? request.user?.id ?? `request-${request.id}`);
}

export function coversDate(request: LeaveRequest, dateKey: string) {
    const start = toDateKey(request.start_date);
    const end = toDateKey(request.end_date) || start;
    return start <= dateKey && dateKey <= end;
}
