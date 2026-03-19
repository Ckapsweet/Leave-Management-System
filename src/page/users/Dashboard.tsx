import { useEffect, useState } from "react";

interface Leave {
  id: number;
  type: string;
  date_from: string;
  date_to: string;
  status: "pending" | "approved" | "rejected";
}

export default function Dashboard() {
  const [leaves, setLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    // mock data (แทน API)
    setLeaves([
      { id: 1, type: "ลาป่วย", date_from: "2026-03-10", date_to: "2026-03-11", status: "approved" },
      { id: 2, type: "ลากิจ", date_from: "2026-03-15", date_to: "2026-03-15", status: "pending" },
      { id: 3, type: "ลาพักร้อน", date_from: "2026-03-20", date_to: "2026-03-22", status: "rejected" },
    ]);
  }, []);

  const summary = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Dashboard แจ้งลา</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card title="ทั้งหมด" value={summary.total} color="bg-blue-500" />
        <Card title="รออนุมัติ" value={summary.pending} color="bg-yellow-500" />
        <Card title="อนุมัติแล้ว" value={summary.approved} color="bg-green-500" />
        <Card title="ไม่อนุมัติ" value={summary.rejected} color="bg-red-500" />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
          + ยื่นใบลา
        </button>
        <button className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow">
          ดูประวัติ
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">รายการล่าสุด</h2>

        <table className="w-full text-center">
          <thead>
            <tr className="border-b">
              <th>ประเภท</th>
              <th>วันที่เริ่ม</th>
              <th>วันที่สิ้นสุด</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id} className="border-b">
                <td className="p-3">{leave.type}</td>
                <td>{leave.date_from}</td>
                <td>{leave.date_to}</td>
                <td>
                  <StatusBadge status={leave.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Card Component */
function Card({ title, value, color }: any) {
  return (
    <div className={`text-white p-4 rounded-xl shadow ${color}`}>
      <p className="text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

/* Status Badge */
function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-200 text-yellow-800",
    approved: "bg-green-200 text-green-800",
    rejected: "bg-red-200 text-red-800",
  };

  const text = {
    pending: "รออนุมัติ",
    approved: "อนุมัติแล้ว",
    rejected: "ไม่อนุมัติ",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${styles[status as keyof typeof styles]}`}>
      {text[status as keyof typeof text]}
    </span>
  );
}