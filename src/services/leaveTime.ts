import type { Dayjs } from "dayjs";

export const WORK_HOURS_PER_DAY = 7.5;

const LUNCH_START_MINUTE = 12 * 60;
const LUNCH_END_MINUTE = 13 * 60;

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

export function calculateLeaveHours(startTime: Dayjs | null, endTime: Dayjs | null): number;
export function calculateLeaveHours(startTime: string | null | undefined, endTime: string | null | undefined): number;
export function calculateLeaveHours(
  startTime: Dayjs | string | null | undefined,
  endTime: Dayjs | string | null | undefined
): number {
  if (!startTime || !endTime) return 0;

  if (typeof startTime === "string" && typeof endTime === "string") {
    return round(calculateMinutes(timeToMinutes(startTime), timeToMinutes(endTime)) / 60, 1);
  }

  if (typeof startTime !== "string" && typeof endTime !== "string" && startTime.isValid() && endTime.isValid()) {
    return round(calculateMinutes(dayjsToMinutes(startTime), dayjsToMinutes(endTime)) / 60, 1);
  }

  return 0;
}

export function leaveHoursToDays(hours: number | string | null | undefined): number {
  const parsed = Number(hours ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return round(parsed / WORK_HOURS_PER_DAY, 2);
}
