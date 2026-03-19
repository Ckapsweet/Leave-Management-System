import { useState } from "react";
import { LeaveRequestModal, type LeaveRequestForm } from "../components/Leaverequestmodal";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveStatus = "pending" | "approved" | "rejected";
type LeaveUnit = "day" | "hour";

interface User {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  role: string;
}

interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days: number;
}

interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type_id: number;
  total_days: number;
  used_days: number;
  year: number;
  leave_type: LeaveType;
}

interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  leave_unit: LeaveUnit;
  total_days: number;
  total_hours?: number;
  reason: string;
  status: LeaveStatus;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  leave_type: LeaveType;
  approver_name?: string;
  comment?: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 3,
  employee_code: "EMP-0042",
  full_name: "ธนพล วิชัยดิษฐ",
  department: "วิศวกรรมซอฟต์แวร์",
  role: "employee",
};

const MOCK_LEAVE_TYPES: LeaveType[] = [
  { id: 1, name: "ลาป่วย",    description: "ลาป่วยตามกฎหมายแรงงาน", max_days: 30 },
  { id: 2, name: "ลากิจ",     description: "ธุระส่วนตัว",             max_days: 3  },
  { id: 3, name: "ลาพักผ่อน", description: "วันหยุดพักผ่อนประจำปี",  max_days: 10 },
  { id: 4, name: "ลาอื่นๆ",   description: "การลาประเภทอื่น",         max_days: 5  },
];

const MOCK_BALANCES: LeaveBalance[] = [
  { id: 1, user_id: 3, leave_type_id: 1, total_days: 30, used_days: 5, year: 2025, leave_type: MOCK_LEAVE_TYPES[0] },
  { id: 2, user_id: 3, leave_type_id: 2, total_days: 3,  used_days: 1, year: 2025, leave_type: MOCK_LEAVE_TYPES[1] },
  { id: 3, user_id: 3, leave_type_id: 3, total_days: 10, used_days: 3, year: 2025, leave_type: MOCK_LEAVE_TYPES[2] },
  { id: 4, user_id: 3, leave_type_id: 4, total_days: 5,  used_days: 0, year: 2025, leave_type: MOCK_LEAVE_TYPES[3] },
];

const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 7, user_id: 3, leave_type_id: 1, start_date: "2025-03-10", end_date: "2025-03-11",
    leave_unit: "day", total_days: 2, reason: "ไม่สบาย มีไข้หวัด", status: "approved",
    approved_by: 1, approved_at: "2025-03-09T14:22:00", created_at: "2025-03-09T09:00:00",
    leave_type: MOCK_LEAVE_TYPES[0], approver_name: "วิไล สุวรรณ", comment: "อนุมัติ ดูแลสุขภาพด้วย",
  },
  {
    id: 6, user_id: 3, leave_type_id: 3, start_date: "2025-02-20", end_date: "2025-02-22",
    leave_unit: "day", total_days: 3, reason: "พักผ่อนกับครอบครัว", status: "approved",
    approved_by: 1, approved_at: "2025-02-18T10:00:00", created_at: "2025-02-17T08:30:00",
    leave_type: MOCK_LEAVE_TYPES[2], approver_name: "วิไล สุวรรณ",
  },
  {
    id: 9, user_id: 3, leave_type_id: 2, start_date: "2025-03-24", end_date: "2025-03-24",
    leave_unit: "hour", total_days: 0, total_hours: 3, start_time: "09:00", end_time: "12:00",
    reason: "นัดหมอช่วงเช้า", status: "approved",
    approved_by: 1, approved_at: "2025-03-23T10:00:00", created_at: "2025-03-22T15:00:00",
    leave_type: MOCK_LEAVE_TYPES[1], approver_name: "วิไล สุวรรณ",
  },
  {
    id: 8, user_id: 3, leave_type_id: 2, start_date: "2025-03-25", end_date: "2025-03-25",
    leave_unit: "day", total_days: 1, reason: "ไปต่ออายุพาสปอร์ต", status: "pending",
    created_at: "2025-03-20T11:15:00", leave_type: MOCK_LEAVE_TYPES[1],
  },
  {
    id: 5, user_id: 3, leave_type_id: 1, start_date: "2025-01-15", end_date: "2025-01-18",
    leave_unit: "day", total_days: 3, reason: "ผ่าตัดเล็ก พักฟื้น", status: "approved",
    approved_by: 1, approved_at: "2025-01-14T09:00:00", created_at: "2025-01-13T16:00:00",
    leave_type: MOCK_LEAVE_TYPES[0], approver_name: "วิไล สุวรรณ",
  },
  {
    id: 3, user_id: 3, leave_type_id: 1, start_date: "2025-01-08", end_date: "2025-01-08",
    leave_unit: "hour", total_days: 0, total_hours: 2, start_time: "13:00", end_time: "15:00",
    reason: "ไปรับยาที่โรงพยาบาล", status: "approved",
    approved_by: 1, approved_at: "2025-01-07T09:00:00", created_at: "2025-01-07T08:00:00",
    leave_type: MOCK_LEAVE_TYPES[0], approver_name: "วิไล สุวรรณ",
  },
  {
    id: 4, user_id: 3, leave_type_id: 3, start_date: "2024-12-26", end_date: "2024-12-27",
    leave_unit: "day", total_days: 2, reason: "ท่องเที่ยวปีใหม่", status: "rejected",
    approved_by: 1, approved_at: "2024-12-24T10:00:00", created_at: "2024-12-23T09:00:00",
    leave_type: MOCK_LEAVE_TYPES[2], approver_name: "วิไล สุวรรณ", comment: "วันดังกล่าวมีโปรเจกต์ด่วน",
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<LeaveStatus, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  pending:  { label: "รออนุมัติ",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",    dot: "bg-amber-400",   icon: "⏳" },
  approved: { label: "อนุมัติแล้ว", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", icon: "✓"  },
  rejected: { label: "ปฏิเสธ",      color: "text-red-700",     bg: "bg-red-50 border-red-200",         dot: "bg-red-400",     icon: "✗"  },
};

const TYPE_COLORS: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-orange-100 text-orange-700",
};

const TYPE_ICONS: Record<number, string> = { 1: "🏥", 2: "📋", 3: "🌴", 4: "📌" };

const BALANCE_GRADIENTS = [
  "from-sky-500 to-sky-600",
  "from-teal-500 to-teal-600",
  "from-violet-500 to-violet-600",
  "from-orange-400 to-orange-500",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDatetime(d: string): string {
  return new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── BalanceCard ───────────────────────────────────────────────────────────────

function BalanceCard({ balance, gradient }: { balance: LeaveBalance; gradient: string }) {
  const remaining = balance.total_days - balance.used_days;
  const pct = balance.total_days > 0 ? Math.round((balance.used_days / balance.total_days) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
        <span className="text-white text-lg">{TYPE_ICONS[balance.leave_type_id] ?? "📌"}</span>
      </div>
      <p className="text-xs font-medium text-gray-400 mb-1">{balance.leave_type.name}</p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-bold text-gray-900">{remaining}</span>
        <span className="text-sm text-gray-400">/ {balance.total_days} วัน</span>
      </div>
      {balance.total_days > 0 ? (
        <>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">ใช้ไปแล้ว {balance.used_days} วัน ({pct}%)</p>
        </>
      ) : (
        <p className="text-xs text-gray-400">ไม่มีสิทธิ์ปีนี้</p>
      )}
    </div>
  );
}

// ── DurationBadge ─────────────────────────────────────────────────────────────

function DurationBadge({ req }: { req: LeaveRequest }) {
  if (req.leave_unit === "hour") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        {req.total_hours} ชม.
      </span>
    );
  }
  return <span className="text-sm font-semibold text-gray-700">{req.total_days} วัน</span>;
}

// ── RequestRow ────────────────────────────────────────────────────────────────

function RequestRow({ req, onClick }: { req: LeaveRequest; onClick: () => void }) {
  const meta = STATUS_META[req.status];
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const isHourly = req.leave_unit === "hour";
  return (
    <tr className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{fmtDate(req.start_date)}</p>
          {!isHourly && req.start_date !== req.end_date && (
            <p className="text-xs text-gray-400">ถึง {fmtDate(req.end_date)}</p>
          )}
          {isHourly && req.start_time && (
            <p className="text-xs text-gray-400">{req.start_time} – {req.end_time} น.</p>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${typeColor}`}>{req.leave_type.name}</span>
          {isHourly && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium w-fit">ลาชั่วโมง</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <DurationBadge req={req} />
      </td>
      <td className="px-5 py-4 text-sm text-gray-500 max-w-[180px] truncate">{req.reason}</td>
      <td className="px-5 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
          {meta.label}
        </div>
      </td>
    </tr>
  );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────

function StatusBanner({ status, approved_at }: { status: LeaveStatus; approved_at?: string }) {
  const meta = STATUS_META[status];
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
      <span className="text-2xl">{meta.icon}</span>
      <div>
        <p className={`font-semibold ${meta.color}`}>{meta.label}</p>
        {approved_at && <p className="text-xs text-gray-500">{fmtDatetime(approved_at)}</p>}
      </div>
    </div>
  );
}

function DateSection({ req }: { req: LeaveRequest }) {
  const isHourly = req.leave_unit === "hour";
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">รูปแบบการลา</span>
        {isHourly ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            ลาเป็นชั่วโมง
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">ลาเป็นวัน</span>
        )}
      </div>
      <div className="border-t border-gray-200 pt-3 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">วันที่ลา</span>
          <span className="font-medium text-gray-800">{fmtDate(req.start_date)}</span>
        </div>
        {!isHourly && req.start_date !== req.end_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ถึงวันที่</span>
            <span className="font-medium text-gray-800">{fmtDate(req.end_date)}</span>
          </div>
        )}
        {isHourly && req.start_time && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ช่วงเวลา</span>
            <span className="font-medium text-gray-800">{req.start_time} – {req.end_time} น.</span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
        <span className="text-gray-500 text-sm">รวมทั้งหมด</span>
        {isHourly ? (
          <span className="font-bold text-indigo-700 text-base">{req.total_hours} ชั่วโมง</span>
        ) : (
          <span className="font-bold text-gray-900 text-base">{req.total_days} วัน</span>
        )}
      </div>
    </div>
  );
}

function DetailDrawer({ req, onClose }: { req: LeaveRequest; onClose: () => void }) {
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">รายละเอียดคำขอ #{req.id}</h3>
          <button onClick={onClose} aria-label="ปิด" className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <StatusBanner status={req.status} approved_at={req.approved_at} />
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">ประเภทการลา</p>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColor}`}>{req.leave_type.name}</span>
          </div>
          <DateSection req={req} />
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">เหตุผล</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{req.reason}</p>
          </div>
          {req.approver_name && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">ผู้อนุมัติ / ผู้ตรวจสอบ</p>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
                  {req.approver_name.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-gray-800">{req.approver_name}</span>
              </div>
            </div>
          )}
          {req.comment && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">หมายเหตุจากผู้อนุมัติ</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 leading-relaxed">"{req.comment}"</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">ส่งคำขอเมื่อ {fmtDatetime(req.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function UserLeaveDashboard() {
  const user = MOCK_USER;
  const balances = MOCK_BALANCES;
  const [requests, setRequests] = useState<LeaveRequest[]>(MOCK_REQUESTS);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<number | "all">("all");

  const year = 2025;

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType   = typeFilter   === "all" || r.leave_type_id === typeFilter;
    return matchStatus && matchType;
  });

  const totalUsed      = balances.reduce((s, b) => s + b.used_days, 0);
  const totalRemaining = balances.reduce((s, b) => s + Math.max(0, b.total_days - b.used_days), 0);
  const pendingCount   = requests.filter((r) => r.status === "pending").length;

  const handleAddLeave = (form: LeaveRequestForm) => {
    const leaveType = MOCK_LEAVE_TYPES.find((t) => t.id === form.leave_type_id)!;
    const days = form.leave_unit === "day"
      ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86_400_000) + 1)
      : 0;
    const startTimeStr = form.start_time?.isValid() ? form.start_time.format("HH:mm") : undefined;
    const endTimeStr   = form.end_time?.isValid()   ? form.end_time.format("HH:mm")   : undefined;
    const hours = form.leave_unit === "hour" && form.start_time && form.end_time
      ? Math.max(0, Math.round((form.end_time.diff(form.start_time, "minute") / 60) * 10) / 10)
      : undefined;
    const newRequest: LeaveRequest = {
      id: Math.max(...requests.map((r) => r.id)) + 1,
      user_id: user.id,
      leave_type_id: form.leave_type_id,
      leave_type: leaveType,
      leave_unit: form.leave_unit,
      start_date: form.start_date,
      end_date: form.leave_unit === "day" ? form.end_date : form.start_date,
      start_time: form.leave_unit === "hour" ? startTimeStr : undefined,
      end_time:   form.leave_unit === "hour" ? endTimeStr   : undefined,
      total_days: days,
      total_hours: hours,
      reason: form.reason,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    setRequests((prev) => [newRequest, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {selected && <DetailDrawer req={selected} onClose={() => setSelected(null)} />}
      {showModal && <LeaveRequestModal leaveTypes={MOCK_LEAVE_TYPES} onSubmit={handleAddLeave} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">ระบบการลา</h1>
            <p className="text-xs text-gray-400">ปีงบประมาณ {year}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            เพิ่มการลา
          </button>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">{pendingCount} รออนุมัติ</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
              {user.full_name.slice(0, 2)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-gray-800">{user.full_name}</p>
              <p className="text-xs text-gray-400">{user.employee_code}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Profile + summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {user.full_name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user.full_name}</h2>
              <p className="text-sm text-gray-500">{user.department} · {user.employee_code}</p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{totalRemaining}</p>
                <p className="text-xs text-gray-500">วันคงเหลือ</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{totalUsed}</p>
                <p className="text-xs text-gray-500">วันที่ใช้ไป</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-gray-500">รออนุมัติ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave balances */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">วันลาคงเหลือ ปี {year}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {balances.map((b, i) => (
              <BalanceCard key={b.id} balance={b} gradient={BALANCE_GRADIENTS[i % BALANCE_GRADIENTS.length]} />
            ))}
          </div>
        </div>

        {/* Leave history */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ประวัติการลา</h3>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s === "all" ? "ทั้งหมด" : STATUS_META[s].label}
                </button>
              ))}
              <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}>
                <option value="all">ทุกประเภท</option>
                {MOCK_LEAVE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">ไม่พบรายการลา</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-left">
                      {["วันที่ / เวลา", "ประเภท", "จำนวน", "เหตุผล", "สถานะ"].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((r) => (
                      <RequestRow key={r.id} req={r} onClick={() => setSelected(r)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-right mt-2 px-1">คลิกแถวเพื่อดูรายละเอียด</p>
        </div>

        {/* Leave entitlement summary */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">สรุปสิทธิ์การลา ปี {year}</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-left">
                  {["ประเภทการลา", "สิทธิ์/ปี (วัน)", "ใช้ไปแล้ว", "คงเหลือ", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balances.map((b, i) => {
                  const remaining = b.total_days - b.used_days;
                  const pct = b.total_days > 0 ? Math.round((remaining / b.total_days) * 100) : 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[b.leave_type_id]}`}>{b.leave_type.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{b.total_days}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{b.used_days}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{remaining}</td>
                      <td className="px-5 py-3.5 w-32">
                        {b.total_days > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${BALANCE_GRADIENTS[i]} rounded-full`} style={{ width: `${100 - pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{pct}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}