import { useState, useEffect } from "react";
import { getTodayLeaves } from "../services/leaveService";
import type { LeaveRequest } from "../services/leaveService";
import { DetailDrawer } from "./DetailDrawer"; // 1. นำเข้า DetailDrawer

const TYPE_COLORS: Record<number, string> = {
    1: "bg-sky-100 text-sky-700",
    2: "bg-teal-100 text-teal-700",
    3: "bg-violet-100 text-violet-700",
    4: "bg-orange-100 text-orange-700",
};

export function TodayLeavesWidget() {
    const [todayLeaves, setTodayLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // 2. สร้าง State สำหรับเก็บข้อมูลรายการที่ถูกคลิก
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    useEffect(() => {
        getTodayLeaves()
            .then(setTodayLeaves)
            .catch((err) => console.error("Failed to load today leaves", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 px-1 flex items-center gap-2 text-gray-500">
                ผู้ที่ลาในวันนี้
            </h3>
            <div className="rounded-2xl border overflow-hidden bg-white border-gray-100">
                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : todayLeaves.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">ไม่มีผู้ลาในวันนี้</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {todayLeaves.map((req) => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)} // 3. กำหนดค่าเมื่อถูกคลิก
                                className="flex items-center gap-3 p-3 rounded-xl border transition-colors border-gray-100 bg-slate-50 hover:bg-slate-100 cursor-pointer" // เพิ่ม cursor-pointer
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                                    {req.user?.full_name?.slice(0, 2) ?? "??"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate text-gray-900">{req.user?.full_name}</p>
                                    <p className="text-xs truncate text-gray-500">{req.user?.department}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600"}`}>
                                            {req.leave_type.name}
                                        </span>
                                        {req.leave_unit === "hour" && (
                                            <span className="text-[10px] font-medium whitespace-nowrap text-gray-400">
                                                {req.start_time} - {req.end_time} น.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. แสดง DetailDrawer เมื่อมีการคลิกเลือกรายการ */}
            {selectedRequest && (
                <DetailDrawer
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    // ส่ง function ว่างๆ ไปให้ props onApprove และ onReject เพื่อไม่ให้ Type Error 
                    // (เพราะส่วนใหญ่คนที่ลาวันนี้ สถานะจะเป็น Approved ไปแล้ว ปุ่มจึงไม่แสดงอยู่ดี)
                    onApprove={() => { }}
                    onReject={() => { }}
                />
            )}
        </div>
    );
}