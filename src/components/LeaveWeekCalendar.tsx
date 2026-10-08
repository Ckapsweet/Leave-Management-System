import { useMemo, useState } from "react";
import dayjs from "dayjs";
import type { LeaveRequest } from "../services/leaveService";
import { coversDate, formatLeaveDuration, isOffsiteRequest, leaveTypeLabel, leaveUserKey } from "./leaveDisplay";
import { printLeaveReport } from "./leaveReport";
import type { LeaveReportDay } from "./leaveReport";

// แสดงวันนี้ + 13 วันข้างหน้า (2 สัปดาห์)
export const CALENDAR_DAYS = 14;

interface LeaveWeekCalendarProps {
    requests: LeaveRequest[];
    loading: boolean;
    onSelectUser: (userKey: string) => void;
}

function chipTone(request: LeaveRequest) {
    if (isOffsiteRequest(request)) return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    if (request.request_type === "late") return "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100";
    return "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100";
}

export function LeaveWeekCalendar({ requests, loading, onSelectUser }: LeaveWeekCalendarProps) {
    const [printBlocked, setPrintBlocked] = useState(false);

    // แต่ละวันมีรายการลาที่ครอบคลุมวันนั้น
    const days: LeaveReportDay[] = useMemo(() => {
        const today = dayjs();
        return Array.from({ length: CALENDAR_DAYS }, (_, index) => {
            const date = today.add(index, "day").format("YYYY-MM-DD");
            const dayRequests = requests
                .filter((request) => coversDate(request, date))
                .sort((a, b) => String(a.user?.full_name ?? "").localeCompare(String(b.user?.full_name ?? ""), "th"));
            return { date, requests: dayRequests };
        });
    }, [requests]);

    const handlePrint = () => {
        setPrintBlocked(!printLeaveReport(days));
    };

    const rangeLabel = `${dayjs(days[0].date).toDate().toLocaleDateString("th-TH", { day: "numeric", month: "short" })} – ${dayjs(days[days.length - 1].date).toDate().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`;

    return (
        <div>
            <div className="mb-3 px-1 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    ผู้ที่ลาใน 2 สัปดาห์นี้ <span className="normal-case font-normal text-gray-400">({rangeLabel})</span>
                </h3>
                <button
                    type="button"
                    onClick={handlePrint}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M6 9V2h12v7" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    พิมพ์รายงาน
                </button>
            </div>
            {printBlocked && (
                <p className="mb-2 px-1 text-xs text-red-500">เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต pop-up สำหรับเว็บนี้แล้วลองใหม่</p>
            )}

            <div className="rounded-2xl border overflow-hidden bg-white border-gray-100">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-px bg-gray-100">
                        {days.map((day, index) => {
                            const date = dayjs(day.date);
                            const isToday = index === 0;
                            const isWeekend = date.day() === 0 || date.day() === 6;
                            return (
                                <div
                                    key={day.date}
                                    data-testid={`calendar-day-${day.date}`}
                                    className={`flex min-h-[9rem] flex-col ${isToday ? "bg-indigo-50" : isWeekend ? "bg-gray-50" : "bg-white"}`}
                                >
                                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                                        <div>
                                            <p className={`text-xs ${isToday ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>
                                                {date.toDate().toLocaleDateString("th-TH", { weekday: "short" })}
                                                {isToday && " · วันนี้"}
                                            </p>
                                            <p className={`text-lg font-bold leading-6 ${isToday ? "text-indigo-700" : "text-gray-900"}`}>
                                                {date.date()}{" "}
                                                <span className="text-xs font-medium text-gray-500">
                                                    {date.toDate().toLocaleDateString("th-TH", { month: "short" })}
                                                </span>
                                            </p>
                                        </div>
                                        {day.requests.length > 0 && (
                                            <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                                                {day.requests.length} คน
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1.5 px-2 pb-3 max-h-64 overflow-y-auto">
                                        {day.requests.length === 0 ? (
                                            <p className="px-1 text-xs text-gray-400">ไม่มีผู้ลา</p>
                                        ) : (
                                            day.requests.map((request) => {
                                                const duration = formatLeaveDuration(request).replace(/^\((.*)\)$/, "$1");
                                                return (
                                                    <button
                                                        type="button"
                                                        key={request.id}
                                                        onClick={() => onSelectUser(leaveUserKey(request))}
                                                        title={[request.user?.full_name, leaveTypeLabel(request), request.reason].filter(Boolean).join(" · ")}
                                                        className={`w-full rounded-lg border px-2 py-1.5 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${chipTone(request)}`}
                                                    >
                                                        <span className="block truncate text-xs font-semibold">{request.user?.full_name}</span>
                                                        <span className="block truncate text-[11px] opacity-80">
                                                            {[leaveTypeLabel(request), duration].filter(Boolean).join(" · ")}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-2 flex flex-wrap gap-3 px-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />ลา</span>
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />ทำงานนอกสถานที่</span>
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />มาสาย</span>
            </div>
        </div>
    );
}

export default LeaveWeekCalendar;
