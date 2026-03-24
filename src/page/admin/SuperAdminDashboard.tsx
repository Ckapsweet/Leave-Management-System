// pages/admin/SuperAdminDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import {
  getAuditLogs, getAuditActions, getSuperAdminUsers,
  changeUserRole, deleteUser, createUser,
} from "../../services/superAdminService";
import type { AuditLog, SuperAdminUser, UserRole } from "../../services/superAdminService";
import { ToastContainer, toast } from "../../components/Toast";

// ── Constants ─────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  "leave.approve":    { label: "อนุมัติลา",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "✓" },
  "leave.reject":     { label: "ปฏิเสธลา",        color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: "✗" },
  "leave.create":     { label: "ยื่นคำขอลา",      color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: "+" },
  "leave.cancel":     { label: "ยกเลิกคำขอ",      color: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   icon: "×" },
  "balance.update":   { label: "แก้ไขวันลา",      color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   icon: "✎" },
  "user.create":      { label: "สร้าง user",       color: "text-teal-700",    bg: "bg-teal-50 border-teal-200",       icon: "👤" },
  "user.delete":      { label: "ลบ user",          color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: "🗑" },
  "user.role_change": { label: "เปลี่ยน role",     color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: "⚑" },
  "auth.login":       { label: "เข้าสู่ระบบ",     color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",     icon: "→" },
  "auth.logout":      { label: "ออกจากระบบ",      color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",     icon: "←" },
  "auth.login_failed":{ label: "Login ล้มเหลว",   color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: "!" },
};

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-rose-100 text-rose-700" },
  admin:       { label: "Admin",       color: "bg-violet-100 text-violet-700" },
  hr:          { label: "HR",          color: "bg-blue-100 text-blue-700" },
  user:        { label: "User",        color: "bg-gray-100 text-gray-600" },
};

// ── Helpers ───────────────────────────────────────────────────

function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function getActionMeta(action: string) {
  return ACTION_META[action] ?? {
    label: action, color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: "•",
  };
}

// ── DiffViewer ────────────────────────────────────────────────

function DiffViewer({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (keys.length === 0) return <p className="text-xs text-gray-400 italic">ไม่มีข้อมูล</p>;
  return (
    <div className="space-y-1">
      {keys.map((k) => {
        const b = before?.[k];
        const a = after?.[k];
        const changed = JSON.stringify(b) !== JSON.stringify(a);
        return (
          <div key={k} className={`flex items-start gap-2 text-xs rounded-lg px-2 py-1 ${changed ? "bg-amber-50" : "bg-gray-50"}`}>
            <span className="text-gray-400 w-28 flex-shrink-0 font-mono">{k}</span>
            {changed ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {b !== undefined && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded line-through font-mono">{String(b ?? "null")}</span>}
                <span className="text-gray-400">→</span>
                {a !== undefined && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono">{String(a ?? "null")}</span>}
              </div>
            ) : (
              <span className="text-gray-600 font-mono">{String(a ?? b ?? "null")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── LogDrawer ─────────────────────────────────────────────────

function LogDrawer({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const meta = getActionMeta(log.action);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border ${meta.bg}`}>
              {meta.icon}
            </div>
            <div>
              <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
              <p className="text-xs text-gray-400 font-mono">#{log.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Actor */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ผู้กระทำ</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">
                {log.actor_name?.slice(0, 2) ?? "??"}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{log.actor_name}</p>
                <p className="text-xs text-gray-500">{log.actor_code} · {log.actor_dept ?? "ไม่ระบุแผนก"}</p>
              </div>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_META[log.actor_role as UserRole]?.color ?? "bg-gray-100 text-gray-600"}`}>
                {ROLE_META[log.actor_role as UserRole]?.label ?? log.actor_role}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">เวลา</span>
              <span className="font-medium text-gray-800 text-xs">{fmtDatetime(log.created_at)}</span>
            </div>
            {log.target_type && (
              <div className="flex justify-between">
                <span className="text-gray-500">เป้าหมาย</span>
                <span className="font-mono text-xs text-gray-700">{log.target_type} #{log.target_id}</span>
              </div>
            )}
            {log.ip_address && (
              <div className="flex justify-between">
                <span className="text-gray-500">IP</span>
                <span className="font-mono text-xs text-gray-700">{log.ip_address}</span>
              </div>
            )}
          </div>

          {/* Note */}
          {log.note && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">หมายเหตุ</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800 leading-relaxed">"{log.note}"</p>
              </div>
            </div>
          )}

          {/* Diff */}
          {(log.before_data || log.after_data) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">การเปลี่ยนแปลง</p>
              <DiffViewer before={log.before_data} after={log.after_data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CreateUserModal ───────────────────────────────────────────

function CreateUserModal({ onSubmit, onClose, loading }: {
  onSubmit: (data: { employee_code: string; full_name: string; department: string; password: string; role: UserRole }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ employee_code: "", full_name: "", department: "", password: "", role: "user" as UserRole });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">สร้างผู้ใช้งานใหม่</h3>
            <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วน</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-[#000]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">รหัสพนักงาน *</label>
              <input className={INPUT} placeholder="EMP-0001" value={form.employee_code} onChange={(e) => set("employee_code", e.target.value)} />
            </div>
            <div className="text-[#000]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">ชื่อ-นามสกุล *</label>
              <input className={INPUT} placeholder="ชื่อ นามสกุล" value={form.full_name} onChange={(e) => set("full_name", e.target.value)}/>
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
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">ยกเลิก</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.employee_code || !form.full_name || !form.password}
            className="px-5 py-2.5 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />กำลังสร้าง...</> : "สร้างผู้ใช้งาน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [activeTab,    setActiveTab]    = useState<"logs" | "users">("logs");
  const [logs,         setLogs]         = useState<AuditLog[]>([]);
  const [users,        setUsers]        = useState<SuperAdminUser[]>([]);
  const [actions,      setActions]      = useState<string[]>([]);
  const [selectedLog,  setSelectedLog]  = useState<AuditLog | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [error,        setError]        = useState("");

  // filters — logs
  const [filterAction,   setFilterAction]   = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo,   setFilterDateTo]   = useState("");
  const [filterActorId,  setFilterActorId]  = useState("");
  const [page,           setPage]           = useState(1);
  const [pagination,     setPagination]     = useState({ total: 0, totalPages: 1 });

  // filters — users
  const [userSearch,    setUserSearch]    = useState("");
  const [userRoleFilter,setUserRoleFilter]= useState("");

  const adminName = localStorage.getItem("adminName") ?? "Super Admin";

  // ── Fetch logs ──────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({
        action:    filterAction   || undefined,
        actor_id:  filterActorId  ? Number(filterActorId) : undefined,
        date_from: filterDateFrom || undefined,
        date_to:   filterDateTo   || undefined,
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

  // ── Fetch actions dropdown ──────────────────────────────────
  useEffect(() => {
    getAuditActions().then(setActions).catch(() => {});
  }, []);

  // ── Fetch users ─────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSuperAdminUsers({
        search: userSearch || undefined,
        role:   userRoleFilter || undefined,
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

  // ── Actions ─────────────────────────────────────────────────
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

  // ── Derived ─────────────────────────────────────────────────
  const userStats = {
    total:       users.length,
    admins:      users.filter((u) => u.role === "admin").length,
    superAdmins: users.filter((u) => u.role === "super_admin").length,
  };

  // ── Loading / Error ──────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-3">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchLogs} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm">ลองใหม่</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'DM Mono', 'DM Sans', 'Noto Sans Thai', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <ToastContainer />

      {selectedLog && <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      {showCreate  && <CreateUserModal onSubmit={handleCreateUser} onClose={() => setShowCreate(false)} loading={actionLoading} />}

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Super Admin</h1>
            <p className="text-xs text-slate-500">Audit & Access Control</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
          {([
            { key: "logs",  label: "Audit Logs", icon: "📋" },
            { key: "users", label: "จัดการ Users", icon: "👥" },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === key
                  ? "bg-rose-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-900 flex items-center justify-center text-xs font-bold text-rose-300">
              {adminName.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{adminName}</p>
              <p className="text-xs text-rose-400">super_admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800">
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Audit Logs Tab ───────────────────────────────────── */}
        {activeTab === "logs" && (
          <div className="space-y-5">

            {/* Filters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                {/* Action filter */}
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

                {/* Actor filter */}
                <input
                  type="number"
                  placeholder="actor_id..."
                  value={filterActorId}
                  onChange={(e) => { setFilterActorId(e.target.value); setPage(1); }}
                  className="border border-slate-700 bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 w-32"
                />

                {/* Date range */}
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
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
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
                        {["เวลา", "Action", "ผู้กระทำ", "เป้าหมาย", "หมายเหตุ", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {logs.map((log) => {
                        const meta = getActionMeta(log.action);
                        return (
                          <tr key={log.id} className="hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setSelectedLog(log)}>
                            <td className="px-5 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                              {fmtDatetime(log.created_at)}
                            </td>
                            <td className="px-5 py-3">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </div>
                            </td>
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
                            <td className="px-5 py-3">
                              {log.target_type ? (
                                <span className="text-xs font-mono text-slate-400">
                                  {log.target_type} <span className="text-rose-400">#{log.target_id}</span>
                                </span>
                              ) : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-400 max-w-[180px] truncate">
                              {log.note ?? <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              {(log.before_data || log.after_data) && (
                                <span className="text-xs text-amber-500 border border-amber-800 bg-amber-950/50 px-2 py-0.5 rounded-full">diff</span>
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

        {/* ── Users Tab ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "ผู้ใช้ทั้งหมด", value: userStats.total,       color: "text-slate-200" },
                { label: "Admin",          value: userStats.admins,      color: "text-violet-400" },
                { label: "Super Admin",    value: userStats.superAdmins, color: "text-rose-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                  <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Filters + Create */}
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
                {(["user","hr","admin","super_admin"] as UserRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl transition-colors ml-auto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                สร้างผู้ใช้งาน
              </button>
            </div>

            {/* Users table */}
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
                        {["พนักงาน", "แผนก", "Role", "สร้างเมื่อ", ""].map((h) => (
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
                          <td className="px-5 py-4 text-xs text-slate-400">{u.department ?? <span className="text-slate-600">ไม่ระบุ</span>}</td>
                          <td className="px-5 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              disabled={actionLoading}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 ${ROLE_META[u.role]?.color ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {(["user","hr","admin","super_admin"] as UserRole[]).map((r) => (
                                <option key={r} value={r}>{ROLE_META[r].label}</option>
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
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
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
    </div>
  );
}