// src/page/admin/CompanyOverviewDashboard.tsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#F06292'];

export default function CompanyOverviewDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get("/api/admin/reports/dashboard-stats");
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!data) return <div className="p-6 text-center text-red-500">ไม่สามารถโหลดข้อมูลได้</div>;

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">📊 รายงานภาพรวมองค์กร (Admin Dashboard)</h1>
                    <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                        ปี {new Date().getFullYear() + 543}
                    </span>
                </div>

                {/* --- 1. Summary Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center border-l-4 border-blue-500 hover:shadow-md transition">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
                            <PeopleIcon fontSize="large" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">พนักงานทั้งหมด</p>
                            <p className="text-2xl font-bold text-gray-800">{data.summary.total_users} <span className="text-sm font-normal">คน</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center border-l-4 border-green-500 hover:shadow-md transition">
                        <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
                            <EventBusyIcon fontSize="large" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">วันลาที่อนุมัติแล้ว (ปีนี้)</p>
                            <p className="text-2xl font-bold text-gray-800">{data.summary.total_approved_leave_days} <span className="text-sm font-normal">วัน</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center border-l-4 border-orange-500 hover:shadow-md transition">
                        <div className="p-3 bg-orange-100 rounded-full text-orange-600 mr-4">
                            <PendingActionsIcon fontSize="large" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">รออนุมัติการลา</p>
                            <p className="text-2xl font-bold text-gray-800">{data.summary.pending_leaves} <span className="text-sm font-normal">รายการ</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center border-l-4 border-purple-500 hover:shadow-md transition">
                        <div className="p-3 bg-purple-100 rounded-full text-purple-600 mr-4">
                            <AccessTimeIcon fontSize="large" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">รออนุมัติ OT</p>
                            <p className="text-2xl font-bold text-gray-800">{data.summary.pending_ots} <span className="text-sm font-normal">รายการ</span></p>
                        </div>
                    </div>
                </div>

                {/* --- 2. Charts Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Bar Chart: แนวโน้มการลา */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
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

                    {/* Pie Chart: สัดส่วนการลาตามแผนก */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
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

                {/* --- 3. Data Table --- */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-700">📑 รายละเอียดวันลาแยกตามแผนกและประเภทการลา</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-semibold border-b">แผนก</th>
                                    <th className="p-4 font-semibold border-b">ประเภทการลา</th>
                                    <th className="p-4 font-semibold border-b text-right">จำนวนวันลาทั้งหมดที่ใช้ไป (วัน)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.leaveTypeStats.length > 0 ? (
                                    data.leaveTypeStats.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="p-4 text-gray-800 font-medium">{row.department || 'ไม่ระบุแผนก'}</td>
                                            <td className="p-4 text-gray-600">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.leave_type.includes('ป่วย') ? 'bg-red-100 text-red-700' :
                                                        row.leave_type.includes('พักผ่อน') ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {row.leave_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-800 font-bold text-right">{parseFloat(row.total_leave_days.toString()).toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-500">
                                            ไม่มีประวัติการอนุมัติวันลาในปีนี้
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}