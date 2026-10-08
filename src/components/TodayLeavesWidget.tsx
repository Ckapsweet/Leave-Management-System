import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { getThisWeekLeaves, getTodayLeaves, updateAdminLeaveRequest, updateMyOffsiteRequest } from "../services/leaveService";
import type { LeaveRequest } from "../services/leaveService";
import { readStoredUser } from "../services/authSession";
import type { AuthUser } from "../services/authService";
import { isSameDepartment } from "../services/leaveFilters";
import { formatLeaveDateRange, formatLeaveDuration, isOffsiteRequest, leaveTypeLabel, leaveUserKey, toDateKey } from "./leaveDisplay";
import { CALENDAR_DAYS, LeaveWeekCalendar } from "./LeaveWeekCalendar";

interface TodayLeavesWidgetProps {
    departmentScope?: string | null;
    supervisorScopeId?: number | string | null;
}

interface LeaveGroup {
    key: string;
    user: LeaveRequest["user"];
    requests: LeaveRequest[];
}

function isSameId(a: number | string | null | undefined, b: number | string | null | undefined) {
    return a != null && b != null && String(a) === String(b);
}

// ผู้ดูแลแก้ได้ทุกรายการ (ผ่าน API admin ที่ปรับยอดวันลาให้) ส่วนเจ้าของแก้ได้เฉพาะรายการนอกสถานที่ของตัวเอง
const LEAVE_EDITOR_ROLES = ["admin", "manager", "hr"];

function isLeaveEditor(user: AuthUser | null) {
    return !!user && LEAVE_EDITOR_ROLES.includes(user.role);
}

function isOwnOffsite(request: LeaveRequest, user: AuthUser | null) {
    return !!user && isOffsiteRequest(request) && isSameId(request.user_id, user.id);
}

function canEditRequest(request: LeaveRequest, user: AuthUser | null) {
    return isLeaveEditor(user) || isOwnOffsite(request, user);
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

// รวมรายการลาของคนเดียวกันไว้ในการ์ดเดียว เช่น ลานอกสถานที่วันที่ 10 และ 13
function groupByUser(leaves: LeaveRequest[]): LeaveGroup[] {
    const groups = new Map<string, LeaveGroup>();
    leaves.forEach((leave) => {
        const key = leaveUserKey(leave);
        const group = groups.get(key);
        if (group) group.requests.push(leave);
        else groups.set(key, { key, user: leave.user, requests: [leave] });
    });
    return Array.from(groups.values()).map((group) => ({
        ...group,
        requests: [...group.requests].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date))),
    }));
}

export function TodayLeavesWidget({ departmentScope = null, supervisorScopeId = null }: TodayLeavesWidgetProps) {
    const [todayLeaves, setTodayLeaves] = useState<LeaveGroup[]>([]);
    const [weekLeaves, setWeekLeaves] = useState<LeaveGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<LeaveGroup | null>(null);
    const [currentUser] = useState(() => readStoredUser());

    const fetchGroups = useCallback(async () => {
        const [today, week] = await Promise.all([getTodayLeaves(), getThisWeekLeaves(CALENDAR_DAYS)]);
        return {
            todayGroups: groupByUser(filterByScope(today, departmentScope, supervisorScopeId)),
            weekGroups: groupByUser(filterByScope(week, departmentScope, supervisorScopeId)),
        };
    }, [departmentScope, supervisorScopeId]);

    useEffect(() => {
        fetchGroups()
            .then(({ todayGroups, weekGroups }) => {
                setTodayLeaves(todayGroups);
                setWeekLeaves(weekGroups);
            })
            .catch((err) => console.error("Failed to load department leaves", err))
            .finally(() => setLoading(false));
    }, [fetchGroups]);

    // หลังแก้ไข โหลดข้อมูลใหม่แล้วเปิด popup ของคนเดิมต่อ (ปิดถ้าไม่มีรายการเหลือในช่วงนี้แล้ว)
    const handleSaved = async (key: string) => {
        const { todayGroups, weekGroups } = await fetchGroups();
        setTodayLeaves(todayGroups);
        setWeekLeaves(weekGroups);
        setSelectedGroup(weekGroups.find((group) => group.key === key) ?? todayGroups.find((group) => group.key === key) ?? null);
    };

    const weekRequests = useMemo(() => weekLeaves.flatMap((group) => group.requests), [weekLeaves]);

    const renderLeaves = (groups: LeaveGroup[], emptyText: string) => {
        if (loading) {
            return (
                <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (groups.length === 0) {
            return <div className="py-8 text-center text-sm text-gray-400">{emptyText}</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {groups.map((group) => {
                    const { user, requests } = group;
                    const reasons = Array.from(new Set(requests.map((req) => req.reason).filter(Boolean)));
                    return (
                        <button
                            type="button"
                            key={group.key}
                            onClick={() => setSelectedGroup(weekLeaves.find((weekGroup) => weekGroup.key === group.key) ?? group)}
                            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-slate-50 text-left cursor-pointer transition hover:border-indigo-200 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                                {user?.full_name?.slice(0, 2) ?? "??"}
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-sm font-semibold break-words text-gray-900">{user?.full_name}</p>
                                {requests.some(isOffsiteRequest) && (
                                    <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                        ทำงานนอกสถานที่
                                    </span>
                                )}
                                <div className={requests.length > 3 ? "max-h-[4.5rem] overflow-y-auto pr-1" : undefined}>
                                    {requests.filter((req) => req.start_date).map((req) => (
                                        <p key={req.id} className="text-xs leading-6 font-medium text-indigo-700">
                                            {formatLeaveDateRange(req)} {formatLeaveDuration(req)}
                                        </p>
                                    ))}
                                </div>
                                <p className="text-xs break-words text-gray-500">{user?.department}</p>
                                {user?.email && <p className="text-xs break-all text-gray-500">{user.email}</p>}
                                {user?.email_2 && <p className="text-xs break-all text-gray-500">{user.email_2}</p>}
                                {user?.phone && <p className="text-xs break-words text-gray-500">{user.phone}</p>}
                                {reasons.length > 0 && (
                                    <p className="text-xs leading-5 text-gray-500">
                                        <span className="font-medium text-gray-600">หมายเหตุ:</span> {reasons.join(", ")}
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
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

            <LeaveWeekCalendar
                requests={weekRequests}
                loading={loading}
                onSelectUser={(key) => setSelectedGroup(weekLeaves.find((group) => group.key === key) ?? null)}
            />

            {selectedGroup && (
                <LeaveDetailModal
                    group={selectedGroup}
                    currentUser={currentUser}
                    onSaved={handleSaved}
                    onClose={() => setSelectedGroup(null)}
                />
            )}
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

interface LeaveDraft {
    start_date: string;
    end_date: string;
    reason: string;
}

const EDIT_INPUT =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300";

function saveLeaveEdit(request: LeaveRequest, draft: LeaveDraft, currentUser: AuthUser | null) {
    const singleDay = request.leave_unit === "hour" || request.leave_unit === "half_day";
    const endDate = singleDay ? draft.start_date : draft.end_date;
    const reason = draft.reason.trim();

    if (isOwnOffsite(request, currentUser)) {
        return updateMyOffsiteRequest(request.id, { start_date: draft.start_date, end_date: endDate, reason });
    }

    const timeOn = (time?: string) => (time ? dayjs(`${draft.start_date} ${time.slice(0, 5)}`) : null);
    return updateAdminLeaveRequest(request.id, {
        user_id: request.user_id,
        leave_type_id: request.leave_type_id,
        leave_unit: request.leave_unit,
        request_type: request.request_type ?? "leave",
        start_date: draft.start_date,
        end_date: endDate,
        start_time: request.leave_unit === "hour" ? timeOn(request.start_time) : null,
        end_time: request.leave_unit === "hour" ? timeOn(request.end_time) : null,
        reason,
        status: request.status,
    });
}

function LeaveEditForm({
    request,
    currentUser,
    onCancel,
    onSaved,
}: {
    request: LeaveRequest;
    currentUser: AuthUser | null;
    onCancel: () => void;
    onSaved: () => Promise<void>;
}) {
    const singleDay = request.leave_unit === "hour" || request.leave_unit === "half_day";
    const [draft, setDraft] = useState<LeaveDraft>({
        start_date: toDateKey(request.start_date),
        end_date: toDateKey(request.end_date || request.start_date),
        reason: request.reason ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!draft.start_date || (!singleDay && !draft.end_date) || !draft.reason.trim()) {
            setError("กรุณากรอกวันที่และหมายเหตุให้ครบ");
            return;
        }
        if (!singleDay && draft.end_date < draft.start_date) {
            setError("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม");
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await saveLeaveEdit(request, draft, currentUser);
            await onSaved();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || "บันทึกไม่สำเร็จ");
            setSaving(false);
        }
    };

    return (
        <div className="mt-3 space-y-3 rounded-lg border border-indigo-100 bg-white p-3">
            <div className={singleDay ? "" : "grid grid-cols-2 gap-2"}>
                <label className="block text-xs font-medium text-gray-500">
                    {singleDay ? "วันที่" : "วันที่เริ่ม"}
                    <input
                        type="date"
                        className={`${EDIT_INPUT} mt-1`}
                        value={draft.start_date}
                        onChange={(event) => setDraft((current) => ({ ...current, start_date: event.target.value }))}
                    />
                </label>
                {!singleDay && (
                    <label className="block text-xs font-medium text-gray-500">
                        วันที่สิ้นสุด
                        <input
                            type="date"
                            className={`${EDIT_INPUT} mt-1`}
                            value={draft.end_date}
                            min={draft.start_date || undefined}
                            onChange={(event) => setDraft((current) => ({ ...current, end_date: event.target.value }))}
                        />
                    </label>
                )}
            </div>
            <label className="block text-xs font-medium text-gray-500">
                หมายเหตุ
                <textarea
                    rows={2}
                    className={`${EDIT_INPUT} mt-1 resize-none`}
                    value={draft.reason}
                    onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}
                />
            </label>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>
        </div>
    );
}

function LeaveDetailModal({
    group,
    currentUser,
    onSaved,
    onClose,
}: {
    group: LeaveGroup;
    currentUser: AuthUser | null;
    onSaved: (key: string) => Promise<void>;
    onClose: () => void;
}) {
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const { user, requests } = group;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
            <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-indigo-100 text-indigo-700">
                        {user?.full_name?.slice(0, 2) ?? "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">{user?.full_name}</h3>
                        {user?.english_name && <p className="text-sm text-gray-600 break-words">{user.english_name}</p>}
                        <p className="text-sm text-gray-500">
                            {[user?.employee_code, user?.department].filter(Boolean).join(" · ")}
                        </p>
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
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                            วันที่ลา{requests.length > 1 ? ` (${requests.length} รายการ)` : ""}
                        </p>
                        <div className={`space-y-2 ${requests.length > 3 ? "max-h-[22rem] overflow-y-auto pr-1" : ""}`}>
                            {requests.map((request) => {
                                const duration = formatLeaveDuration(request).replace(/^\((.*)\)$/, "$1");
                                const type = leaveTypeLabel(request);
                                const editing = editingId === request.id;
                                return (
                                    <div key={request.id} className="rounded-xl bg-indigo-50 px-4 py-3">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-semibold text-indigo-800">{formatLeaveDateRange(request)}</p>
                                                {(duration || type) && (
                                                    <p className="text-sm text-indigo-700">{[type, duration].filter(Boolean).join(" · ")}</p>
                                                )}
                                            </div>
                                            {!editing && canEditRequest(request, currentUser) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingId(request.id)}
                                                    className="flex-shrink-0 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    แก้ไข
                                                </button>
                                            )}
                                        </div>
                                        {editing ? (
                                            <LeaveEditForm
                                                request={request}
                                                currentUser={currentUser}
                                                onCancel={() => setEditingId(null)}
                                                onSaved={async () => {
                                                    setEditingId(null);
                                                    await onSaved(group.key);
                                                }}
                                            />
                                        ) : (
                                            request.reason && (
                                                <p className="mt-1 text-sm text-gray-600 break-words whitespace-pre-wrap">
                                                    <span className="font-medium">หมายเหตุ:</span> {request.reason}
                                                </p>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <DetailRow label="รหัสพนักงาน" value={user?.employee_code} />
                        <DetailRow label="ชื่อภาษาอังกฤษ" value={user?.english_name} />
                        <DetailRow label="แผนก" value={user?.department} />
                        <DetailRow label="อีเมล" value={user?.email} />
                        <DetailRow label="อีเมลสำรอง" value={user?.email_2} />
                        <DetailRow label="เบอร์โทร" value={user?.phone} />
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
