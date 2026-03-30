// components/CreateUserModal.tsx
import { useState } from "react";
import type { UserRole } from "../services/superAdminService";
import { ROLE_META } from "./superAdminHelpers";

interface CreateUserModalProps {
  onSubmit: (data: {
    employee_code: string;
    full_name: string;
    department: string;
    password: string;
    role: UserRole;
  }) => void;
  onClose: () => void;
  loading: boolean;
}

export function CreateUserModal({ onSubmit, onClose, loading }: CreateUserModalProps) {
  const [form, setForm] = useState({
    employee_code: "",
    full_name: "",
    department: "",
    password: "",
    role: "user" as UserRole,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">สร้างผู้ใช้งานใหม่</h3>
            <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วน</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >×</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-[#000]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">รหัสพนักงาน *</label>
              <input className={INPUT} placeholder="EMP-0001" value={form.employee_code} onChange={(e) => set("employee_code", e.target.value)} />
            </div>
            <div className="text-[#000]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">ชื่อ-นามสกุล *</label>
              <input className={INPUT} placeholder="ชื่อ นามสกุล" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
          </div>
          <div className="text-[#000]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">แผนก</label>
            <input className={INPUT} placeholder="วิศวกรรมซอฟต์แวร์" value={form.department} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div className="text-[#000]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">รหัสผ่าน *</label>
            <input className={INPUT} type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>
          <div className="text-[#000]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Role *</label>
            <select className={INPUT} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {(["user", "hr", "admin", "super_admin"] as UserRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.employee_code || !form.full_name || !form.password}
            className="px-5 py-2.5 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง...
              </>
            ) : "สร้างผู้ใช้งาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
