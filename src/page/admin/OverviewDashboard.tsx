import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import api from "../../services/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { AuthUser } from "../../services/authService";
import { EditProfileModal } from "../../components/EditProfileModal";
import { ToastContainer, toast } from "../../components/Toast";
import { getAdminLeaveRequests, getAdminUserPool, updateLeavePool, approveLeaveRequest, rejectLeaveRequest } from "../../services/leaveService";
import type { LeaveRequest, LeavePool, LeaveStatus } from "../../services/leaveService";
import { EmployeeLeaveDrawer } from "../../components/EmployeeLeaveDrawer";
import { AddLeaveBalanceModal } from "../../components/AddLeaveBalanceModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { DetailDrawer } from "../../components/DetailDrawer";
import { TodayLeavesWidget } from "../../components/TodayLeavesWidget";
import { avatarColor, STATUS_META, TYPE_COLORS, fmtDate, type Employee, type EmployeeWithBalance } from "../../components/adminHelpers";
import Footer from "../../components/Footer";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#F06292'];

interface DashboardData {
    summary: {
        total_users: number;
        pending_leaves: number;
        pending_ots: number;
        total_approved_leave_days: number;
    };
    deptStats: { name: string; value: number }[];
    monthlyStats: { name: string; 'จำนวนครั้งที่ลา': number }[];
    leaveTypeStats: { department: string; leave_type: string; total_leave_days: number }[];
}

export default function OverviewDashboard() {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    const [activeTab, setActiveTab] = useState<"requests" | "reports" | "employees">("requests");

    // Requests State
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [reqLoading, setReqLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("pending");
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"all" | "yearly" | "monthly">("all");
    const [selYear, setSelYear] = useState<number>(year);
    const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1);
    const [selected, setSelected] = useState<LeaveRequest | null>(null);
    const [confirm, setConfirm] = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Dashboard Stats
    const [data, setData] = useState<DashboardData | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Employees List
    const [employees, setEmployees] = useState<EmployeeWithBalance[]>([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [empSearch, setEmpSearch] = useState("");
    const [empDeptFilter, setEmpDeptFilter] = useState("all");

    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBalance | null>(null);
    const [empLeaveRequests, setEmpLeaveRequests] = useState<LeaveRequest[]>([]);
    const [empLeaveLoading, setEmpLeaveLoading] = useState(false);

    const [balanceModal, setBalanceModal] = useState<{
        user: { id: number; full_name: string; employee_code: string; department: string };
        pool: LeavePool;
    } | null>(null);

    const [user, setUser] = useState<AuthUser | null>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        try {
            setStatsLoading(true);
            const res = await api.get("/api/admin/reports/dashboard-stats");
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            setEmpLoading(true);
            const usersRes = await api.get("/api/admin/users");
            let users: Employee[] = usersRes.data.filter((u: Employee) => u.role !== "admin");

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
        if (activeTab === "reports") fetchDashboardData();
        if (activeTab === "employees") fetchEmployees();
    }, [activeTab, fetchDashboardData, fetchEmployees]);

    const fetchRequests = useCallback(async () => {
        try {
            setReqLoading(true);
            const data = await getAdminLeaveRequests();
            setRequests(data);
        } catch {
            toast.error("โหลดข้อมูลคำขอลาไม่สำเร็จ");
        } finally {
            setReqLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "requests" || activeTab === "reports") fetchRequests();
    }, [activeTab, fetchRequests]);

    const handleLogout = async () => {
        await logout();
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    };

    const openBalanceModal = async (u: { id: number; full_name: string; employee_code: string; department: string }) => {
        try {
            const pool = await getAdminUserPool(u.id, year);
            setBalanceModal({ user: u, pool });
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
            toast.error("โหลดประวัติการลาไม่สำเร็จ");
        } finally {
            setEmpLeaveLoading(false);
        }
    };

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
            // refresh stats and employees silently if needed
            if (activeTab === "reports") fetchDashboardData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "ดำเนินการไม่สำเร็จ");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredEmployees = employees.filter((e) => {
        const ms = empDeptFilter === "all" || e.department === empDeptFilter;
        const mq = !empSearch || e.full_name.includes(empSearch) || e.employee_code.includes(empSearch);
        return ms && mq;
    });

    const filteredRequests = requests.filter((r) => {
        const matchStatus = statusFilter === "all" || r.status === statusFilter;
        const matchSearch = !search || r.user?.full_name?.includes(search) || r.user?.employee_code?.includes(search);
        const reqYear = new Date(r.start_date).getFullYear();
        const reqMonth = new Date(r.start_date).getMonth() + 1;
        const matchDate =
            viewMode === "all" ? true :
                viewMode === "yearly" ? reqYear === selYear :
                    reqYear === selYear && reqMonth === selMonth;
        return matchStatus && matchSearch && matchDate;
    });

    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

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
            {selected && !confirm && (
                <DetailDrawer
                    request={selected}
                    onClose={() => setSelected(null)}
                    onApprove={() => setConfirm({ type: "approve", req: selected })}
                    onReject={() => setConfirm({ type: "reject", req: selected })}
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
                    user={user as any}
                    onClose={() => setShowEditProfile(false)}
                    onUpdateUser={(updated: any) => {
                        setUser(updated);
                        localStorage.setItem("user", JSON.stringify(updated));
                    }}
                />
            )}

            {/* Header / Navbar */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-gray-900 capitalize">{user?.role || "Admin"} — ระบบการลา</h1>
                        <p className="text-xs text-gray-400">Ckapsweet</p>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setActiveTab("requests")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        คำขอลา
                        {pending > 0 && (
                            <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pending}</span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab("reports")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "reports" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        ภาพรวม (Report)
                    </button>
                    <button onClick={() => setActiveTab("employees")}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === "employees" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        พนักงานทั้งหมด
                    </button>
                </div>

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowEditProfile(true)}>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                            {user?.full_name?.slice(0, 2) || "??"}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-semibold text-gray-800">{user?.full_name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={() => navigate("/dashboard")} className="text-xs text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
                        วันลาของฉัน
                    </button>
                    <button onClick={() => navigate("/select-system")} className="text-xs text-slate-600 hover:text-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3h5v5M8 21H3v-5M21 3L12 12M3 21l9-9" /></svg>
                        สลับระบบ
                    </button>
                    <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                        ออกจากระบบ
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* Today's Leaves Component */}
                <TodayLeavesWidget />

                {/* TAB 0: REQUESTS */}
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
                                    รายการคำขอลา <span className="ml-2 text-gray-400 font-normal">({filteredRequests.length} รายการ)</span>
                                </h2>
                                <button onClick={fetchRequests} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                    รีเฟรช
                                </button>
                            </div>
                            {reqLoading ? (
                                <div className="py-16 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredRequests.length === 0 ? (
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
                                            {filteredRequests.map((r) => {
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

                {/* TAB 1: REPORTS (Charts) */}
                {activeTab === "reports" && (
                    <div className="space-y-6">
                        {statsLoading ? (
                            <div className="py-16 flex justify-center">
                                <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : !data ? (
                            <div className="py-16 text-center text-red-500 text-sm">ไม่สามารถโหลดข้อมูลได้</div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center border-l-4 border-blue-500 hover:shadow-md transition">
                                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
                                            <PeopleIcon fontSize="large" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">พนักงานทั้งหมด</p>
                                            <p className="text-2xl font-bold text-gray-800">{data.summary.total_users} <span className="text-sm font-normal">คน</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center border-l-4 border-green-500 hover:shadow-md transition">
                                        <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
                                            <EventBusyIcon fontSize="large" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">วันลาที่อนุมัติแล้ว (ปีนี้)</p>
                                            <p className="text-2xl font-bold text-gray-800">{data.summary.total_approved_leave_days} <span className="text-sm font-normal">วัน</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center border-l-4 border-orange-500 hover:shadow-md transition">
                                        <div className="p-3 bg-orange-100 rounded-full text-orange-600 mr-4">
                                            <PendingActionsIcon fontSize="large" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">รออนุมัติการลา</p>
                                            <p className="text-2xl font-bold text-gray-800">{data.summary.pending_leaves} <span className="text-sm font-normal">รายการ</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center border-l-4 border-purple-500 hover:shadow-md transition">
                                        <div className="p-3 bg-purple-100 rounded-full text-purple-600 mr-4">
                                            <AccessTimeIcon fontSize="large" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">รออนุมัติ OT</p>
                                            <p className="text-2xl font-bold text-gray-800">{data.summary.pending_ots} <span className="text-sm font-normal">รายการ</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">📈 แนวโน้มคำขอลาแยกตามเดือน</h2>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: '#F3F4F6' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="จำนวนครั้งที่ลา" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">📊 สัดส่วนจำนวนครั้งการลาแยกตามแผนก</h2>
                                        <div className="h-72 flex justify-center items-center">
                                            {data.deptStats.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data.deptStats}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={70}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                        >
                                                            {data.deptStats.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <p className="text-gray-400">ยังไม่มีข้อมูล</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-5 border-b border-gray-100">
                                        <h2 className="text-sm font-semibold text-gray-700">📑 รายละเอียดวันลาแยกตามแผนกและประเภทการลา</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-gray-100">
                                                    <th className="px-5 py-3 text-xs font-semibold text-gray-400">แผนก</th>
                                                    <th className="px-5 py-3 text-xs font-semibold text-gray-400">ประเภทการลา</th>
                                                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-right">จำนวนวันลาทั้งหมดที่ใช้ไป (วัน)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {data.leaveTypeStats.length > 0 ? (
                                                    data.leaveTypeStats.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-4 text-sm font-medium text-gray-800">{row.department || 'ไม่ระบุแผนก'}</td>
                                                            <td className="px-5 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.leave_type.includes('ป่วย') ? 'bg-red-100 text-red-700' :
                                                                    row.leave_type.includes('พักผ่อน') ? 'bg-green-100 text-green-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {row.leave_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-sm font-bold text-gray-800 text-right">{parseFloat(row.total_leave_days.toString()).toFixed(2)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-5 py-12 text-center text-sm text-gray-400">
                                                            ไม่มีประวัติการอนุมัติวันลาในปีนี้
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB 2: EMPLOYEES */}
                {activeTab === "employees" && (
                    <div className="space-y-4">
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
            </main>
            <Footer />
        </div>
    );
}