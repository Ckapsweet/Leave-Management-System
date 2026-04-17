import React from "react";
import type { LeaveRequest } from "../services/leaveService";
import type { EmployeeWithBalance } from "./adminHelpers";

export function AdminReportWidget({
  requests,
  employees,
}: {
  requests: LeaveRequest[];
  employees: EmployeeWithBalance[];
}) {
  const currentYear = new Date().getFullYear();

  // คำนวณสรุปสถิติต่างๆ
  const totalEmployees = employees.length;

  const approvedRequests = requests.filter(r => r.status === "approved" && new Date(r.start_date).getFullYear() === currentYear);
  const pendingRequests = requests.filter(r => r.status === "pending" && new Date(r.start_date).getFullYear() === currentYear);
  const rejectedRequests = requests.filter(r => r.status === "rejected" && new Date(r.start_date).getFullYear() === currentYear);

  let totalLeaveDaysUsed = 0;
  approvedRequests.forEach(r => {
    totalLeaveDaysUsed += r.leave_unit === "day" ? r.total_days : ((r.total_hours || 0) / 8);
  });

  // แยกตามแผนก (อิงจาก employee)
  const deptStats: Record<string, number> = {};
  employees.forEach(emp => {
    if (!deptStats[emp.department]) deptStats[emp.department] = 0;
    deptStats[emp.department] += 1;
  });

  // ลาแยกตามประเภท
  const typeStats: Record<string, number> = {};
  approvedRequests.forEach(r => {
    const tName = r.leave_type.name;
    if (!typeStats[tName]) typeStats[tName] = 0;
    typeStats[tName] += r.leave_unit === "day" ? r.total_days : ((r.total_hours || 0) / 8);
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">ภาพรวมระบบ (Report System) - ปี {currentYear}</h2>
        <p className="text-red-100 text-sm">ข้อมูลสรุปการลาของพนักงานทั้งหมดในบริษัท</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-gray-500 text-sm font-medium">พนักงานทั้งหมด</p>
          <div className="mt-2 text-3xl font-bold text-gray-800">{totalEmployees} <span className="text-base font-normal text-gray-500">คน</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-gray-500 text-sm font-medium">จำนวนวันลาที่ใช้ไป (ปีนี้)</p>
          <div className="mt-2 text-3xl font-bold text-sky-600">{totalLeaveDaysUsed.toFixed(1)} <span className="text-base font-normal text-gray-500">วัน</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-gray-500 text-sm font-medium">รออนุมัติ</p>
          <div className="mt-2 text-3xl font-bold text-amber-500">{pendingRequests.length} <span className="text-base font-normal text-gray-500">รายการ</span></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-gray-500 text-sm font-medium">ปฏิเสธแล้ว</p>
          <div className="mt-2 text-3xl font-bold text-red-500">{rejectedRequests.length} <span className="text-base font-normal text-gray-500">รายการ</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">พนักงานจำแนกตามแผนก</h3>
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
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">วันลาที่ใช้ไปแยกตามประเภท (อนุมัติแล้ว)</h3>
          {Object.keys(typeStats).length > 0 ? (
            <ul className="space-y-3">
              {Object.entries(typeStats).map(([type, days]) => (
                <li key={type} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{type}</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{days.toFixed(1)} วัน</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">ยังไม่มีการใช้งานวันลา</p>
          )}
        </div>
      </div>
    </div>
  );
}
