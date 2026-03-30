// components/LogDrawer.tsx
import type { AuditLog, UserRole } from "../services/superAdminService";
import { ROLE_META, fmtDatetime, getActionMeta } from "./superAdminHelpers";
import { DiffViewer } from "./DiffViewer";

interface LogDrawerProps {
  log: AuditLog;
  onClose: () => void;
}

export function LogDrawer({ log, onClose }: LogDrawerProps) {
  const meta = getActionMeta(log.action);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">

        {/* Header */}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >×</button>
        </div>

        {/* Content */}
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
