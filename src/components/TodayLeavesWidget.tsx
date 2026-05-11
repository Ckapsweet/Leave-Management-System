import { useState, useEffect } from "react";
import { getThisWeekLeaves, getTodayLeaves } from "../services/leaveService";
import type { LeaveRequest } from "../services/leaveService";

export function TodayLeavesWidget() {
    const [todayLeaves, setTodayLeaves] = useState<LeaveRequest[]>([]);
    const [weekLeaves, setWeekLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getTodayLeaves(), getThisWeekLeaves()])
            .then(([today, week]) => {
                setTodayLeaves(today);
                setWeekLeaves(week);
            })
            .catch((err) => console.error("Failed to load department leaves", err))
            .finally(() => setLoading(false));
    }, []);

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
                    <div
                        key={req.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-slate-50"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                            {req.user?.full_name?.slice(0, 2) ?? "??"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold truncate text-gray-900">{req.user?.full_name}</p>
                            <p className="text-xs truncate text-gray-500">{req.user?.department}</p>
                            {req.user?.email && <p className="text-xs truncate text-gray-500">{req.user.email}</p>}
                            {req.user?.email_2 && <p className="text-xs truncate text-gray-500">{req.user.email_2}</p>}
                            {req.user?.phone && <p className="text-xs truncate text-gray-500">{req.user.phone}</p>}
                        </div>
                    </div>
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
        </div>
    );
}
