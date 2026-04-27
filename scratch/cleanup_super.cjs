const fs = require('fs');
const file = 'src/page/admin/SuperAdminDashboard.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find the "users tab admin-only" guard line
const guardIdx = lines.findIndex(l => l.includes('Users Tab \u2013 admin only'));
// Find the NEXT "── Users Tab (Manage Roles)" or old guard
const oldTabIdx = lines.findIndex((l, i) => i > guardIdx && l.includes('Users Tab (Manage Roles)'));

if (guardIdx === -1) {
    console.log("Guard not found"); process.exit(1);
}

// Lines 855 onwards (0-indexed = 854) start with the broken fragment.
// We need to remove from line after the guard until the old "Users Tab (Manage Roles)" comment.
// Replace lines from guardIdx+1 to oldTabIdx-1 with the proper div content for Users tab
const usersTabContent = `          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="\u0e04\u0e49\u0e19\u0e2b\u0e32\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19..." value={saSearch}
                    onChange={(e) => setSaSearch(e.target.value)} />
                </div>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={saRoleFilter} onChange={(e) => setSaRoleFilter(e.target.value)}>
                  <option value="all">\u0e17\u0e38\u0e01\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c</option>
                  <option value="user">User</option>
                  <option value="lead">Lead</option>
                  <option value="assistant manager">Assistant Manager</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
                <button onClick={fetchSaUsers} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                  \u0e23\u0e35\u0e40\u0e1f\u0e23\u0e0a
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19</h2>
              </div>
              {saUsersLoading ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  \u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400">\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400">\u0e41\u0e1c\u0e19\u0e01</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400">\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e01\u0e32\u0e23\u0e43\u0e0a\u0e49\u0e07\u0e32\u0e19 (Role)</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">\u0e08\u0e31\u0e14\u0e01\u0e32\u0e23</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {saUsers.filter(u =>
                        (saRoleFilter === "all" || u.role === saRoleFilter) &&
                        (!saSearch || u.full_name.includes(saSearch) || u.employee_code.includes(saSearch))
                      ).length === 0 ? (
                        <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19</td></tr>
                      ) : saUsers.filter(u =>
                        (saRoleFilter === "all" || u.role === saRoleFilter) &&
                        (!saSearch || u.full_name.includes(saSearch) || u.employee_code.includes(saSearch))
                      ).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{u.full_name}</p>
                            <p className="text-xs text-gray-400">{u.employee_code}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{u.department || "-"}</td>
                          <td className="px-5 py-4">
                            {editingRole?.id === u.id ? (
                              <select
                                className="border border-indigo-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={editingRole.role}
                                onChange={(e) => setEditingRole({ id: u.id, role: e.target.value as UserRole })}
                              >
                                {(["user", "lead", "assistant manager", "manager", "hr"] as UserRole[]).map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={\`px-2.5 py-1 rounded-full text-xs font-medium w-fit \${u.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                                u.role === 'assistant manager' ? 'bg-blue-100 text-blue-700' :
                                  u.role === 'lead' ? 'bg-emerald-100 text-emerald-700' :
                                    u.role === 'hr' ? 'bg-fuchsia-100 text-fuchsia-700' :
                                      'bg-gray-100 text-gray-600'
                              }\`}>{u.role}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {user?.id !== u.id && (
                              editingRole?.id === u.id ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleSaveRole(u.id, editingRole.role)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01</button>
                                  <button onClick={() => setEditingRole(null)} className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium">\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01</button>
                                </div>
                              ) : (
                                <button onClick={() => setEditingRole({ id: u.id, role: u.role })} className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium whitespace-nowrap">\u0e41\u0e01\u0e49\u0e44\u0e02\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c</button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}`;

// Remove lines from guardIdx+1 (the broken span) up to the line just before "Users Tab (Manage Roles)"
if (oldTabIdx !== -1) {
    const before = lines.slice(0, guardIdx + 1);
    const after = lines.slice(oldTabIdx);
    // after starts at "        {/* ── Users Tab (Manage Roles)" - we want to skip that and the whole block
    // Find where this old block ends (the closing `)}`)
    let depth = 0;
    let endIdx = -1;
    for (let i = 0; i < after.length; i++) {
        const l = after[i];
        if (l.includes('{activeTab === "users"') && l.includes('(user?.role')) {
            depth = 1;
        } else if (depth > 0) {
            // count JSX braces roughly
            const opens = (l.match(/\(\s*$/) || []).length + (l.match(/\{$/) || []).length;
            const closes = (l.match(/^\s*\}\)/) || []).length + (l.match(/^\s*\)/) || []).length;
            depth += opens - closes;
            if (depth <= 0) { endIdx = i; break; }
        }
    }
    
    const afterClean = endIdx !== -1 ? after.slice(endIdx + 1) : after.slice(1);
    const result = [...before, usersTabContent, ...afterClean].join('\n');
    fs.writeFileSync(file, result, 'utf8');
    console.log("Cleaned successfully, old block removed at idx", oldTabIdx, "end idx", endIdx);
} else {
    // No old block, just append the new one
    const before = lines.slice(0, guardIdx + 1);
    const after = lines.slice(guardIdx + 1);
    // remove the broken span fragment until we hit a clean context
    // find first line that's part of main structure again after the broken stuff
    // Heuristic: find next {/* ─ or the Users Tab comment
    let cleanIdx = after.findIndex(l => l.includes('{/* ──') || l.includes('</main>'));
    if (cleanIdx === -1) cleanIdx = 0;
    const result = [...before, usersTabContent, ...after.slice(cleanIdx)].join('\n');
    fs.writeFileSync(file, result, 'utf8');
    console.log("Appended new users tab, removed", cleanIdx, "broken lines");
}
