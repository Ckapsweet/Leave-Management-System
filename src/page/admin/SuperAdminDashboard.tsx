import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import api from "../../services/api";
import {
  getAdminLeaveRequests, approveLeaveRequest, rejectLeaveRequest,
  getAdminUserPool, updateLeavePool,
} from "../../services/leaveService";
import type { LeaveRequest, LeaveStatus, LeavePool } from "../../services/leaveService";
import { AddLeaveBalanceModal } from "../../components/AddLeaveBalanceModal";
import { ToastContainer, toast } from "../../components/Toast";
import { ConfirmModal } from "../../components/ConfirmModal";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmployeeLeaveDrawer } from "../../components/EmployeeLeaveDrawer";
import { EditProfileModal } from "../../components/EditProfileModal";
import type { AuthUser } from "../../services/authService";
import {
  STATUS_META, TYPE_COLORS, avatarColor, fmtDate,
  type Employee, type EmployeeWithBalance,
} from "../../components/adminHelpers";
import Footer from "../../components/Footer";
import { TodayLeavesWidget } from "../../components/TodayLeavesWidget";

// ── Subordinate User type ────────────────────────────────────────────────────
interface SubordinateUser {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  role: string;
  supervisor_id: number | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // ── Leave requests state ───────────────────────────────────────────────────
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("pending");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "yearly" | "monthly">("all");
  const [selYear, setSelYear] = useState<number>(new Date().getFullYear());
  const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm] = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);

  // ── Employees state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"requests" | "employees" | "subordinates">("requests");
  const [employees, setEmployees] = useState<EmployeeWithBalance[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBalance | null>(null);
  const [empLeaveRequests, setEmpLeaveRequests] = useState<LeaveRequest[]>([]);
  const [empLeaveLoading, setEmpLeaveLoading] = useState(false);

  // ── Subordinate management state (lead & manager) ──────────────────────────
  const [allUsers, setAllUsers] = useState<SubordinateUser[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subAssigning, setSubAssigning] = useState<number | null>(null);
  const [subSearch, setSubSearch] = useState("");

  // ── Balance modal state ────────────────────────────────────────────────────
  const [balanceModal, setBalanceModal] = useState<{
    user: { id: number; full_name: string; employee_code: string; department: string };
    pool: LeavePool;
  } | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const adminName = user?.full_name ?? "Admin";
  const year = new Date().getFullYear();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminLeaveRequests();
      setRequests(data);
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
      let users: Employee[] = usersRes.data.filter((u: Employee) => u.role !== "admin");

      // Lead/Manager/Assistant Manager: แสดงเฉพาะทีมของตัวเอง (supervisor_id === user.id)
      if (user?.role === "lead" || user?.role === "manager" || user?.role === "assistant manager") {
        users = users.filter((u: any) => u.supervisor_id === user.id);
      }
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
  }, [year, user]);

  const fetchAllUsersForLead = useCallback(async () => {
    try {
      setSubLoading(true);
      const res = await api.get("/api/admin/users");
      setAllUsers(res.data);
    } catch (err: any) {
      console.error("fetch users for subordinate management failed", err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees();
    if (activeTab === "subordinates") fetchAllUsersForLead();
  }, [activeTab, fetchEmployees, fetchAllUsersForLead]);

  const handleAssignSubordinate = async (userId: number, assign: boolean) => {
    try {
      setSubAssigning(userId);
      await api.patch(`/api/admin/users/${userId}/assign-subordinate`, { assign });
      setAllUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, supervisor_id: assign ? (user?.id ?? null) : null }
            : u
        )
      );
      const isManagerLevel = user?.role === "manager" || user?.role === "assistant manager";
      const msg = assign
        ? (isManagerLevel ? "กำหนด Lead เรียบร้อย" : "กำหนดทีมเรียบร้อย")
        : (isManagerLevel ? "ยกเลิก Lead เรียบร้อย" : "ยกเลิกทีมเรียบร้อย");
      toast.success(msg);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setSubAssigning(null);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAction = async (id: number, type: "approve" | "reject", comment: string) => {
    try {
      setActionLoading(true);
      if (type === "approve") await approveLeaveRequest(id, comment);
      else await rejectLeaveRequest(id, comment);
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

  const handleEmployeeClick = async (emp: EmployeeWithBalance) => {
    setSelectedEmployee(emp);
    setEmpLeaveRequests([]);
    setEmpLeaveLoading(true);
    try {
      const data = await getAdminLeaveRequests({ user_id: emp.id });
      setEmpLeaveRequests(data);
    } catch {
      setEmpLeaveRequests(requests.filter((r) => r.user_id === emp.id));
    } finally {
      setEmpLeaveLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = !search || r.user?.full_name?.includes(search) || r.user?.employee_code?.includes(search);
    const reqYear = new Date(r.start_date).getFullYear();
    const reqMonth = new Date(r.start_date).getMonth() + 1;
    const matchDate =
      viewMode === "all" ? true :
        viewMode === "yearly" ? reqYear === selYear :
          reqYear === selYear && reqMonth === selMonth;

    // Hierarchy filtering
    const isLead = user?.role === "lead";
    const isManager = user?.role === "manager" || user?.role === "assistant manager";

    if (isLead) {
      // Lead only sees their direct reports
      if (r.user?.supervisor_id !== user.id) return false;
    } else if (isManager) {
      // Manager only sees Leads (per request)
      if (r.user?.role !== "lead") return false;
    }

    return matchStatus && matchSearch && matchDate;
  });

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const filteredEmployees = employees.filter((e) => {
    const ms = empDeptFilter === "all" || e.department === empDeptFilter;
    const mq = !empSearch || e.full_name.includes(empSearch) || e.employee_code.includes(empSearch);
    return ms && mq;
  });

  // ── Loading / Error states ─────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <ToastContainer />

      {/* Modals & Drawers */}
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
      {selectedEmployee && !balanceModal && (
        <EmployeeLeaveDrawer
          employee={selectedEmployee}
          leaveRequests={empLeaveRequests}
          loading={empLeaveLoading}
          onClose={() => { setSelectedEmployee(null); setEmpLeaveRequests([]); }}
          onOpenBalance={() => openBalanceModal({
            id: selectedEmployee.id,
            full_name: selectedEmployee.full_name,
            employee_code: selectedEmployee.employee_code,
            department: selectedEmployee.department,
          })}
        />
      )}

      {showEditProfile && user && (
        <EditProfileModal
          user={user}
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
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{user?.role} — ระบบการลา</h1>
            <p className="text-xs text-gray-400">ปี {year}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: "requests", label: "คำขอลา" },
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
          {/* Lead / Manager / Assistant Manager: Manage Subordinates tab */}
          {(user?.role === "lead" || user?.role === "manager" || user?.role === "assistant manager") && (
            <button onClick={() => setActiveTab("subordinates")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "subordinates" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {user?.role === "manager" || user?.role === "assistant manager" ? "จัดการทีม Lead" : "จัดการทีม"}
              {allUsers.filter(u => u.supervisor_id === user.id).length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {allUsers.filter(u => u.supervisor_id === user.id).length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowEditProfile(true)}>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
              {adminName.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
          <button onClick={() => navigate("/select-system")} className="text-xs text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3h5v5M8 21H3v-5M21 3L12 12M3 21l9-9" /></svg>
            สลับระบบ
          </button>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Today's Leaves Component ── */}
        <TodayLeavesWidget />

        {/* ── Requests Tab ──────────────────────────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "รออนุมัติ", value: pending, color: "text-amber-600", border: "border-amber-100", click: "pending" },
                { label: "อนุมัติแล้ว", value: approved, color: "text-emerald-600", border: "border-emerald-100", click: "approved" },
                { label: "ปฏิเสธ", value: rejected, color: "text-red-500", border: "border-red-100", click: "rejected" },
              ].map(({ label, value, color, border, click }) => (
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
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
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

            {/* Requests table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  รายการคำขอลา <span className="ml-2 text-gray-400 font-normal">({filtered.length} รายการ)</span>
                </h2>
                <button onClick={fetchRequests} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
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
                        const meta = STATUS_META[r.status];
                        const tc = TYPE_COLORS[r.leave_type_id] ?? "bg-gray-100 text-gray-600";
                        const ac = avatarColor(r.user?.department);
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
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
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

        {/* ── Employees Tab ──────────────────────────────────────────────────── */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            {/* Employee filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                  รีเฟรช
                </button>
              </div>
            </div>

            {/* Employees table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">
                  รายชื่อพนักงาน
                  <span className="ml-2 text-gray-400 font-normal">({filteredEmployees.length} คน)</span>
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
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">วันลาคงเหลือ</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredEmployees.map((emp) => {
                        const ac = avatarColor(emp.department);
                        const pool = emp.pool;
                        const remaining = pool ? Math.max(0, pool.total_days - pool.used_days) : 0;
                        const pct = pool && pool.total_days > 0 ? Math.round((pool.used_days / pool.total_days) * 100) : 0;
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => handleEmployeeClick(emp)}>
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
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openBalanceModal({ id: emp.id, full_name: emp.full_name, employee_code: emp.employee_code, department: emp.department })}
                                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium whitespace-nowrap"
                                >
                                  เพิ่มวันลา
                                </button>
                                <svg className="text-gray-300 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
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
            <p className="text-xs text-gray-400 text-right px-1">คลิกแถวพนักงานเพื่อดูประวัติการลา</p>
          </div>
        )}
        {/* ── Subordinates Tab (Lead & Manager) ───────────────────────────── */}
        {activeTab === "subordinates" && (user?.role === "lead" || user?.role === "manager" || user?.role === "assistant manager") && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold">
                    {user?.role === "manager" || user?.role === "assistant manager" ? "จัดการทีม Lead" : "จัดการทีมลูกน้อง"}
                  </h2>
                  <p className="text-indigo-200 text-xs mt-0.5">
                    {user?.role === "manager" || user?.role === "assistant manager"
                      ? "เลือก Lead ที่คุณต้องการดูแลและอนุมัติคำขอลา"
                      : "เลือกพนักงานที่คุณต้องการดูแลและอนุมัติคำขอลา"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{allUsers.filter(u => u.supervisor_id === user.id).length}</p>
                  <p className="text-indigo-200 text-xs">
                    {user?.role === "manager" || user?.role === "assistant manager" ? "Lead ปัจจุบัน" : "ลูกน้องปัจจุบัน"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder={user?.role === "manager" || user?.role === "assistant manager" ? "ค้นหา Lead..." : "ค้นหาชื่อหรือรหัสพนักงาน..."}
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* My Team */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      {user?.role === "manager" || user?.role === "assistant manager" ? "Lead ในทีมของฉัน" : "ทีมของฉัน"}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    {allUsers.filter(u => u.supervisor_id === user.id &&
                      (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                    ).length} คน
                  </span>
                </div>
                {subLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {allUsers.filter(u => u.supervisor_id === user.id &&
                      (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                    ).length === 0 ? (
                      <div className="py-14 text-center text-gray-400 text-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                          </svg>
                        </div>
                        {user?.role === "manager" || user?.role === "assistant manager" ? "ยังไม่มี Lead ในทีม" : "ยังไม่มีทีมงาน"}<br />
                        <span className="text-xs text-gray-300">เพิ่มจากรายการทางขวา</span>
                      </div>
                    ) : (
                      allUsers.filter(u => u.supervisor_id === user.id &&
                        (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                      ).map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(emp.department)}`}>
                            {emp.full_name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{emp.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{emp.department} &middot; {emp.employee_code}</p>
                          </div>
                          <button
                            onClick={() => handleAssignSubordinate(emp.id, false)}
                            disabled={subAssigning === emp.id}
                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {subAssigning === emp.id
                              ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            }
                            ยกเลิก
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Available to assign */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      {user?.role === "manager" || user?.role === "assistant manager" ? "Lead ที่ยังไม่มีหัวหน้า" : "พนักงานที่ยังไม่มีหัวหน้า"}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    {allUsers.filter(u => u.supervisor_id === null &&
                      (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                    ).length} คน
                  </span>
                </div>
                {subLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {allUsers.filter(u => u.supervisor_id === null &&
                      (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                    ).length === 0 ? (
                      <div className="py-14 text-center text-gray-400 text-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
                          </svg>
                        </div>
                        {user?.role === "manager" || user?.role === "assistant manager" ? "ไม่มี Lead ที่ยังไม่มีหัวหน้า" : "ไม่มีพนักงานที่ยังไม่มีหัวหน้า"}
                      </div>
                    ) : (
                      allUsers.filter(u => u.supervisor_id === null &&
                        (!subSearch || u.full_name.includes(subSearch) || u.employee_code.includes(subSearch))
                      ).map(emp => (
                        <div key={emp.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(emp.department)}`}>
                            {emp.full_name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{emp.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{emp.department} &middot; {emp.employee_code}</p>
                          </div>
                          <button
                            onClick={() => handleAssignSubordinate(emp.id, true)}
                            disabled={subAssigning === emp.id}
                            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {subAssigning === emp.id
                              ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                            }
                            เพิ่ม
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              หมายเหตุ: {user?.role === "manager" || user?.role === "assistant manager" ? "Lead" : "พนักงาน"}ที่มีหัวหน้าคนอื่นอยู่แล้วจะไม่ปรากฏในรายการ กรุณาติดต่อ Admin เพื่อเปลี่ยนแปลง
            </p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}