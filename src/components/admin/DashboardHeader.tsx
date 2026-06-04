import type { AuthUser } from "../../services/authService";

export interface DashboardTab {
  key: string;
  label: string;
  badge?: number;
  icon?: "reports";
}

interface DashboardHeaderProps {
  user: AuthUser | null;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEditProfile: () => void;
  onMyLeave: () => void;
  onLogout: () => void;
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-4" />
    </svg>
  );
}

export function DashboardHeader({
  user,
  tabs,
  activeTab,
  onTabChange,
  onEditProfile,
  onMyLeave,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
          <PeopleIcon />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 capitalize">{user?.role} — ระบบการลา</h1>
          <p className="text-xs text-gray-400">Ckapsweet</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon === "reports" && <ReportsIcon />}
            {tab.label}
            {!!tab.badge && tab.badge > 0 && (
              <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onEditProfile}>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
            {user?.full_name?.slice(0, 2) || "??"}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={onMyLeave} className="text-xs text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors font-medium flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
          วันลาของฉัน
        </button>
        <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}
