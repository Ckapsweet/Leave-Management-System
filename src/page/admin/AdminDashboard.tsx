import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveStatus = "pending" | "approved" | "rejected";
type LeaveUnit   = "day" | "hour";

interface LeaveType {
  id: number;
  name: string;
  max_days: number;
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
  user: {
    id: number;
    full_name: string;
    employee_code: string;
    department: string;
  };
  approver_name?: string;
  comment?: string;
}

interface AdminUser {
  id: number;
  full_name: string;
  employee_code: string;
  role: string;
  department: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_ADMIN: AdminUser = {
  id: 1,
  full_name: "วิไล สุวรรณภูมิ",
  employee_code: "EMP-0001",
  role: "admin",
  department: "ทรัพยากรบุคคล",
};

const LEAVE_TYPES: LeaveType[] = [
  { id: 1, name: "ลาป่วย",    max_days: 30 },
  { id: 2, name: "ลากิจ",     max_days: 3  },
  { id: 3, name: "ลาพักผ่อน", max_days: 10 },
  { id: 4, name: "ลาอื่นๆ",   max_days: 5  },
];

const MOCK_REQUESTS: LeaveRequest[] = [
  // ── pending (day) ──────────────────────────────────────────
  {
    id: 9, user_id: 3, leave_type_id: 2,
    start_date: "2025-03-25", end_date: "2025-03-25",
    leave_unit: "day", total_days: 1, reason: "ไปต่ออายุพาสปอร์ต",
    status: "pending", created_at: "2025-03-20T11:15:00",
    leave_type: LEAVE_TYPES[1],
    user: { id: 3, full_name: "ธนพล วิชัยดิษฐ", employee_code: "EMP-0003", department: "วิศวกรรมซอฟต์แวร์" },
  },
  {
    id: 10, user_id: 6, leave_type_id: 2,
    start_date: "2025-04-01", end_date: "2025-04-01",
    leave_unit: "day", total_days: 1, reason: "ไปงานแต่งงานเพื่อน",
    status: "pending", created_at: "2025-03-25T09:00:00",
    leave_type: LEAVE_TYPES[1],
    user: { id: 6, full_name: "พรทิพย์ แสงจันทร์", employee_code: "EMP-0006", department: "การตลาด" },
  },
  {
    id: 11, user_id: 5, leave_type_id: 1,
    start_date: "2025-03-28", end_date: "2025-03-29",
    leave_unit: "day", total_days: 2, reason: "ไม่สบาย มีไข้",
    status: "pending", created_at: "2025-03-27T08:00:00",
    leave_type: LEAVE_TYPES[0],
    user: { id: 5, full_name: "กิตติพงษ์ รุ่งเรือง", employee_code: "EMP-0005", department: "การเงิน" },
  },
  {
    id: 12, user_id: 8, leave_type_id: 3,
    start_date: "2025-04-07", end_date: "2025-04-11",
    leave_unit: "day", total_days: 5, reason: "พักผ่อนประจำปีกับครอบครัว",
    status: "pending", created_at: "2025-03-26T14:30:00",
    leave_type: LEAVE_TYPES[2],
    user: { id: 8, full_name: "อรุณี ใจงาม", employee_code: "EMP-0008", department: "วิศวกรรมซอฟต์แวร์" },
  },
  // ── pending (hour) ─────────────────────────────────────────
  {
    id: 13, user_id: 7, leave_type_id: 1,
    start_date: "2025-03-28", end_date: "2025-03-28",
    start_time: "13:00", end_time: "16:00",
    leave_unit: "hour", total_days: 0, total_hours: 3,
    reason: "นัดหมอทันตแพทย์",
    status: "pending", created_at: "2025-03-27T10:00:00",
    leave_type: LEAVE_TYPES[0],
    user: { id: 7, full_name: "นัทธพงศ์ ทองดี", employee_code: "EMP-0007", department: "ปฏิบัติการ" },
  },
  {
    id: 14, user_id: 5, leave_type_id: 2,
    start_date: "2025-04-02", end_date: "2025-04-02",
    start_time: "08:30", end_time: "10:30",
    leave_unit: "hour", total_days: 0, total_hours: 2,
    reason: "ไปต่อทะเบียนรถ",
    status: "pending", created_at: "2025-03-28T09:00:00",
    leave_type: LEAVE_TYPES[1],
    user: { id: 5, full_name: "กิตติพงษ์ รุ่งเรือง", employee_code: "EMP-0005", department: "การเงิน" },
  },
  // ── approved ───────────────────────────────────────────────
  {
    id: 7, user_id: 3, leave_type_id: 1,
    start_date: "2025-03-10", end_date: "2025-03-11",
    leave_unit: "day", total_days: 2, reason: "ไม่สบาย มีไข้หวัด",
    status: "approved", created_at: "2025-03-09T09:00:00",
    approved_at: "2025-03-09T14:22:00", approver_name: "วิไล สุวรรณภูมิ", comment: "อนุมัติ ดูแลสุขภาพด้วย",
    leave_type: LEAVE_TYPES[0],
    user: { id: 3, full_name: "ธนพล วิชัยดิษฐ", employee_code: "EMP-0003", department: "วิศวกรรมซอฟต์แวร์" },
  },
  {
    id: 15, user_id: 9, leave_type_id: 1,
    start_date: "2025-03-24", end_date: "2025-03-24",
    start_time: "09:00", end_time: "12:00",
    leave_unit: "hour", total_days: 0, total_hours: 3,
    reason: "ไปรับยาที่โรงพยาบาล",
    status: "approved", created_at: "2025-03-23T15:00:00",
    approved_at: "2025-03-23T16:00:00", approver_name: "วิไล สุวรรณภูมิ",
    leave_type: LEAVE_TYPES[0],
    user: { id: 9, full_name: "ภูวนาถ ศรีสมบูรณ์", employee_code: "EMP-0009", department: "ปฏิบัติการ" },
  },
  {
    id: 6, user_id: 4, leave_type_id: 3,
    start_date: "2025-02-10", end_date: "2025-02-14",
    leave_unit: "day", total_days: 5, reason: "พักผ่อนกับครอบครัว",
    status: "approved", created_at: "2025-02-06T09:00:00",
    approved_at: "2025-02-07T10:00:00", approver_name: "วิไล สุวรรณภูมิ",
    leave_type: LEAVE_TYPES[2],
    user: { id: 4, full_name: "สมหญิง ดวงดี", employee_code: "EMP-0004", department: "การตลาด" },
  },
  // ── rejected ───────────────────────────────────────────────
  {
    id: 5, user_id: 6, leave_type_id: 1,
    start_date: "2025-03-03", end_date: "2025-03-05",
    leave_unit: "day", total_days: 3, reason: "ไข้หวัดใหญ่",
    status: "rejected", created_at: "2025-03-02T08:00:00",
    approved_at: "2025-03-02T09:30:00", approver_name: "ประเสริฐ มีสุข", comment: "ขาดงานบ่อย ขอใบรับรองแพทย์",
    leave_type: LEAVE_TYPES[0],
    user: { id: 6, full_name: "พรทิพย์ แสงจันทร์", employee_code: "EMP-0006", department: "การตลาด" },
  },
  {
    id: 16, user_id: 10, leave_type_id: 2,
    start_date: "2025-03-20", end_date: "2025-03-20",
    start_time: "14:00", end_time: "17:00",
    leave_unit: "hour", total_days: 0, total_hours: 3,
    reason: "ธุระส่วนตัว",
    status: "rejected", created_at: "2025-03-19T10:00:00",
    approved_at: "2025-03-19T11:00:00", approver_name: "ประเสริฐ มีสุข", comment: "ช่วงเวลาดังกล่าวมีประชุมสำคัญ",
    leave_type: LEAVE_TYPES[1],
    user: { id: 10, full_name: "มณีรัตน์ พงษ์ไพร", employee_code: "EMP-0010", department: "การเงิน" },
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

const DEPT_AVATAR: Record<string, string> = {
  "วิศวกรรมซอฟต์แวร์": "bg-violet-100 text-violet-700",
  "การตลาด":            "bg-pink-100 text-pink-700",
  "การเงิน":            "bg-amber-100 text-amber-700",
  "ปฏิบัติการ":          "bg-teal-100 text-teal-700",
  "ทรัพยากรบุคคล":      "bg-blue-100 text-blue-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function avatarColor(dept: string) {
  return DEPT_AVATAR[dept] ?? "bg-gray-100 text-gray-600";
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  type: "approve" | "reject";
  request: LeaveRequest;
  onConfirm: (comment: string) => void;
  onClose: () => void;
}

function ConfirmModal({ type, request, onConfirm, onClose }: ConfirmModalProps) {
  const [comment, setComment] = useState("");
  const isApprove = type === "approve";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isApprove ? "bg-emerald-100" : "bg-red-100"}`}>
              {isApprove ? "✓" : "✗"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{isApprove ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}</h3>
              <p className="text-xs text-gray-400">คำขอ #{request.id} — {request.user.full_name}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ประเภท</span>
              <span className="font-medium">{request.leave_type.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่</span>
              <span className="font-medium">{fmtDate(request.start_date)}{request.start_date !== request.end_date ? ` – ${fmtDate(request.end_date)}` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">จำนวน</span>
              <span className="font-medium">{request.total_days} วัน</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              หมายเหตุ {!isApprove && <span className="text-red-400">*</span>}
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              rows={3}
              placeholder={isApprove ? "หมายเหตุ (ถ้ามี)..." : "ระบุเหตุผลที่ปฏิเสธ..."}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
            ยกเลิก
          </button>
          <button
            onClick={() => {
              if (!isApprove && !comment.trim()) return;
              onConfirm(comment);
            }}
            className={`px-5 py-2.5 text-sm text-white rounded-xl font-medium transition-colors flex items-center gap-2 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
            } ${!isApprove && !comment.trim() ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {isApprove ? "อนุมัติ" : "ปฏิเสธ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function DetailDrawer({ request: req, onClose, onApprove, onReject }: DetailDrawerProps) {
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const meta = STATUS_META[req.status];
  const isHourly = req.leave_unit === "hour";
  const ac = avatarColor(req.user.department);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">คำขอ #{req.id}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ac}`}>
              {req.user.full_name.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{req.user.full_name}</p>
              <p className="text-xs text-gray-500">{req.user.department} · {req.user.employee_code}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
            <span className="text-xl">{meta.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
              {req.approved_at && <p className="text-xs text-gray-500">{fmtDatetime(req.approved_at)}</p>}
            </div>
          </div>

          {/* Leave type */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">ประเภทการลา</p>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColor}`}>{req.leave_type.name}</span>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่ลา</span>
              <span className="font-medium text-gray-800">{fmtDate(req.start_date)}</span>
            </div>
            {!isHourly && req.start_date !== req.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">ถึงวันที่</span>
                <span className="font-medium text-gray-800">{fmtDate(req.end_date)}</span>
              </div>
            )}
            {isHourly && req.start_time && (
              <div className="flex justify-between">
                <span className="text-gray-500">ช่วงเวลา</span>
                <span className="font-medium text-gray-800">{req.start_time} – {req.end_time} น.</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-500">รวม</span>
              <span className="font-bold text-gray-900">
                {isHourly ? `${req.total_hours} ชั่วโมง` : `${req.total_days} วัน`}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">เหตุผล</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{req.reason}</p>
          </div>

          {/* Approver comment */}
          {req.comment && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">หมายเหตุ</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">"{req.comment}"</p>
                {req.approver_name && <p className="text-xs text-amber-600 mt-1">— {req.approver_name}</p>}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">ส่งคำขอเมื่อ {fmtDatetime(req.created_at)}</p>
        </div>

        {/* Action buttons */}
        {req.status === "pending" && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={onReject} className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors">
              ปฏิเสธ
            </button>
            <button onClick={onApprove} className="flex-1 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors">
              อนุมัติ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const admin = MOCK_ADMIN;
  const [requests, setRequests] = useState<LeaveRequest[]>(MOCK_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("pending");
  const [typeFilter, setTypeFilter]     = useState<number | "all">("all");
  const [deptFilter, setDeptFilter]     = useState("all");
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm]           = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);

  const departments = ["all", ...Array.from(new Set(requests.map((r) => r.user.department)))];

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType   = typeFilter   === "all" || r.leave_type_id === typeFilter;
    const matchDept   = deptFilter   === "all" || r.user.department === deptFilter;
    const matchSearch = !search || r.user.full_name.includes(search) || r.user.employee_code.includes(search);
    return matchStatus && matchType && matchDept && matchSearch;
  });

  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const handleAction = (id: number, type: "approve" | "reject", comment: string) => {
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: type === "approve" ? "approved" : "rejected", approved_at: now, approver_name: admin.full_name, comment: comment || undefined }
          : r
      )
    );
    setConfirm(null);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {confirm && (
        <ConfirmModal
          type={confirm.type}
          request={confirm.req}
          onConfirm={(comment) => handleAction(confirm.req.id, confirm.type, comment)}
          onClose={() => setConfirm(null)}
        />
      )}
      {selected && !confirm && (
        <DetailDrawer
          request={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setConfirm({ type: "approve", req: selected })}
          onReject={() => setConfirm({ type: "reject", req: selected })}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Admin — ระบบการลา</h1>
            <p className="text-xs text-gray-400">จัดการคำขอลา</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">{pending} รออนุมัติ</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
              {admin.full_name.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800">{admin.full_name}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "รออนุมัติ",   value: pending,  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",  click: "pending"  },
            { label: "อนุมัติแล้ว", value: approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", click: "approved" },
            { label: "ปฏิเสธ",      value: rejected, color: "text-red-500",     bg: "bg-red-50",     border: "border-red-100",     click: "rejected" },
          ].map(({ label, value, color, bg, border, click }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(click as LeaveStatus)}
              className={`bg-white rounded-2xl border p-5 text-left hover:shadow-md transition-all ${border} ${statusFilter === click ? "ring-2 ring-offset-1 ring-slate-300" : ""}`}
            >
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">ทุกแผนก</option>
              {departments.filter((d) => d !== "all").map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">ทุกประเภทลา</option>
              {LEAVE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${statusFilter === s ? "bg-slate-800 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s === "all" ? "ทั้งหมด" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              รายการคำขอลา
              <span className="ml-2 text-gray-400 font-normal">({filtered.length} รายการ)</span>
            </h2>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">ไม่พบรายการ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-left">
                    {["พนักงาน", "ประเภท", "วันที่", "จำนวน", "เหตุผล", "สถานะ", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => {
                    const meta = STATUS_META[r.status];
                    const tc   = TYPE_COLORS[r.leave_type_id] ?? "bg-gray-100 text-gray-600";
                    const ac   = avatarColor(r.user.department);
                    const isHourly = r.leave_unit === "hour";
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ac}`}>
                              {r.user.full_name.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{r.user.full_name}</p>
                              <p className="text-xs text-gray-400">{r.user.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tc}`}>{r.leave_type.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-800 whitespace-nowrap">{fmtDate(r.start_date)}</p>
                          {!isHourly && r.start_date !== r.end_date && (
                            <p className="text-xs text-gray-400">ถึง {fmtDate(r.end_date)}</p>
                          )}
                          {isHourly && r.start_time && (
                            <p className="text-xs text-gray-400">{r.start_time} – {r.end_time} น.</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {isHourly ? `${r.total_hours} ชม.` : `${r.total_days} วัน`}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 max-w-[160px] truncate">{r.reason}</td>
                        <td className="px-5 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                            {meta.label}
                          </div>
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          {r.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirm({ type: "reject", req: r })}
                                className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                              >ปฏิเสธ</button>
                              <button
                                onClick={() => setConfirm({ type: "approve", req: r })}
                                className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                              >อนุมัติ</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}