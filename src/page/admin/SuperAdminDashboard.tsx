// pages/admin/SuperAdminDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import {
  getAuditLogs, getAuditActions, getSuperAdminUsers,
  changeUserRole, changeUserSupervisor, deleteUser, createUser,
} from "../../services/superAdminService";
import type { AuditLog, SuperAdminUser, UserRole } from "../../services/superAdminService";
import { ToastContainer, toast } from "../../components/Toast";
import { LogDrawer } from "../../components/LogDrawer";
import { CreateUserModal } from "../../components/CreateUserModal";
import { EditProfileModal } from "../../components/EditProfileModal";
import type { AuthUser } from "../../services/authService";
import { ROLE_META, fmtDatetime, getActionMeta } from "../../components/superAdminHelpers";
import Footer from "../../components/Footer";

// ── Type badge helpers ─────────────────────────────────────────────────────

const LEAVE_TYPE_META: Record<string, { cls: string; label: string }> = {
  annual: { cls: "bg-blue-950/50 border border-blue-800 text-blue-300", label: "ลาพักร้อน" },
  sick: { cls: "bg-purple-950/50 border border-purple-800 text-purple-300", label: "ลาป่วย" },
  personal: { cls: "bg-teal-950/50 border border-teal-800 text-teal-300", label: "ลากิจ" },
  maternity: { cls: "bg-pink-950/50 border border-pink-800 text-pink-300", label: "ลาคลอด" },
};

function TypeBadge({ log }: { log: AuditLog }) {
  const after = log.after_data as any;
  const before = log.before_data as any;

  // กรณีเป็น action เกี่ยวกับ user
  if (log.target_type === "user" || log.action?.includes("user")) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/40 border border-blue-800 text-blue-300">
        สร้าง user
      </span>
    );
  }
  // กรณีเป็น leave_request — ดึงประเภทจาก before_data / after_data ถ้ามี
  const leaveType = after?.leave_type ?? before?.leave_type ?? "";
  const meta = LEAVE_TYPE_META[leaveType];
  if (meta) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
        {meta.label}
      </span>
    );
  }
  // fallback — แสดง target_type เปล่า
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400">
      {log.target_type ?? "—"}
    </span>
  );
}

// ── Target person cell ────────────────────────────────────────────────────

function TargetCell({ log }: { log: AuditLog }) {
  const after = log.after_data as any;
  const before = log.before_data as any;

  // ชื่อและรหัสของ "คนที่ถูกกระทำ" เช่น คนที่ขอลา หรือ user ที่ถูกสร้าง
  const targetName: string =
    after?.full_name ??
    before?.full_name ??
    after?.user?.full_name ??
    before?.user?.full_name ??
    after?.employee_code ??
    before?.employee_code ??
    after?.user?.employee_code ??
    before?.user?.employee_code ??
    log.target_type ?? "—";

  const initials = targetName.slice(0, 2);
  const subLabel = log.target_type
    ? `${log.target_type} #${log.target_id}`
    : "—";

  if (!log.target_type) {
    return <span className="text-slate-600 text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-emerald-950 flex items-center justify-center text-xs font-bold text-emerald-300 flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-200 whitespace-nowrap">{targetName}</p>
        <p className="text-xs text-slate-500 font-mono">{subLabel}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"logs" | "users">("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterActorId, setFilterActorId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const adminName = user?.full_name ?? "Super Admin";

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({
        action: filterAction || undefined,
        actor_id: filterActorId ? Number(filterActorId) : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        page,
        limit: 30,
      });
      setLogs(res.data);
      setPagination({ total: res.pagination.total, totalPages: res.pagination.totalPages });
    } catch (err: any) {
      setError(err.response?.data?.message || "โหลด log ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterActorId, filterDateFrom, filterDateTo, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    getAuditActions().then(setActions).catch(() => { });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSuperAdminUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
      });
      setUsers(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "โหลดข้อมูลพนักงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleRoleChange = async (id: number, role: UserRole) => {
    try {
      setActionLoading(true);
      await changeUserRole(id, role);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
      toast.success("เปลี่ยน role เรียบร้อย");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เปลี่ยน role ไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupervisorChange = async (id: number, supervisor_id: number | null) => {
    try {
      setActionLoading(true);
      await changeUserSupervisor(id, supervisor_id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, supervisor_id } : u));
      toast.success("เปลี่ยนหัวหน้าเรียบร้อย");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "เปลี่ยนหัวหน้าไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`ยืนยันลบผู้ใช้งาน "${name}"?`)) return;
    try {
      setActionLoading(true);
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("ลบผู้ใช้งานเรียบร้อย");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "ลบไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (data: Parameters<typeof createUser>[0]) => {
    try {
      setActionLoading(true);
      const newUser = await createUser(data);
      setUsers((prev) => [...prev, newUser]);
      setShowCreate(false);
      toast.success(`สร้างผู้ใช้งาน ${data.employee_code} เรียบร้อย`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "สร้างผู้ใช้งานไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  const userStats = {
    total: users.length,
    managers: users.filter((u) => u.role === "manager").length,
    hr: users.filter((u) => u.role === "hr").length,
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-3">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchLogs} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm">ลองใหม่</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Mono', 'DM Sans', 'Noto Sans Thai', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <ToastContainer />

      {selectedLog && <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      {showCreate && <CreateUserModal onSubmit={handleCreateUser} onClose={() => setShowCreate(false)} loading={actionLoading} />}
      {showEditProfile && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onUpdateUser={(updated) => {
            setUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
          }}
        />
      )}

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">HR</h1>
            <p className="text-xs text-slate-500">Human Resources</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
          {([
            { key: "logs", label: "Audit Logs", icon: "📋" },
            { key: "users", label: "จัดการ Users", icon: "👥" },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === key ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowEditProfile(true)}>
            <div className="w-8 h-8 rounded-full bg-rose-900 flex items-center justify-center text-xs font-bold text-rose-300">
              {adminName.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{adminName}</p>
              <p className="text-xs text-rose-400">super_admin</p>
            </div>
          </div>
          <button onClick={() => navigate("/select-system")} className="text-xs text-slate-400 hover:text-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 3h5v5M8 21H3v-5M21 3L12 12M3 21l9-9" /></svg>
            สลับระบบ
          </button>
          <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Audit Logs Tab ───────────────────────────────────────────────── */}
        {activeTab === "logs" && (
          <div className="space-y-5">

            {/* Filters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                  className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[160px]"
                >
                  <option value="">ทุก action</option>
                  {actions.map((a) => (
                    <option key={a} value={a}>{getActionMeta(a).label} ({a})</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="actor_id..."
                  value={filterActorId}
                  onChange={(e) => { setFilterActorId(e.target.value); setPage(1); }}
                  className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 w-32"
                />

                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                  className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-slate-500 self-center text-xs">ถึง</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                  className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <button
                  onClick={() => { setFilterAction(""); setFilterActorId(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
                  className="px-3 py-2 text-xs text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-800"
                >
                  ล้างตัวกรอง
                </button>

                <button onClick={fetchLogs} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 border border-slate-700 rounded-xl hover:bg-slate-800">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
                  </svg>
                  รีเฟรช
                </button>
              </div>
              <p className="text-xs text-slate-500">
                พบ <span className="text-rose-400 font-mono font-semibold">{pagination.total}</span> รายการ
              </p>
            </div>

            {/* Log table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">ไม่พบ log</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        {[
                          "เวลา",
                          "Action",
                          "ผู้ที่ลา / เป้าหมาย",
                          "ผู้รับทราบ (actor)",
                          "ประเภท",
                          "หมายเหตุ",
                          "",
                        ].map((h) => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {logs.map((log) => {
                        const meta = getActionMeta(log.action);
                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedLog(log)}
                          >
                            {/* เวลา */}
                            <td className="px-5 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                              {fmtDatetime(log.created_at)}
                            </td>

                            {/* Action badge */}
                            <td className="px-5 py-3">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </div>
                            </td>

                            {/* ผู้ที่ลา / เป้าหมาย — NEW */}
                            <td className="px-5 py-3">
                              <TargetCell log={log} />
                            </td>

                            {/* ผู้รับทราบ (actor) — เดิมคือ "ผู้กระทำ" */}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                                  {log.actor_name?.slice(0, 2) ?? "??"}
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-slate-200 whitespace-nowrap">{log.actor_name}</p>
                                  <p className="text-xs text-slate-500">{log.actor_code}</p>
                                </div>
                              </div>
                            </td>

                            {/* ประเภท — NEW */}
                            <td className="px-5 py-3">
                              <TypeBadge log={log} />
                            </td>

                            {/* หมายเหตุ */}
                            <td className="px-5 py-3 text-xs text-slate-400 max-w-[180px] truncate">
                              {log.note ?? <span className="text-slate-600">—</span>}
                            </td>

                            {/* diff */}
                            <td className="px-5 py-3">
                              {(log.before_data || log.after_data) && (
                                <span className="text-xs text-amber-500 border border-amber-800 bg-amber-950/50 px-2 py-0.5 rounded-full">
                                  diff
                                </span>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-slate-500">หน้า {page} / {pagination.totalPages}</p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 disabled:opacity-30"
                  >← ก่อนหน้า</button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs border border-slate-700 text-slate-400 rounded-xl hover:bg-slate-800 disabled:opacity-30"
                  >ถัดไป →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ─────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-5">

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "ผู้ใช้ทั้งหมด", value: userStats.total, color: "text-slate-200" },
                { label: "Manager", value: userStats.managers, color: "text-violet-400" },
                { label: "HR", value: userStats.hr, color: "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-wrap gap-3 items-center">
              <input
                placeholder="ค้นหาชื่อ / รหัสพนักงาน..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 flex-1 min-w-[200px]"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">ทุก role</option>
                {(["user", "lead", "manager", "hr"] as UserRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl transition-colors ml-auto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                สร้างผู้ใช้งาน
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        {["พนักงาน", "แผนก", "Role", "หัวหน้า", "สร้างเมื่อ", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                                {u.full_name?.slice(0, 2) ?? "??"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">{u.full_name}</p>
                                <p className="text-xs text-slate-500 font-mono">{u.employee_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400">
                            {u.department ?? <span className="text-slate-600">ไม่ระบุ</span>}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              disabled={actionLoading}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 ${ROLE_META[u.role]?.color ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {(["user", "lead", "manager", "hr"] as UserRole[]).map((r) => (
                                <option key={r} value={r}>{ROLE_META[r].label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={u.supervisor_id ?? ""}
                              onChange={(e) => handleSupervisorChange(u.id, e.target.value ? Number(e.target.value) : null)}
                              disabled={actionLoading}
                              className="bg-slate-800 border-0 rounded-lg px-2 py-1 text-xs text-slate-300 focus:ring-2 focus:ring-rose-500"
                            >
                              <option value="">— ไม่มีหัวหน้า —</option>
                              {users
                                .filter((s) => s.id !== u.id && (s.role === "lead" || s.role === "manager"))
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.full_name} ({ROLE_META[s.role]?.label})
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              disabled={actionLoading}
                              className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors disabled:opacity-30"
                              title="ลบผู้ใช้งาน"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}