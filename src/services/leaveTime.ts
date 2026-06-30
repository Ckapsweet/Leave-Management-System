import type { Dayjs } from "dayjs";

export const WORK_HOURS_PER_DAY = 8;

export function isUnlimitedSickLeave(name: string | null | undefined): boolean {
  const normalized = String(name ?? "").trim().toLowerCase();
  return normalized.includes("ลาป่วย") || normalized === "sick" || normalized === "sick leave";
}

export function isOffsiteWorkType(name: string | null | undefined): boolean {
  const normalized = String(name ?? "").trim().toLowerCase();
  return normalized.includes("ทำงานนอกสถานที่") || normalized.includes("offsite") || normalized.includes("work outside");
}

export function isUsageOnlyLeaveType(name: string | null | undefined): boolean {
  return isUnlimitedSickLeave(name) || isOffsiteWorkType(name);
}

const LUNCH_START_MINUTE = 12 * 60;
const LUNCH_END_MINUTE = 13 * 60;
const HOURLY_ROUNDING_MINUTES = 30;

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function dayjsToMinutes(value: Dayjs) {
  return value.hour() * 60 + value.minute();
}

function calculateMinutes(startMinute: number | null, endMinute: number | null) {
  if (startMinute === null || endMinute === null || endMinute <= startMinute) return 0;

  const lunchOverlap = Math.max(
    0,
    Math.min(endMinute, LUNCH_END_MINUTE) - Math.max(startMinute, LUNCH_START_MINUTE)
  );

  return Math.max(0, endMinute - startMinute - lunchOverlap);
}

function roundMinutesUp(minutes: number, interval: number) {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / interval) * interval;
}

function calculateRoundedHours(startMinute: number | null, endMinute: number | null) {
  const minutes = calculateMinutes(startMinute, endMinute);
  return round(roundMinutesUp(minutes, HOURLY_ROUNDING_MINUTES) / 60, 1);
}

export function calculateLeaveHours(startTime: Dayjs | null, endTime: Dayjs | null): number;
export function calculateLeaveHours(startTime: string | null | undefined, endTime: string | null | undefined): number;
export function calculateLeaveHours(
  startTime: Dayjs | string | null | undefined,
  endTime: Dayjs | string | null | undefined
): number {
  if (!startTime || !endTime) return 0;

  if (typeof startTime === "string" && typeof endTime === "string") {
    return calculateRoundedHours(timeToMinutes(startTime), timeToMinutes(endTime));
  }

  if (typeof startTime !== "string" && typeof endTime !== "string" && startTime.isValid() && endTime.isValid()) {
    return calculateRoundedHours(dayjsToMinutes(startTime), dayjsToMinutes(endTime));
  }

  return 0;
}

export function calculateLateLeaveHours(startTime: Dayjs | null, endTime: Dayjs | null): number;
export function calculateLateLeaveHours(startTime: string | null | undefined, endTime: string | null | undefined): number;
export function calculateLateLeaveHours(
  startTime: Dayjs | string | null | undefined,
  endTime: Dayjs | string | null | undefined
): number {
  if (!startTime || !endTime) return 0;

  if (typeof startTime === "string" && typeof endTime === "string") {
    return calculateLeaveHours(startTime, endTime);
  }

  if (typeof startTime !== "string" && typeof endTime !== "string") {
    return calculateLeaveHours(startTime, endTime);
  }

  return 0;
}

export function formatLeaveHours(hours: number | string | null | undefined): string {
  const parsed = Number(hours ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return "0 นาที";

  const totalMinutes = Math.round(parsed * 60);
  const hourPart = Math.floor(totalMinutes / 60);
  const minutePart = totalMinutes % 60;
  const parts: string[] = [];

  if (hourPart > 0) parts.push(`${hourPart} ชั่วโมง`);
  if (minutePart > 0) parts.push(`${minutePart} นาที`);

  return parts.join(" ") || "0 นาที";
}

export function formatLeaveDays(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return "0 วัน";
  if (!Number.isInteger(parsed)) return `${Number(parsed.toFixed(2))} วัน`;

  const minutesPerWorkDay = WORK_HOURS_PER_DAY * 60;
  const totalMinutes = Math.round(parsed * minutesPerWorkDay);
  const days = Math.floor(totalMinutes / minutesPerWorkDay);
  const remainingMinutes = totalMinutes % minutesPerWorkDay;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชม.`);
  if (minutes > 0) parts.push(`${minutes} นาที`);
  return parts.join(" ") || "0 วัน";
}

export function formatLeaveRemaining(value: number | string | null | undefined): string {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return "0 วัน";

  const minutesPerWorkDay = WORK_HOURS_PER_DAY * 60;
  const totalMinutes = Math.round(parsed * minutesPerWorkDay);
  const days = Math.floor(totalMinutes / minutesPerWorkDay);
  const remainingMinutes = totalMinutes % minutesPerWorkDay;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชั่วโมง`);
  if (minutes > 0) parts.push(`${minutes} นาที`);

  return parts.join(" ") || "0 วัน";
}

export function formatLeaveUsage(
  totalDays: number | string | null | undefined,
  dayUnits?: number | string | null,
  hours?: number | string | null
): string {
  const parsedDayUnits = Number(dayUnits ?? NaN);
  const parsedHours = Number(hours ?? 0);

  if (Number.isFinite(parsedDayUnits) && parsedDayUnits > 0 && parsedHours > 0) {
    return `${formatLeaveDays(parsedDayUnits)} ${formatLeaveHours(parsedHours)}`;
  }

  if (Number.isFinite(parsedDayUnits) && parsedDayUnits > 0) {
    return formatLeaveDays(parsedDayUnits);
  }

  if (parsedHours > 0) {
    return formatLeaveHours(parsedHours);
  }

  return formatLeaveRemaining(totalDays);
}

export function leaveHoursToDays(hours: number | string | null | undefined): number {
  const parsed = Number(hours ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return round(parsed / WORK_HOURS_PER_DAY, 2);
}
