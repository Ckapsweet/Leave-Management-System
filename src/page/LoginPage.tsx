// pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const { user } = await login(employeeCode, password);

      // เก็บ role + user info ใน localStorage
      localStorage.setItem("role", user.role);
      localStorage.setItem("user", JSON.stringify({
        full_name:     user.full_name,
        employee_code: user.employee_code,
        department:    user.department,
      }));
      if (user.role === "admin") {
        localStorage.setItem("adminName", user.full_name);
      }

      const roleToPath: Record<string, string> = {
        super_admin: "/super-admin",
        admin:       "/admin",
      };
      navigate(roleToPath[user.role] ?? "/dashboard", { replace: true });

    } catch (err: any) {
      setError(err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <p className="text-xl font-bold text-center mb-2">ระบบลาออนไลน์</p>
        <p className="text-sm text-gray-500 text-center mb-6">เข้าสู่ระบบ</p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text"
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="รหัสพนักงาน (เช่น EMP-0001)"
            value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} required />
          <input type="password"
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="รหัสผ่าน"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}