// components/LeaveReport.tsx
// Shared report component สำหรับทั้ง User และ Admin
import { useState, useEffect } from "react";
import type { MonthlyReport, YearStat } from "../services/leaveService";

// ── Types ─────────────────────────────────────────────────────

interface LeaveReportProps {
  fetchMonthly: (year: number) => Promise<MonthlyReport>;
  fetchYearly:  () => Promise<YearStat[]>;
  currentYear:  number;
}

// ── Constants ─────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  "ลาป่วย":    "#38bdf8",
  "ลากิจ":     "#2dd4bf",
  "ลาพักผ่อน": "#a78bfa",
  "ลาอื่นๆ":   "#fb923c",
};
const FALLBACK_COLORS = ["#94a3b8", "#64748b", "#475569", "#334155"];

function getColor(name: string, idx: number) {
  return TYPE_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

// ── Bar Chart ─────────────────────────────────────────────────

function BarChart({ data, maxVal }: { data: { label: string; value: number; by_type: Record<string, number> }[]; maxVal: number }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; by_type: Record<string, number>; total: number } | null>(null);

  return (
    <div className="relative">
      <div className="flex items-end gap-1.5 h-40 px-1">
        {data.map((d, i) => {
          const heightPct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          const types = Object.entries(d.by_type);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
              onMouseEnter={(e) => setTooltip({ x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().top, label: d.label, by_type: d.by_type, total: d.value })}
              onMouseLeave={() => setTooltip(null)}>
              <div className="w-full flex flex-col justify-end rounded-t-sm overflow-hidden" style={{ height: "128px" }}>
                {d.value === 0 ? (
                  <div className="w-full h-1 bg-gray-100 rounded-t-sm" />
                ) : (
                  <div className="w-full flex flex-col justify-end" style={{ height: `${heightPct}%`, minHeight: "4px" }}>
                    {types.length === 0 ? (
                      <div className="w-full h-full bg-indigo-400 rounded-t-sm" />
                    ) : (
                      types.map(([name, val], j) => (
                        <div key={name} style={{ flex: val, backgroundColor: getColor(name, j), minHeight: "2px" }} />
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 text-center leading-tight">{d.label}</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-gray-900 text-white rounded-xl p-3 text-xs shadow-xl pointer-events-none transform -translate-x-1/2"
          style={{ left: tooltip.x + 16, top: tooltip.y - 10 }}>
          <p className="font-semibold mb-1">{tooltip.label} — {tooltip.total} วัน</p>
          {Object.entries(tooltip.by_type).map(([name, val]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(name, 0) }} />
              <span>{name}: {val} วัน</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────

function Legend({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {types.map((name, i) => (
        <div key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(name, i) }} />
          {name}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function LeaveReport({ fetchMonthly, fetchYearly, currentYear }: LeaveReportProps) {
  const [view,    setView]    = useState<"monthly" | "yearly">("monthly");
  const [year,    setYear]    = useState(currentYear);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [yearly,  setYearly]  = useState<YearStat[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch monthly
  useEffect(() => {
    if (view !== "monthly") return;
    setLoading(true);
    fetchMonthly(year)
      .then(setMonthly)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [view, year, fetchMonthly]);

  // Fetch yearly
  useEffect(() => {
    if (view !== "yearly") return;
    setLoading(true);
    fetchYearly()
      .then(setYearly)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [view, fetchYearly]);

  // All leave type names
  const allTypes = Array.from(new Set([
    ...(monthly?.months.flatMap((m) => Object.keys(m.by_type)) ?? []),
    ...(yearly.flatMap((y) => Object.keys(y.by_type))),
  ]));

  // Monthly bar data
  const monthlyBarData = monthly?.months.map((m) => ({
    label:   m.month_name,
    value:   m.total_days,
    by_type: m.by_type,
  })) ?? [];
  const monthlyMax = Math.max(...monthlyBarData.map((d) => d.value), 1);

  // Yearly bar data
  const yearlyBarData = [...yearly].reverse().map((y) => ({
    label:   String(y.year),
    value:   y.total_days,
    by_type: y.by_type,
  }));
  const yearlyMax = Math.max(...yearlyBarData.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-gray-700">สถิติการลา</h3>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["monthly", "yearly"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {v === "monthly" ? "รายเดือน" : "รายปี"}
              </button>
            ))}
          </div>
          {/* Year selector (monthly only) */}
          {view === "monthly" && (
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-300">
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "monthly" ? (
          <BarChart data={monthlyBarData} maxVal={monthlyMax} />
        ) : (
          yearlyBarData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">ยังไม่มีประวัติการลา</div>
          ) : (
            <BarChart data={yearlyBarData} maxVal={yearlyMax} />
          )
        )}

        {/* Legend */}
        {allTypes.length > 0 && !loading && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <Legend types={allTypes} />
          </div>
        )}
      </div>

      {/* Table */}
      {!loading && (
        <div className="border-t border-gray-100 overflow-x-auto">
          {view === "monthly" && monthly ? (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400">เดือน</th>
                  {allTypes.map((t) => <th key={t} className="px-4 py-3 text-xs font-semibold text-gray-400 text-center">{t}</th>)}
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthly.months.filter((m) => m.total_days > 0).map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-sm text-gray-700">{m.month_name}</td>
                    {allTypes.map((t) => (
                      <td key={t} className="px-4 py-3 text-sm text-center">
                        {m.by_type[t] ? (
                          <span className="font-medium text-gray-700">{m.by_type[t]}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-sm font-bold text-gray-900 text-center">{m.total_days}</td>
                  </tr>
                ))}
                {/* Summary row */}
                <tr className="bg-indigo-50/50 font-semibold">
                  <td className="px-5 py-3 text-sm text-indigo-700">รวมทั้งปี {monthly.year}</td>
                  {allTypes.map((t) => {
                    const sum = monthly.months.reduce((s, m) => s + (m.by_type[t] ?? 0), 0);
                    return <td key={t} className="px-4 py-3 text-sm text-center text-indigo-700">{sum > 0 ? sum : "—"}</td>;
                  })}
                  <td className="px-5 py-3 text-sm text-center text-indigo-700">
                    {monthly.months.reduce((s, m) => s + m.total_days, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400">ปี</th>
                  {allTypes.map((t) => <th key={t} className="px-4 py-3 text-xs font-semibold text-gray-400 text-center">{t}</th>)}
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-center">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {yearly.map((y) => (
                  <tr key={y.year} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">{y.year}</td>
                    {allTypes.map((t) => (
                      <td key={t} className="px-4 py-3 text-sm text-center">
                        {y.by_type[t] ? <span className="font-medium text-gray-700">{y.by_type[t]}</span> : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-sm font-bold text-gray-900 text-center">{y.total_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaveReport;