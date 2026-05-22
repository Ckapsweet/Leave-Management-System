import { useState, useEffect } from "react";
import api from "../../services/api";
import type { LeaveStatus } from "../../services/leaveService";
import { AddLeaveBalanceModal } from "../../components/AddLeaveBalanceModal";
import { ToastContainer } from "../../components/Toast";
import { ConfirmModal } from "../../components/ConfirmModal";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EmployeeLeaveDrawer } from "../../components/EmployeeLeaveDrawer";
import { EditProfileModal } from "../../components/EditProfileModal";
import { DashboardHeader } from "../../components/admin/DashboardHeader";
import { EventPanel } from "../../components/EventPanel";
import {
  STATUS_META, TYPE_COLORS, avatarColor, canEditEmployeeBalance, fmtDate,
} from "../../components/adminHelpers";
import Footer from "../../components/Footer";
import { TodayLeavesWidget } from "../../components/TodayLeavesWidget";
import { formatLeaveDays, formatLeaveHours } from "../../services/leaveTime";
import {
  useAdminAuthUser,
  useAdminEmployees,
  useAdminLeaveRequests,
} from "./adminDashboardHooks";

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
  const [activeTab, setActiveTab] = useState<"requests" | "employees" | "events">("requests");
  const [approvalUsers, setApprovalUsers] = useState<SubordinateUser[]>([]);
  const year = new Date().getFullYear();

  const {
    user,
    showEditProfile,
    setShowEditProfile,
    updateUser,
    handleLogout,
    navigate,
  } = useAdminAuthUser();

  const departmentScope = user?.role === "lead" ? user.department : null;

  const {
    requests,
    loading,
    actionLoading,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    selYear,
    setSelYear,
    selMonth,
    setSelMonth,
    selected,
    setSelected,
    confirm,
    setConfirm,
    fetchRequests,
    handleAction,
    filtered,
    pending,
    approved,
    rejected,
  } = useAdminLeaveRequests(undefined, {
    departmentScope,
    currentUser: user,
    includeTeamHistory: user?.role === "lead",
  });

  const {
    employees,
    empLoading,
    empSearch,
    setEmpSearch,
    empDeptFilter,
    setEmpDeptFilter,
    selectedEmployee,
    setSelectedEmployee,
    empLeaveRequests,
    setEmpLeaveRequests,
    empLeaveLoading,
    balanceModal,
    setBalanceModal,
    fetchEmployees,
    openBalanceModal,
    handleUpdateBalance,
    handleEmployeeClick,
    filteredEmployees,
  } = useAdminEmployees({
    year,
    user,
    requests,
    filterToSupervisor: user?.role === "lead" || user?.role === "manager",
    departmentScope,
  });
  const employeesById = new Map(employees.map((employee) => [String(employee.id), employee]));

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees();
  }, [activeTab, fetchEmployees]);

  useEffect(() => {
    if (user?.role !== "lead") return;
    api.get<SubordinateUser[]>("/api/admin/users")
      .then((res) => setApprovalUsers(res.data))
      .catch((err) => console.error("fetch approval users failed", err));
  }, [user?.role]);

  const getApprovalProgress = (request: (typeof requests)[number]) => {
    const workflowStatus = request.workflow_status ?? request.status;
    if (workflowStatus === "approved") return "อนุมัติครบแล้ว";
    if (workflowStatus === "rejected") return "ปฏิเสธแล้ว";
    if (request.current_assignee_id && request.current_assignee_id !== user?.id) {
      const assignee = approvalUsers.find((item) => item.id === request.current_assignee_id);
      const assigneeName = assignee?.full_name ?? request.approver_name ?? "ผู้อนุมัติถัดไป";
      const assigneeRole = assignee?.role ? ` (${assignee.role})` : "";
      return `ส่งต่อแล้ว: รอ ${assigneeName}${assigneeRole}`;
    }
    return "รอคุณอนุมัติ";
  };

  const canActOnRequest = (request: (typeof requests)[number]) =>
    (request.workflow_status ?? request.status) === "pending" &&
    (!request.current_assignee_id || request.current_assignee_id === user?.id);

  // ── Actions ────────────────────────────────────────────────────────────────

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
          canApprove={canActOnRequest(selected)}
        />
      )}
      {selectedEmployee && !balanceModal && (
        <EmployeeLeaveDrawer
          employee={selectedEmployee}
          leaveRequests={empLeaveRequests}
          loading={empLeaveLoading}
          onClose={() => { setSelectedEmployee(null); setEmpLeaveRequests([]); }}
          canEditBalance={canEditEmployeeBalance(user, selectedEmployee, employeesById)}
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
          onUpdateUser={updateUser}
        />
      )}

      <DashboardHeader
        user={user}
        tabs={[
          { key: "requests", label: "คำขอลา", badge: pending },
          { key: "employees", label: "พนักงาน" },
          { key: "events", label: "Event" },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        onEditProfile={() => setShowEditProfile(true)}
        onMyLeave={() => navigate("/dashboard")}
        onSelectSystem={() => navigate("/select-system")}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Today's Leaves Component ── */}
        <TodayLeavesWidget
          departmentScope={departmentScope}
          supervisorScopeId={user?.role === "lead" ? user.id : null}
        />

        {activeTab === "events" && <EventPanel user={user} />}

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
                        const progress = getApprovalProgress(r);
                        const canAct = canActOnRequest(r);
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
                              {isHourly ? formatLeaveHours(r.total_hours) : formatLeaveDays(r.total_days)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500 max-w-[160px] truncate">{r.reason}</td>
                            <td className="px-5 py-4">
                              <div className="space-y-1.5">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                                  {meta.label}
                                </div>
                                <p className={`text-xs whitespace-nowrap ${canAct ? "text-amber-600" : "text-gray-500"}`}>
                                  {progress}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 flex-wrap">
                                {canAct && (
                                  <>
                                    <button onClick={() => setConfirm({ type: "reject", req: r })}
                                      className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium">ปฏิเสธ</button>
                                    <button onClick={() => setConfirm({ type: "approve", req: r })}
                                      className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">อนุมัติ</button>
                                  </>
                                )}
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
                        const canEditBalance = canEditEmployeeBalance(user, emp, employeesById);
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
                              <span className="text-sm font-semibold text-gray-700">{pool ? formatLeaveDays(pool.total_days) : "—"}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {pool ? (
                                <div className="space-y-1">
                                  <span className="text-sm font-semibold text-gray-700">{formatLeaveDays(pool.used_days)}</span>
                                  <div className="w-16 mx-auto h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              ) : <span className="text-xs text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`text-sm font-bold ${remaining <= 3 ? "text-red-600" : remaining <= 7 ? "text-amber-600" : "text-emerald-600"}`}>
                                {pool ? formatLeaveDays(remaining) : "—"}
                              </span>
                            </td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {canEditBalance && (
                                  <button
                                    onClick={() => openBalanceModal({ id: emp.id, full_name: emp.full_name, employee_code: emp.employee_code, department: emp.department })}
                                    className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium whitespace-nowrap"
                                  >
                                    กำหนดวันลา
                                  </button>
                                )}
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
