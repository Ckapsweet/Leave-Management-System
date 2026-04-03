import React, { useState } from "react";
import { updateProfile, changePassword } from "../services/authService";
import type { AuthUser } from "../services/authService";
import { toast } from "./Toast";

interface EditProfileModalProps {
  user: AuthUser;
  onClose: () => void;
  onUpdateUser: (updatedUser: AuthUser) => void;
}

export function EditProfileModal({ user, onClose, onUpdateUser }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("กรุณาระบุชื่อ-นามสกุล");
    setLoading(true);
    try {
      const updated = await updateProfile({ full_name: fullName });
      onUpdateUser(updated);
      toast.success("อัปเดตข้อมูลส่วนตัวเรียบร้อย");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "อัปเดตข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
    }
    setLoading(true);
    try {
      const res = await changePassword({ old_password: currentPassword, new_password: newPassword });
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">แก้ไขข้อมูลส่วนตัว</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex p-1 bg-gray-100 mx-6 mt-6 rounded-xl">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "info" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>

        <div className="p-6">
          {activeTab === "info" ? (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1">ชื่อ-นามสกุล</label>
                <div className="relative text-gray-400 focus-within:text-indigo-500">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <input
                    autoFocus
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ระบุชื่อ-นามสกุล"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || fullName === user.full_name}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
                >
                  {loading ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
