import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import {
  getLeaveTypes, getLeavePool, getMyLeaveRequests, createLeaveRequest, cancelLeaveRequest
} from "../services/leaveService";
import type { LeaveType, LeavePool, LeaveRequest, LeaveStatus, LeaveRequestPayload, LeaveBalance } from "../services/leaveService";
import { LeaveRequestModal } from "../components/Leaverequestmodal";
import type { LeaveRequestForm } from "../components/Leaverequestmodal";
import { ToastContainer, toast } from "../components/Toast";
import { EditProfileModal } from "../components/EditProfileModal";
import type { AuthUser } from "../services/authService";
import Footer from "../components/Footer";
import { TodayLeavesWidget } from "../components/TodayLeavesWidget";

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<number, string> = {
  1: "bg-sky-100 text-sky-700",
  2: "bg-teal-100 text-teal-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-orange-100 text-orange-700",
};

const STATUS_META: Record<LeaveStatus, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  pending: { label: "รออนุมัติ", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: "⏳" },
  approved: { label: "อนุมัติแล้ว", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", icon: "✓" },
  rejected: { label: "ปฏิเสธ", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-400", icon: "✗" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── DurationBadge ─────────────────────────────────────────────────────────────

function DurationBadge({ req }: { req: LeaveRequest }) {
  if (req.leave_unit === "hour") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        {req.total_hours} ชม.
      </span>
    );
  }
  return <span className="text-sm font-semibold text-gray-700">{req.total_days} วัน</span>;
}

// ── RequestRow ────────────────────────────────────────────────────────────────

function RequestRow({ req, onClick, onCancel }: { req: LeaveRequest; onClick: () => void; onCancel: () => void }) {
  const meta = STATUS_META[req.status];
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const isHourly = req.leave_unit === "hour";
  return (
    <tr className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{fmtDate(req.start_date)}</p>
          {!isHourly && req.start_date !== req.end_date && <p className="text-xs text-gray-400">ถึง {fmtDate(req.end_date)}</p>}
          {isHourly && req.start_time && <p className="text-xs text-gray-400">{req.start_time} – {req.end_time} น.</p>}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${typeColor}`}>{req.leave_type.name}</span>
          {isHourly && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium w-fit">ลาชั่วโมง</span>}
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap"><DurationBadge req={req} /></td>
      <td className="px-5 py-4 text-sm text-gray-500 max-w-[180px] truncate">{req.reason}</td>
      <td className="px-5 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
          {meta.label}
        </div>
      </td>
      <td className="px-5 py-4">
        {req.status === "pending" && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
            ยกเลิก
          </button>
        )}
      </td>
    </tr>
  );
}

// ── StatusBanner ──────────────────────────────────────────────────────────────

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

// ── CancelConfirmDialog ───────────────────────────────────────────────────────

function CancelConfirmDialog({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">ยืนยันการยกเลิกคำขอลา</h3>
            <p className="text-xs text-gray-500 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                กำลังยกเลิก...
              </>
            ) : "ยืนยันยกเลิก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DetailDrawer ──────────────────────────────────────────────────────────────

function DetailDrawer({
  req,
  onClose,
  onCancel,
  cancelling,
}: {
  req: LeaveRequest;
  onClose: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const isHourly = req.leave_unit === "hour";
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">รายละเอียดคำขอ #{req.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <StatusBanner status={req.status} approved_at={req.approved_at} />

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">รูปแบบการลา</span>
              {isHourly ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
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
              {isHourly
                ? <span className="font-bold text-indigo-700 text-base">{req.total_hours} ชั่วโมง</span>
                : <span className="font-bold text-gray-900 text-base">{req.total_days} วัน</span>}
            </div>
          </div>

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

        {req.status === "pending" && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  กำลังยกเลิก...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                  ยกเลิกคำขอลา
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function UserLeaveDashboard() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const [user, setUser] = useState<{ full_name: string; employee_code: string; department: string } | null>(null);
  const [leavePool, setLeavePool] = useState<LeavePool | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [viewMode, setViewMode] = useState<"all" | "monthly" | "yearly">("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // ── Fetch all data ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [types, poolRes, reqRes] = await Promise.all([
        getLeaveTypes(),
        getLeavePool(year),
        getMyLeaveRequests(),
      ]);
      setLeaveTypes(types);
      setLeavePool(poolRes);
      setRequests(reqRes);

      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (err: any) {
      setError(err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Submit new leave ────────────────────────────────────────
  const handleAddLeave = async (form: LeaveRequestForm): Promise<void> => {
    setSubmitting(true);
    try {
      const newReq = await createLeaveRequest(form as LeaveRequestPayload);
      setRequests((prev) => [newReq, ...prev]);
      setShowModal(false);
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel leave ────────────────────────────────────────────
  const handleCancelLeave = async () => {
    if (confirmCancelId === null) return;
    setCancelling(true);
    try {
      await cancelLeaveRequest(confirmCancelId);
      setRequests((prev) => prev.filter((r) => r.id !== confirmCancelId));
      toast.success("ยกเลิกคำขอลาสำเร็จ");
      setConfirmCancelId(null);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "ยกเลิกคำขอไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setCancelling(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Derived ─────────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const reqYear = new Date(r.start_date).getFullYear();
    const reqMonth = new Date(r.start_date).getMonth() + 1;
    const matchDate =
      viewMode === "all" ? true :
        viewMode === "yearly" ? reqYear === selectedYear :
          reqYear === selectedYear && reqMonth === selectedMonth;
    return matchStatus && matchDate;
  });

  const totalUsed = leavePool?.used_days ?? 0;
  const totalRemaining = leavePool?.remaining ?? 0;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // ── Loading / Error ──────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">
          ลองใหม่
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Confirm cancel dialog */}
      {confirmCancelId !== null && (
        <CancelConfirmDialog
          onConfirm={handleCancelLeave}
          onClose={() => setConfirmCancelId(null)}
          loading={cancelling}
        />
      )}

      {selected && (
        <DetailDrawer
          req={selected}
          onClose={() => setSelected(null)}
          onCancel={() => setConfirmCancelId(selected.id)}
          cancelling={cancelling}
        />
      )}

      <ToastContainer />

      {showModal && (
        <LeaveRequestModal
          leaveTypes={leaveTypes}
          pool={leavePool}
          onSubmit={handleAddLeave}
          onClose={() => setShowModal(false)}
          isLoading={submitting}
        />
      )}

      {showEditProfile && user && (
        <EditProfileModal
          user={user as unknown as AuthUser}
          onClose={() => setShowEditProfile(false)}
          onUpdateUser={(updated) => {
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
          }}
        />
      )}

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
            <p className="text-xs text-gray-400">Ckapsweet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            เพิ่มการลา
          </button>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">{pendingCount} รออนุมัติ</span>
            </div>
          )}
          <div className="flex items-center gap-2" onClick={() => setShowEditProfile(true)}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
              {user?.full_name?.slice(0, 2) ?? "??"}
            </div>
            <div className="hidden sm:block text-right cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-xs font-semibold text-gray-800">{user?.full_name ?? ""}</p>
              <p className="text-xs text-gray-400">{user?.employee_code ?? ""}</p>
            </div>
          </div>
          {/* Link to Admin View for Leads/Managers */}
          {user && ["lead", "assistant manager", "manager"].includes((user as any).role) && (
            <button onClick={() => navigate((user as any).role === "lead" ? "/lead" : "/manager")} className="text-xs text-emerald-600 hover:text-emerald-800 px-2.5 py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              จัดการทีม
            </button>
          )}
          <button onClick={() => navigate("/select-system")} className="text-xs text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3h5v5M8 21H3v-5M21 3L12 12M3 21l9-9" /></svg>
            สลับระบบ
          </button>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Profile + summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {user?.full_name?.slice(0, 1) ?? "?"}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.full_name ?? ""}</h2>
              <p className="text-sm text-gray-500">{user?.department ?? ""} · {user?.employee_code ?? ""}</p>
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

        {/* ── Today's Leaves Component ── */}
        <TodayLeavesWidget />

        {/* Leave balances by type */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">วันลาคงเหลือแต่ละประเภท</h3>
          {leavePool ? (
            leavePool.balances && leavePool.balances.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leavePool.balances.map((balance) => (
                  <LeaveBalanceCard key={balance.leave_type_id} balance={balance} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
                ไม่พบข้อมูลวันลาแยกตามประเภท
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-400">
              ยังไม่มีสิทธิ์วันลาสำหรับปีนี้ กรุณาติดต่อ HR
            </div>
          )}
        </div>
        {/* Leave history */}
        <div>
          <div className="flex flex-col gap-3 mb-3 px-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ประวัติการลา</h3>
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {s === "all" ? "ทั้งหมด" : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {(["all", "yearly", "monthly"] as const).map((v) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {v === "all" ? "ทั้งหมด" : v === "yearly" ? "รายปี" : "รายเดือน"}
                  </button>
                ))}
              </div>
              {viewMode !== "all" && (
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {Array.from({ length: 5 }, (_, i) => year - i).map((y) => (
                    <option key={y} value={y}>ปี {y}</option>
                  ))}
                </select>
              )}
              {viewMode === "monthly" && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString("th-TH", { month: "long" })}
                    </option>
                  ))}
                </select>
              )}
              <span className="text-xs text-gray-400">({filtered.length} รายการ)</span>
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
                      {["วันที่ / เวลา", "ประเภท", "จำนวน", "เหตุผล", "สถานะ", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((r) => (
                      <RequestRow key={r.id} req={r} onClick={() => setSelected(r)} onCancel={() => setConfirmCancelId(r.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-right mt-2 px-1">คลิกแถวเพื่อดูรายละเอียด</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LeaveBalanceCard({ balance }: { balance: LeaveBalance }) {
  const typeColor = TYPE_COLORS[balance.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const total = Math.max(0, balance.total_days);
  const remaining = Math.max(0, balance.remaining);
  const used = Math.max(0, balance.used_days);
  const remainingRatio = total > 0 ? remaining / total : 0;
  const barColor = remainingRatio < 0.2 ? "bg-red-400" : remainingRatio < 0.5 ? "bg-amber-400" : "bg-indigo-500";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeColor}`}>
            {balance.name}
          </span>
          <p className="text-xs text-gray-400 mt-2">สิทธิ์ประจำปี</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${remaining <= 3 ? "text-red-600" : "text-indigo-600"}`}>
            {remaining}
          </p>
          <p className="text-xs text-gray-400">วันคงเหลือ</p>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        {total > 0 && (
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, remainingRatio * 100)}%` }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400">สิทธิ์รวม</p>
          <p className="text-sm font-bold text-gray-800">{total} วัน</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ใช้ไปแล้ว</p>
          <p className="text-sm font-bold text-gray-800">{used} วัน</p>
        </div>
      </div>
    </div>
  );
}
