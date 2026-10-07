import { useState, useEffect } from "react";
import { getThisWeekLeaves, getTodayLeaves } from "../services/leaveService";
import type { LeaveRequest } from "../services/leaveService";
import { isSameDepartment } from "../services/leaveFilters";
import { formatLeaveDays, formatLeaveHours } from "../services/leaveTime";

interface TodayLeavesWidgetProps {
    departmentScope?: string | null;
    supervisorScopeId?: number | string | null;
}

function isSameId(a: number | string | null | undefined, b: number | string | null | undefined) {
    return a != null && b != null && String(a) === String(b);
}

function isOffsiteRequest(request: LeaveRequest) {
    return request.request_type === "offsite";
}

function formatThaiDate(value: string) {
    return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function formatLeaveDateRange(request: LeaveRequest) {
    const start = formatThaiDate(request.start_date);
    const end = request.end_date ? formatThaiDate(request.end_date) : start;
    return start === end ? start : `${start} – ${end}`;
}

function formatLeaveDuration(request: LeaveRequest) {
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

function filterByScope(
    leaves: LeaveRequest[],
    departmentScope?: string | null,
    supervisorScopeId?: number | string | null
) {
    return leaves.filter(
        (leave) =>
            (!departmentScope || isSameDepartment(leave.user?.department, departmentScope)) &&
            (!supervisorScopeId || isSameId(leave.user?.supervisor_id, supervisorScopeId))
    );
}

export function TodayLeavesWidget({ departmentScope = null, supervisorScopeId = null }: TodayLeavesWidgetProps) {
    const [todayLeaves, setTodayLeaves] = useState<LeaveRequest[]>([]);
    const [weekLeaves, setWeekLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

    useEffect(() => {
        Promise.all([getTodayLeaves(), getThisWeekLeaves()])
            .then(([today, week]) => {
                setTodayLeaves(filterByScope(today, departmentScope, supervisorScopeId));
                setWeekLeaves(filterByScope(week, departmentScope, supervisorScopeId));
            })
            .catch((err) => console.error("Failed to load department leaves", err))
            .finally(() => setLoading(false));
    }, [departmentScope, supervisorScopeId]);

    const renderLeaves = (leaves: LeaveRequest[], emptyText: string) => {
        if (loading) {
            return (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (leaves.length === 0) {
            return <div className="py-8 text-center text-sm text-gray-400">{emptyText}</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {leaves.map((req) => (
                    <button
                        type="button"
                        key={req.id}
                        onClick={() => setSelectedLeave(req)}
                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-slate-50 text-left cursor-pointer transition hover:border-indigo-200 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                            {req.user?.full_name?.slice(0, 2) ?? "??"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold truncate text-gray-900">{req.user?.full_name}</p>
                            {isOffsiteRequest(req) && (
                                <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    ทำงานนอกสถานที่
                                </span>
                            )}
                            {req.start_date && (
                                <p className="text-xs font-medium text-indigo-700">
                                    {formatLeaveDateRange(req)} {formatLeaveDuration(req)}
                                </p>
                            )}
                            <p className="text-xs truncate text-gray-500">{req.user?.department}</p>
                            {req.user?.email && <p className="text-xs truncate text-gray-500">{req.user.email}</p>}
                            {req.user?.email_2 && <p className="text-xs truncate text-gray-500">{req.user.email_2}</p>}
                            {req.user?.phone && <p className="text-xs truncate text-gray-500">{req.user.phone}</p>}
                            {req.reason && (
                                <p className="text-xs leading-5 text-gray-500">
                                    <span className="font-medium text-gray-600">หมายเหตุ:</span> {req.reason}
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full space-y-6">
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 px-1 flex items-center gap-2 text-gray-500">
                    ผู้ที่ลาในวันนี้
                </h3>
                <div className="rounded-2xl border overflow-hidden bg-white border-gray-100">
                    {renderLeaves(todayLeaves, "ไม่มีผู้ลาในวันนี้")}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 px-1 flex items-center gap-2 text-gray-500">
                    ผู้ที่ลาในสัปดาห์นี้
                </h3>
                <div className="rounded-2xl border overflow-hidden bg-white border-gray-100">
                    {renderLeaves(weekLeaves, "ไม่มีผู้ลาในสัปดาห์นี้")}
                </div>
            </div>

            {selectedLeave && <LeaveDetailModal request={selectedLeave} onClose={() => setSelectedLeave(null)} />}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex gap-4 py-2 border-b border-gray-100 last:border-b-0">
            <span className="w-28 flex-shrink-0 text-sm text-gray-500">{label}</span>
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 break-words whitespace-pre-wrap">{value}</span>
        </div>
    );
}

function LeaveDetailModal({ request, onClose }: { request: LeaveRequest; onClose: () => void }) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const duration = formatLeaveDuration(request).replace(/^\((.*)\)$/, "$1");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                        {request.user?.full_name?.slice(0, 2) ?? "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900">{request.user?.full_name}</h3>
                        <p className="text-sm text-gray-500">{request.user?.department}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="ปิด"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="rounded-xl bg-indigo-50 px-4 py-3">
                        <p className="text-xs font-medium text-indigo-500">วันที่ลา</p>
                        <p className="text-base font-semibold text-indigo-800">{formatLeaveDateRange(request)}</p>
                        {duration && <p className="text-sm text-indigo-700">{duration}</p>}
                    </div>

                    <div>
                        <DetailRow label="ประเภท" value={isOffsiteRequest(request) ? "ทำงานนอกสถานที่" : request.leave_type?.name} />
                        <DetailRow label="หมายเหตุ" value={request.reason} />
                        <DetailRow label="อีเมล" value={request.user?.email} />
                        <DetailRow label="อีเมลสำรอง" value={request.user?.email_2} />
                        <DetailRow label="เบอร์โทร" value={request.user?.phone} />
                    </div>
                </div>

                <div className="px-6 pb-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
