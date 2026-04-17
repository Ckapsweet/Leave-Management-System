// src/page/SystemSelectionPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, logout } from "../services/authService";
import type { AuthUser } from "../services/authService";


export default function SystemSelectionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล User เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
        // หากดึงข้อมูลไม่ได้ (Token หมดอายุ) ให้เด้งกลับไปหน้า Login
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // หน้าจอ Loading ระหว่างรอข้อมูลจาก API
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 text-lg">กำลังโหลดข้อมูลระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header Section */}
        <div className="bg-blue-600 p-6 flex flex-col sm:flex-row justify-between items-center text-white">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold">CKAP Leave & OT Management</h1>
            <p className="text-blue-100 mt-1">
              ยินดีต้อนรับ, <span className="font-semibold">{user?.full_name}</span> ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center border-b pb-4">
            กรุณาเลือกระบบที่ต้องการเข้าใช้งาน
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. ระบบจัดการของพนักงานทั่วไป (เข้าได้ทุกคน) */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex flex-col items-center justify-center p-8 bg-blue-50 border-2 border-blue-100 rounded-xl hover:border-blue-400 hover:bg-blue-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-blue-900">พื้นที่พนักงาน (My Dashboard)</h3>
              <p className="text-sm text-blue-700 text-center mt-2 leading-relaxed">
                ทำรายการขอลา, ขอ OT<br />และดูประวัติของตนเอง
              </p>
            </button>

            {/* 2. ระบบหัวหน้างาน (Lead) */}
            {user?.role === "lead" && (
              <button
                onClick={() => navigate("/lead")}
                className="flex flex-col items-center justify-center p-8 bg-emerald-50 border-2 border-emerald-100 rounded-xl hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-900">ระบบจัดการทีม (Lead)</h3>
                <p className="text-sm text-emerald-700 text-center mt-2 leading-relaxed">
                  ตรวจสอบและอนุมัติคำขอลา<br />และ OT ของลูกน้องในทีม
                </p>
              </button>
            )}

            {/* 3. ระบบผู้จัดการ (Manager / Assistant Manager) */}
            {(user?.role === "manager" || user?.role === "assistant manager") && (
              <button
                onClick={() => navigate("/manager")}
                className="flex flex-col items-center justify-center p-8 bg-purple-50 border-2 border-purple-100 rounded-xl hover:border-purple-400 hover:bg-purple-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-purple-900">ระบบบริหาร (Manager)</h3>
                <p className="text-sm text-purple-700 text-center mt-2 leading-relaxed">
                  จัดการสิทธิ์พนักงาน, ดูประวัติ Audit<br />และอนุมัติระดับแผนก
                </p>
              </button>
            )}

            {/* 4. ระบบรายงานภาพรวม (Admin Only) */}
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin-reports")}
                className="flex flex-col items-center justify-center p-8 bg-orange-50 border-2 border-orange-100 rounded-xl hover:border-orange-400 hover:bg-orange-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-orange-900">ระบบรายงานองค์กร (Admin)</h3>
                <p className="text-sm text-orange-700 text-center mt-2 leading-relaxed">
                  ดู Dashboard ภาพรวมการลา<br />และดึง Report ทั้งบริษัท
                </p>
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}