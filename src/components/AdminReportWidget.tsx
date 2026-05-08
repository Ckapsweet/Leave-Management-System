import type { LeaveRequest } from "../services/leaveService";
import { leaveHoursToDays } from "../services/leaveTime";
import type { Employee, EmployeeWithBalance } from "./adminHelpers";

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLeaveDays(request: LeaveRequest) {
  if (request.leave_unit === "hour") return leaveHoursToDays(request.total_hours);
  return toNumber(request.total_days);
}

function formatDays(days: number) {
  return Number.isInteger(days) ? `${days} วัน` : `${days.toFixed(1)} วัน`;
}

function toDateOnly(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isDateInRange(date: Date, start: string, end: string) {
  const target = toDateOnly(date).getTime();
  const startAt = toDateOnly(start).getTime();
  const endAt = toDateOnly(end || start).getTime();
  return startAt <= target && target <= endAt;
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function employeeName(request: LeaveRequest) {
  return request.user?.full_name ?? `User #${request.user_id}`;
}

export function AdminReportWidget({
  requests,
  employees,
  teamEmployees,
  currentUser,
  teamLoading = false,
}: {
  requests: LeaveRequest[];
  employees: EmployeeWithBalance[];
  teamEmployees?: Employee[];
  currentUser?: Employee | null;
  teamLoading?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const today = toDateOnly(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 6);

  const totalEmployees = employees.length;
  const approvedRequests = requests.filter(
    (request) => request.status === "approved" && new Date(request.start_date).getFullYear() === currentYear
  );
  const pendingRequests = requests.filter(
    (request) => request.status === "pending" && new Date(request.start_date).getFullYear() === currentYear
  );
  const totalLeaveDaysUsed = approvedRequests.reduce((sum, request) => sum + getLeaveDays(request), 0);

  const urgentPending = [...pendingRequests]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);
  const overduePending = pendingRequests.filter((request) => {
    const createdAt = new Date(request.created_at).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt > 2 * 24 * 60 * 60 * 1000;
  }).length;

  const todayLeaves = approvedRequests.filter((request) => isDateInRange(today, request.start_date, request.end_date));
  const tomorrowLeaves = approvedRequests.filter((request) => isDateInRange(tomorrow, request.start_date, request.end_date));
  const weekLeaves = approvedRequests.filter((request) => {
    const startAt = toDateOnly(request.start_date).getTime();
    const endAt = toDateOnly(request.end_date || request.start_date).getTime();
    return startAt <= weekEnd.getTime() && endAt >= today.getTime();
  });

  const deptStats: Record<string, number> = {};
  employees.forEach((employee) => {
    const department = employee.department || "ไม่ระบุแผนก";
    deptStats[department] = (deptStats[department] ?? 0) + 1;
  });

  const teamSource = [
    ...(teamEmployees ?? []),
    ...employees,
    ...requests.flatMap((request) => (request.user ? [request.user] : [])),
    ...(currentUser ? [currentUser] : []),
  ].reduce<Employee[]>((acc, employee) => {
    if (!acc.some((item) => item.id === employee.id)) acc.push(employee);
    return acc;
  }, []);
  const employeeById = new Map(teamSource.map((employee) => [employee.id, employee]));
  const requestStatsByUserId = requests.reduce<Record<number, { pendingCount: number; totalRequests: number }>>(
    (acc, request) => {
      acc[request.user_id] = acc[request.user_id] ?? { pendingCount: 0, totalRequests: 0 };
      acc[request.user_id].totalRequests += 1;
      if (request.status === "pending") acc[request.user_id].pendingCount += 1;
      return acc;
    },
    {}
  );
  const teamStats = teamSource.reduce<
    Record<number, { leadName: string; members: Employee[]; pendingCount: number; totalRequests: number }>
  >((acc, employee) => {
    const supervisorId = employee.supervisor_id;
    if (!supervisorId) return acc;
    const lead = employeeById.get(supervisorId);
    const requestStat = requestStatsByUserId[employee.id] ?? { pendingCount: 0, totalRequests: 0 };
    if (!acc[supervisorId]) {
      acc[supervisorId] = {
        leadName: lead?.full_name ?? `หัวหน้า #${supervisorId}`,
        members: [],
        pendingCount: 0,
        totalRequests: 0,
      };
    }
    acc[supervisorId].members.push(employee);
    acc[supervisorId].pendingCount += requestStat.pendingCount;
    acc[supervisorId].totalRequests += requestStat.totalRequests;
    return acc;
  }, {});

  const lowBalanceEmployees = employees
    .flatMap((employee) =>
      (employee.pool?.balances ?? []).map((balance) => ({
        employee,
        balance,
        remaining: toNumber(balance.remaining),
      }))
    )
    .filter((item) => item.remaining <= 3)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 6);

  const typeStats: Record<string, number> = {};
  approvedRequests.forEach((request) => {
    const typeName = request.leave_type?.name ?? "ไม่ระบุประเภท";
    typeStats[typeName] = (typeStats[typeName] ?? 0) + getLeaveDays(request);
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">ภาพรวมทีม - ปี {currentYear}</h2>
        <p className="text-red-100 text-sm">สรุปอนุมัติและภาพรวมการลาของทีม</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">พนักงานในทีม</p>
          <div className="mt-2 text-3xl font-bold text-gray-800">{totalEmployees} <span className="text-base font-normal text-gray-500">คน</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">วันลาที่ใช้ไปปีนี้</p>
          <div className="mt-2 text-3xl font-bold text-sky-600">{formatDays(totalLeaveDaysUsed)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">รออนุมัติ</p>
          <div className="mt-2 text-3xl font-bold text-amber-500">{pendingRequests.length} <span className="text-base font-normal text-gray-500">รายการ</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">ค้างเกิน 2 วัน</p>
          <div className="mt-2 text-3xl font-bold text-red-500">{overduePending} <span className="text-base font-normal text-gray-500">รายการ</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">คำขอที่ต้องจัดการ</h3>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">{pendingRequests.length} pending</span>
          </div>
          {urgentPending.length > 0 ? (
            <ul className="space-y-3">
              {urgentPending.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{employeeName(request)}</p>
                    <p className="text-xs text-gray-400">{request.leave_type?.name ?? "-"} • {fmtDate(request.start_date)}</p>
                  </div>
                  <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                    {formatDays(getLeaveDays(request))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ไม่มีคำขอที่รออนุมัติ</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">คนลาวันนี้ / พรุ่งนี้ / สัปดาห์นี้</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-indigo-50 p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{todayLeaves.length}</p>
              <p className="text-xs text-indigo-700">วันนี้</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 text-center">
              <p className="text-2xl font-bold text-sky-600">{tomorrowLeaves.length}</p>
              <p className="text-xs text-sky-700">พรุ่งนี้</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{weekLeaves.length}</p>
              <p className="text-xs text-emerald-700">สัปดาห์นี้</p>
            </div>
          </div>
          {weekLeaves.length > 0 ? (
            <ul className="space-y-2">
              {weekLeaves.slice(0, 5).map((request) => (
                <li key={request.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{employeeName(request)}</span>
                  <span className="text-xs text-gray-400">{fmtDate(request.start_date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ไม่มีคนลาในช่วง 7 วันนี้</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">สรุปทีมตามหัวหน้า</h3>
          {teamLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(teamStats).length > 0 ? (
            <ul className="space-y-3">
              {Object.entries(teamStats).map(([leaderId, stat]) => (
                <li key={leaderId} className="text-sm border border-gray-100 rounded-xl p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                    <p className="font-medium text-gray-800">{stat.leadName}</p>
                    <p className="text-xs text-gray-400">{stat.members.length} คนในทีม • {stat.totalRequests} รายการทั้งหมด</p>
                    </div>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full whitespace-nowrap">{stat.pendingCount} รออนุมัติ</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stat.members
                      .sort((a, b) => a.full_name.localeCompare(b.full_name, "th"))
                      .map((member) => (
                        <span key={member.id} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                          {member.full_name}
                        </span>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่มีข้อมูลโครงสร้างทีม</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">พนักงานที่วันลาเหลือน้อย</h3>
          {lowBalanceEmployees.length > 0 ? (
            <ul className="space-y-3">
              {lowBalanceEmployees.map(({ employee, balance, remaining }) => (
                <li key={`${employee.id}-${balance.leave_type_id}`} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{employee.full_name}</p>
                    <p className="text-xs text-gray-400">{employee.employee_code} • {balance.name}</p>
                  </div>
                  <span className={`font-semibold px-3 py-1 rounded-full ${remaining <= 0 ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}>
                    {formatDays(remaining)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ไม่มีพนักงานที่วันลาเหลือน้อย</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-3">พนักงานจำแนกตามแผนก</h3>
          {Object.keys(deptStats).length > 0 ? (
            <ul className="space-y-3">
              {Object.entries(deptStats).map(([dept, count]) => (
                <li key={dept} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{dept}</span>
                  <span className="font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">{count} คน</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ไม่มีข้อมูลพนักงาน</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-3">วันลาที่ใช้ไปแยกตามประเภท</h3>
          {Object.keys(typeStats).length > 0 ? (
            <ul className="space-y-3">
              {Object.entries(typeStats).map(([type, days]) => (
                <li key={type} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{type}</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{formatDays(days)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่มีการใช้งานวันลา</p>
          )}
        </section>
      </div>
    </div>
  );
}
