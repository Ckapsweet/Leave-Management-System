// pages/AdminDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import api from "../../services/api";
import {
  getAdminLeaveRequests, approveLeaveRequest, rejectLeaveRequest,
  getAdminUserPool, updateLeavePool,
} from "../../services/leaveService";
import type { LeaveRequest, LeaveStatus, LeaveType, LeavePool } from "../../services/leaveService";
import { AddLeaveBalanceModal } from "../../components/AddLeaveBalanceModal";
import { ToastContainer, toast } from "../../components/Toast"; // ✅ import Toast

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id:            number;
  employee_code: string;
  full_name:     string;
  department:    string;
  role:          string;
}

interface EmployeeWithBalance extends Employee {
  pool: LeavePool | null;
}

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
function avatarColor(dept = "") {
  return DEPT_AVATAR[dept] ?? "bg-gray-100 text-gray-600";
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  type: "approve" | "reject";
  request: LeaveRequest;
  onConfirm: (comment: string) => void;
  onClose: () => void;
  loading: boolean;
}

function ConfirmModal({ type, request, onConfirm, onClose, loading }: ConfirmModalProps) {
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
              <p className="text-xs text-gray-400">คำขอ #{request.id} — {request.user?.full_name}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">ประเภท</span><span className="font-medium">{request.leave_type.name}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่</span>
              <span className="font-medium">
                {fmtDate(request.start_date)}
                {request.start_date !== request.end_date ? ` – ${fmtDate(request.end_date)}` : ""}
                {request.leave_unit === "hour" && request.start_time ? ` (${request.start_time}–${request.end_time} น.)` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">จำนวน</span>
              <span className="font-medium">{request.leave_unit === "hour" ? `${request.total_hours} ชั่วโมง` : `${request.total_days} วัน`}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              หมายเหตุ {!isApprove && <span className="text-red-400">*</span>}
            </label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              rows={3} placeholder={isApprove ? "หมายเหตุ (ถ้ามี)..." : "ระบุเหตุผลที่ปฏิเสธ..."}
              value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">ยกเลิก</button>
          <button
            onClick={() => { if (!isApprove && !comment.trim()) return; onConfirm(comment); }}
            disabled={loading || (!isApprove && !comment.trim())}
            className={`px-5 py-2.5 text-sm text-white rounded-xl font-medium transition-colors flex items-center gap-2 ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isApprove ? "กำลังอนุมัติ..." : "กำลังปฏิเสธ..."}</>
            ) : (isApprove ? "อนุมัติ" : "ปฏิเสธ")}
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
  const meta      = STATUS_META[req.status];
  const isHourly  = req.leave_unit === "hour";
  const ac        = avatarColor(req.user?.department);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">คำขอ #{req.id}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ac}`}>
              {req.user?.full_name?.slice(0, 2) ?? "??"}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{req.user?.full_name}</p>
              <p className="text-xs text-gray-500">{req.user?.department} · {req.user?.employee_code}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
            <span className="text-xl">{meta.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
              {req.approved_at && <p className="text-xs text-gray-500">{fmtDatetime(req.approved_at)}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">ประเภทการลา</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColor}`}>{req.leave_type.name}</span>
              {isHourly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  ลาชั่วโมง
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">วันที่ลา</span><span className="font-medium text-gray-800">{fmtDate(req.start_date)}</span></div>
            {!isHourly && req.start_date !== req.end_date && (
              <div className="flex justify-between"><span className="text-gray-500">ถึงวันที่</span><span className="font-medium text-gray-800">{fmtDate(req.end_date)}</span></div>
            )}
            {isHourly && req.start_time && (
              <div className="flex justify-between"><span className="text-gray-500">ช่วงเวลา</span><span className="font-medium text-gray-800">{req.start_time} – {req.end_time} น.</span></div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-500">รวม</span>
              <span className="font-bold text-gray-900">{isHourly ? `${req.total_hours} ชั่วโมง` : `${req.total_days} วัน`}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">เหตุผล</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{req.reason}</p>
          </div>
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
        {req.status === "pending" && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={onReject}  className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors">ปฏิเสธ</button>
            <button onClick={onApprove} className="flex-1 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors">อนุมัติ</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [requests,      setRequests]      = useState<LeaveRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState("");
  const [statusFilter,  setStatusFilter]  = useState<"all" | LeaveStatus>("pending");
  const [deptFilter,    setDeptFilter]    = useState("all");
  const [search,        setSearch]        = useState("");
  const [viewMode,      setViewMode]      = useState<"all" | "yearly" | "monthly">("all");
  const [selYear,       setSelYear]       = useState<number>(new Date().getFullYear());
  const [selMonth,      setSelMonth]      = useState<number>(new Date().getMonth() + 1);
  const [selected,      setSelected]      = useState<LeaveRequest | null>(null);
  const [confirm,       setConfirm]       = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);
  const [activeTab,     setActiveTab]     = useState<"requests" | "employees">("requests");
  const [leaveTypes,    setLeaveTypes]    = useState<LeaveType[]>([]);
  const [balanceModal,  setBalanceModal]  = useState<{
    user: { id: number; full_name: string; employee_code: string; department: string };
    pool: LeavePool;
  } | null>(null);
  const [employees,     setEmployees]     = useState<EmployeeWithBalance[]>([]);
  const [empLoading,    setEmpLoading]    = useState(false);
  const [empSearch,     setEmpSearch]     = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");

  const adminName = localStorage.getItem("adminName") ?? "Admin";
  const year      = new Date().getFullYear();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const [data, types] = await Promise.all([
        getAdminLeaveRequests(),
        api.get("/api/leave-types").then((r: any) => r.data).catch(() => []),
      ]);
      setRequests(data);
      setLeaveTypes(types);
    } catch (err: any) {
      setError(err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      const usersRes = await api.get("/api/admin/users");
      const users: Employee[] = usersRes.data.filter((u: Employee) => u.role !== "admin");
      const withPool = await Promise.all(
        users.map(async (u) => {
          try {
            const res = await api.get(`/api/admin/leave-pool/${u.id}`, { params: { year } });
            return { ...u, pool: res.data };
          } catch {
            return { ...u, pool: null };
          }
        })
      );
      setEmployees(withPool);
    } catch (err: any) {
      console.error("fetch employees failed", err);
    } finally {
      setEmpLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees();
  }, [activeTab, fetchEmployees]);

  // ✅ ใช้ toast แทน alert ทุกจุด
  const handleAction = async (id: number, type: "approve" | "reject", comment: string) => {
    try {
      setActionLoading(true);
      if (type === "approve") await approveLeaveRequest(id, comment);
      else                    await rejectLeaveRequest(id, comment);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: type === "approve" ? "approved" : "rejected", approved_at: new Date().toISOString(), comment: comment || undefined }
            : r
        )
      );
      setConfirm(null);
      setSelected(null);
      toast.success(type === "approve" ? "อนุมัติคำขอลาเรียบร้อย" : "ปฏิเสธคำขอลาเรียบร้อย");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const openBalanceModal = async (user: { id: number; full_name: string; employee_code: string; department: string }) => {
    try {
      const pool = await getAdminUserPool(user.id, year);
      setBalanceModal({ user, pool });
    } catch {
      toast.error("โหลดข้อมูลวันลาไม่สำเร็จ");
    }
  };

  const handleUpdateBalance = async (remaining_days: number) => {
    if (!balanceModal) return;
    try {
      const updated = await updateLeavePool(balanceModal.user.id, remaining_days, year);
      setBalanceModal((prev) => prev ? { ...prev, pool: updated } : null);
      if (activeTab === "employees") {
        setEmployees((prev) => prev.map((e) =>
          e.id === balanceModal.user.id ? { ...e, pool: updated } : e
        ));
      }
      toast.success("อัปเดตวันลาเรียบร้อย");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "อัปเดตวันลาไม่สำเร็จ");
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  const departments = ["all", ...Array.from(new Set(requests.map((r) => r.user?.department ?? "")))];

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchDept   = deptFilter   === "all" || r.user?.department === deptFilter;
    const matchSearch = !search || r.user?.full_name?.includes(search) || r.user?.employee_code?.includes(search);
    const reqYear  = new Date(r.start_date).getFullYear();
    const reqMonth = new Date(r.start_date).getMonth() + 1;
    const matchDate =
      viewMode === "all"    ? true :
      viewMode === "yearly" ? reqYear === selYear :
                              reqYear === selYear && reqMonth === selMonth;
    return matchStatus && matchDept && matchSearch && matchDate;
  });

  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={fetchRequests} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700">ลองใหม่</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ✅ Toast container — ต้องมีแค่ที่เดียวต่อหน้า */}
      <ToastContainer />

      {confirm && (
        <ConfirmModal
          type={confirm.type}
          request={confirm.req}
          loading={actionLoading}
          onConfirm={(comment) => handleAction(confirm.req.id, confirm.type, comment)}
          onClose={() => setConfirm(null)}
        />
      )}
      {balanceModal && (
        <AddLeaveBalanceModal
          user={balanceModal.user}
          pool={balanceModal.pool}
          year={year}
          onSubmit={handleUpdateBalance}
          onClose={() => setBalanceModal(null)}
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
            <p className="text-xs text-gray-400">ปี {year}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: "requests",  label: "คำขอลา"  },
            { key: "employees", label: "พนักงาน" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
              {key === "requests" && pending > 0 && (
                <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pending}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
              {adminName.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Requests Tab ────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "รออนุมัติ",   value: pending,  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",  click: "pending"  },
                { label: "อนุมัติแล้ว", value: approved, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", click: "approved" },
                { label: "ปฏิเสธ",      value: rejected, color: "text-red-500",     bg: "bg-red-50",     border: "border-red-100",     click: "rejected" },
              ].map(({ label, value, color, bg, border, click }) => (
                <button key={label} onClick={() => setStatusFilter(click as LeaveStatus)}
                  className={`bg-white rounded-2xl border p-5 text-left hover:shadow-md transition-all ${border} ${statusFilter === click ? "ring-2 ring-offset-1 ring-slate-300" : ""}`}>
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="all">ทุกแผนก</option>
                  {departments.filter((d) => d !== "all").map((d) => <option key={d} value={d}>{d}</option>)}
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
              {/* Date filter */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">ดูตาม:</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {(["all", "yearly", "monthly"] as const).map((v) => (
                    <button key={v} onClick={() => setViewMode(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      {v === "all" ? "ทั้งหมด" : v === "yearly" ? "รายปี" : "รายเดือน"}
                    </button>
                  ))}
                </div>
                {viewMode !== "all" && (
                  <select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none">
                    {Array.from({ length: 5 }, (_, i) => year - i).map((y) => (
                      <option key={y} value={y}>ปี {y}</option>
                    ))}
                  </select>
                )}
                {viewMode === "monthly" && (
                  <select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("th-TH", { month: "long" })}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  รายการคำขอลา <span className="ml-2 text-gray-400 font-normal">({filtered.length} รายการ)</span>
                </h2>
                <button onClick={fetchRequests} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  รีเฟรช
                </button>
              </div>
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">ไม่พบรายการ</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-left">
                        {["พนักงาน", "ประเภท", "วันที่ / เวลา", "จำนวน", "เหตุผล", "สถานะ", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((r) => {
                        const meta     = STATUS_META[r.status];
                        const tc       = TYPE_COLORS[r.leave_type_id] ?? "bg-gray-100 text-gray-600";
                        const ac       = avatarColor(r.user?.department);
                        const isHourly = r.leave_unit === "hour";
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ac}`}>
                                  {r.user?.full_name?.slice(0, 2) ?? "??"}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{r.user?.full_name}</p>
                                  <p className="text-xs text-gray-400">{r.user?.department}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${tc}`}>{r.leave_type.name}</span>
                                {isHourly && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium w-fit">
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    ลาชั่วโมง
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-800 whitespace-nowrap">{fmtDate(r.start_date)}</p>
                              {!isHourly && r.start_date !== r.end_date && <p className="text-xs text-gray-400">ถึง {fmtDate(r.end_date)}</p>}
                              {isHourly && r.start_time && <p className="text-xs text-gray-400">{r.start_time} – {r.end_time} น.</p>}
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
                              <div className="flex gap-2 flex-wrap">
                                {r.status === "pending" && (
                                  <>
                                    <button onClick={() => setConfirm({ type: "reject", req: r })}
                                      className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium">ปฏิเสธ</button>
                                    <button onClick={() => setConfirm({ type: "approve", req: r })}
                                      className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">อนุมัติ</button>
                                  </>
                                )}
                                <button onClick={() => r.user && openBalanceModal(r.user)}
                                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">วันลา</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-right px-1">คลิกแถวเพื่อดูรายละเอียด</p>
          </div>
        )}

        {/* ── Employees Tab ────────────────────────────────────── */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..." value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)} />
                </div>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={empDeptFilter} onChange={(e) => setEmpDeptFilter(e.target.value)}>
                  <option value="all">ทุกแผนก</option>
                  {Array.from(new Set(employees.map((e) => e.department))).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button onClick={fetchEmployees} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">
                  รายชื่อพนักงาน
                  <span className="ml-2 text-gray-400 font-normal">
                    ({employees.filter((e) => {
                      const ms = empDeptFilter === "all" || e.department === empDeptFilter;
                      const mq = !empSearch || e.full_name.includes(empSearch) || e.employee_code.includes(empSearch);
                      return ms && mq;
                    }).length} คน)
                  </span>
                </h2>
              </div>
              {empLoading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400">พนักงาน</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">สิทธิ์รวม</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">ใช้ไปแล้ว</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">คงเหลือ</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {employees
                        .filter((e) => {
                          const ms = empDeptFilter === "all" || e.department === empDeptFilter;
                          const mq = !empSearch || e.full_name.includes(empSearch) || e.employee_code.includes(empSearch);
                          return ms && mq;
                        })
                        .map((emp) => {
                          const ac        = avatarColor(emp.department);
                          const pool      = emp.pool;
                          const remaining = pool ? Math.max(0, pool.total_days - pool.used_days) : 0;
                          const pct       = pool && pool.total_days > 0
                            ? Math.round((pool.used_days / pool.total_days) * 100) : 0;
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ac}`}>
                                    {emp.full_name.slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{emp.full_name}</p>
                                    <p className="text-xs text-gray-400">{emp.department} · {emp.employee_code}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="text-sm font-semibold text-gray-700">{pool ? pool.total_days : "—"}</span>
                                {pool && <p className="text-xs text-gray-400">วัน</p>}
                              </td>
                              <td className="px-5 py-4 text-center">
                                {pool ? (
                                  <div className="space-y-1">
                                    <span className="text-sm font-semibold text-gray-700">{pool.used_days}</span>
                                    <div className="w-16 mx-auto h-1 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                ) : <span className="text-xs text-gray-300">—</span>}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`text-sm font-bold ${remaining <= 3 ? "text-red-600" : remaining <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
                                  {pool ? `${remaining} วัน` : "—"}
                                </span>
                              </td>
                              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openBalanceModal({ id: emp.id, full_name: emp.full_name, employee_code: emp.employee_code, department: emp.department })}
                                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium whitespace-nowrap"
                                >
                                  กำหนดวันลา
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}