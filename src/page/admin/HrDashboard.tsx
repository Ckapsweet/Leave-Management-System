import { useEffect, useMemo, useState } from "react";
import type { LeaveStatus } from "../../services/leaveService";
import { AddLeaveBalanceModal } from "../../components/AddLeaveBalanceModal";
import { AdminReportWidget } from "../../components/AdminReportWidget";
import { ConfirmModal } from "../../components/ConfirmModal";
import { DashboardHeader } from "../../components/admin/DashboardHeader";
import { DetailDrawer } from "../../components/DetailDrawer";
import { EditProfileModal } from "../../components/EditProfileModal";
import { EmployeeLeaveDrawer } from "../../components/EmployeeLeaveDrawer";
import Footer from "../../components/Footer";
import { ToastContainer } from "../../components/Toast";
import {
  STATUS_META,
  TYPE_COLORS,
  avatarColor,
  canEditEmployeeBalance,
  fmtDate,
} from "../../components/adminHelpers";
import { formatLeaveDays, formatLeaveHours, formatLeaveUsage } from "../../services/leaveTime";
import {
  useAdminAuthUser,
  useAdminEmployees,
  useAdminLeaveRequests,
} from "./adminDashboardHooks";

type HrTab = "employees" | "history" | "reports";

export default function HrDashboard() {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<HrTab>("employees");

  const {
    user,
    showEditProfile,
    setShowEditProfile,
    updateUser,
    handleLogout,
    navigate,
  } = useAdminAuthUser();

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
  } = useAdminLeaveRequests();

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
  });

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [String(employee.id), employee])),
    [employees]
  );

  const balanceSummary = useMemo(() => {
    return employees.reduce(
      (summary, employee) => {
        if (!employee.pool) return summary;
        const remaining = Math.max(0, employee.pool.total_days - employee.pool.used_days);
        summary.total += employee.pool.total_days;
        summary.used += employee.pool.used_days;
        summary.remaining += remaining;
        if (remaining <= 3) summary.lowBalance += 1;
        return summary;
      },
      { total: 0, used: 0, remaining: 0, lowBalance: 0 }
    );
  }, [employees]);

  useEffect(() => {
    if (activeTab === "employees" || activeTab === "reports") fetchEmployees();
  }, [activeTab, fetchEmployees]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50"
      style={{ fontFamily: "'DM Sans', 'Noto Sans Thai', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

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

      {balanceModal && canEditEmployeeBalance(user, balanceModal.user, employeesById) && (
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
          canApprove={false}
        />
      )}

      {selectedEmployee && !balanceModal && (
        <EmployeeLeaveDrawer
          employee={selectedEmployee}
          leaveRequests={empLeaveRequests}
          loading={empLeaveLoading}
          onClose={() => {
            setSelectedEmployee(null);
            setEmpLeaveRequests([]);
          }}
          canEditBalance={canEditEmployeeBalance(user, selectedEmployee, employeesById)}
          onOpenBalance={() =>
            openBalanceModal({
              id: selectedEmployee.id,
              full_name: selectedEmployee.full_name,
              employee_code: selectedEmployee.employee_code,
              department: selectedEmployee.department,
            })
          }
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
          { key: "employees", label: "วันลาพนักงาน" },
          { key: "history", label: "ประวัติการลา", badge: pending },
          { key: "reports", label: "สรุปรวม", icon: "reports" as const },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as HrTab)}
        onEditProfile={() => setShowEditProfile(true)}
        onMyLeave={() => navigate("/dashboard")}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
        {activeTab === "employees" && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard label="พนักงานทั้งหมด" value={`${employees.length} คน`} tone="slate" />
              <SummaryCard label="สิทธิ์วันลารวม" value={formatLeaveDays(balanceSummary.total)} tone="sky" />
              <SummaryCard label="ใช้ไปแล้ว" value={formatLeaveDays(balanceSummary.used)} tone="amber" />
              <SummaryCard label="คงเหลือใกล้หมด" value={`${balanceSummary.lowBalance} คน`} tone="red" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="ค้นหาชื่อ หรือรหัสพนักงาน..."
                    value={empSearch}
                    onChange={(event) => setEmpSearch(event.target.value)}
                  />
                </div>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={empDeptFilter}
                  onChange={(event) => setEmpDeptFilter(event.target.value)}
                >
                  <option value="all">ทุกแผนก</option>
                  {Array.from(new Set(employees.map((employee) => employee.department))).map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchEmployees}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  <RefreshIcon />
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">วันลาคงเหลือของพนักงาน</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    คลิกแถวเพื่อดูประวัติการลา หรือกดเพิ่มวันลาเพื่อแก้สิทธิ์รายปี
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{filteredEmployees.length} คน</span>
              </div>

              {empLoading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">ไม่พบข้อมูลพนักงาน</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-left">
                        {["พนักงาน", "สิทธิ์รวม", "ใช้ไปแล้ว", "คงเหลือ", "การใช้งาน", ""].map((heading) => (
                          <th
                            key={heading}
                            className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredEmployees.map((employee) => {
                        const pool = employee.pool;
                        const remaining = pool ? Math.max(0, pool.total_days - pool.used_days) : 0;
                        const pct = pool && pool.total_days > 0
                          ? Math.min(100, Math.round((pool.used_days / pool.total_days) * 100))
                          : 0;
                        const canEditBalance = canEditEmployeeBalance(user, employee, employeesById);

                        return (
                          <tr
                            key={employee.id}
                            className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                            onClick={() => handleEmployeeClick(employee)}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(employee.department)}`}
                                >
                                  {employee.full_name.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                    {employee.full_name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {employee.department} · {employee.employee_code}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {pool ? formatLeaveDays(pool.total_days) : "-"}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {pool ? formatLeaveUsage(pool.used_days, pool.used_day_units, pool.used_hours) : "-"}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${balanceColor(remaining)}`}>
                                {pool ? formatLeaveDays(remaining) : "-"}
                              </span>
                            </td>
                            <td className="px-5 py-4 min-w-[140px]">
                              {pool ? (
                                <div className="space-y-1.5">
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-gray-400">{pct}% ของสิทธิ์ที่ใช้แล้ว</p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">ยังไม่มีสิทธิ์วันลา</span>
                              )}
                            </td>
                            <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                              {canEditBalance && (
                                <button
                                  onClick={() =>
                                    openBalanceModal({
                                      id: employee.id,
                                      full_name: employee.full_name,
                                      employee_code: employee.employee_code,
                                      department: employee.department,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium whitespace-nowrap"
                                >
                                  <PlusIcon />
                                  เพิ่มวันลา
                                </button>
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
          </section>
        )}

        {activeTab === "history" && (
          <section className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "รออนุมัติ", value: pending, color: "text-amber-600", border: "border-amber-100", click: "pending" },
                { label: "อนุมัติแล้ว", value: approved, color: "text-emerald-600", border: "border-emerald-100", click: "approved" },
                { label: "ปฏิเสธ", value: rejected, color: "text-red-500", border: "border-red-100", click: "rejected" },
              ].map(({ label, value, color, border, click }) => (
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

            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="ค้นหาชื่อ หรือรหัสพนักงาน..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${statusFilter === status ? "bg-slate-800 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {status === "all" ? "ทั้งหมด" : STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">ดูตาม:</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {(["all", "yearly", "monthly"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {mode === "all" ? "ทั้งหมด" : mode === "yearly" ? "รายปี" : "รายเดือน"}
                    </button>
                  ))}
                </div>
                {viewMode !== "all" && (
                  <select
                    value={selYear}
                    onChange={(event) => setSelYear(Number(event.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none"
                  >
                    {Array.from({ length: 5 }, (_, index) => year - index).map((optionYear) => (
                      <option key={optionYear} value={optionYear}>
                        ปี {optionYear}
                      </option>
                    ))}
                  </select>
                )}
                {viewMode === "monthly" && (
                  <select
                    value={selMonth}
                    onChange={(event) => setSelMonth(Number(event.target.value))}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2000, month - 1, 1).toLocaleString("th-TH", { month: "long" })}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  ประวัติการลา <span className="ml-2 text-gray-400 font-normal">({filtered.length} รายการ)</span>
                </h2>
                <button
                  onClick={fetchRequests}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <RefreshIcon />
                  รีเฟรช
                </button>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">ไม่พบรายการลา</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-left">
                        {["พนักงาน", "ประเภท", "วันที่ / เวลา", "จำนวน", "เหตุผล", "สถานะ"].map((heading) => (
                          <th
                            key={heading}
                            className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((request) => {
                        const meta = STATUS_META[request.status];
                        const typeColor = TYPE_COLORS[request.leave_type_id] ?? "bg-gray-100 text-gray-600";
                        const isHourly = request.leave_unit === "hour";

                        return (
                          <tr
                            key={request.id}
                            className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                            onClick={() => setSelected(request)}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(request.user?.department)}`}
                                >
                                  {request.user?.full_name?.slice(0, 2) ?? "??"}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                    {request.user?.full_name}
                                  </p>
                                  <p className="text-xs text-gray-400">{request.user?.department}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${typeColor}`}>
                                  {request.leave_type.name}
                                </span>
                                {isHourly && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium w-fit">
                                    <ClockIcon />
                                    ลาชั่วโมง
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-800 whitespace-nowrap">{fmtDate(request.start_date)}</p>
                              {!isHourly && request.start_date !== request.end_date && (
                                <p className="text-xs text-gray-400">ถึง {fmtDate(request.end_date)}</p>
                              )}
                              {isHourly && request.start_time && (
                                <p className="text-xs text-gray-400">
                                  {request.start_time} - {request.end_time} น.
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {isHourly ? formatLeaveHours(request.total_hours) : formatLeaveDays(request.total_days)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-500 max-w-[180px] truncate">
                              {request.reason}
                            </td>
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
          </section>
        )}

        {activeTab === "reports" && (
          <AdminReportWidget
            requests={requests}
            employees={employees}
            currentUser={user}
            teamLoading={empLoading}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "slate" | "sky" | "amber" | "red";
}) {
  const toneClass = {
    slate: "bg-white border-gray-100 text-slate-800",
    sky: "bg-sky-50 border-sky-100 text-sky-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    red: "bg-red-50 border-red-100 text-red-700",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function balanceColor(remaining: number) {
  if (remaining <= 3) return "text-red-600";
  if (remaining <= 7) return "text-amber-600";
  return "text-emerald-600";
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
