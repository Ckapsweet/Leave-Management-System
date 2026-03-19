import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type LeaveType = "ลาป่วย" | "ลาพักร้อน" | "ลากิจ" | "ลาคลอด" | "ลาบวช";
type LeaveStatus = "รออนุมัติ" | "อนุมัติแล้ว" | "ปฏิเสธ";

interface LeaveRequest {
  id: number;
  name: string;
  dept: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
  reason: string;
  avatar: string;
}

interface LeaveForm {
  name: string;
  dept: string;
  type: LeaveType;
  from: string;
  to: string;
  reason: string;
}

interface ModalProps {
  onClose: () => void;
  onSubmit: (form: LeaveForm & { days: number }) => void;
}

interface DetailModalProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPES: LeaveType[] = ["ลาป่วย", "ลาพักร้อน", "ลากิจ", "ลาคลอด", "ลาบวช"];
const DEPARTMENTS = ["แผนก", "วิศวกรรม", "การตลาด", "ทรัพยากรบุคคล", "การเงิน", "ปฏิบัติการ"];
const STATUS_OPTIONS: LeaveStatus[] = ["รออนุมัติ", "อนุมัติแล้ว", "ปฏิเสธ"];

const STATUS_STYLE: Record<LeaveStatus, { bg: string; text: string; dot: string }> = {
  "รออนุมัติ":   { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  "อนุมัติแล้ว": { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
  "ปฏิเสธ":      { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400" },
};

const LEAVE_COLOR: Record<LeaveType, string> = {
  "ลาป่วย":    "bg-blue-100 text-blue-700",
  "ลาพักร้อน": "bg-purple-100 text-purple-700",
  "ลากิจ":     "bg-teal-100 text-teal-700",
  "ลาคลอด":    "bg-pink-100 text-pink-700",
  "ลาบวช":     "bg-orange-100 text-orange-700",
};

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: 1, name: "สมชาย ใจดี",    dept: "วิศวกรรม",       type: "ลาป่วย",    from: "2025-03-20", to: "2025-03-21", days: 2,  status: "รออนุมัติ",   reason: "ไม่สบาย มีไข้",        avatar: "สช" },
  { id: 2, name: "วิภา สุขสบาย",  dept: "การตลาด",        type: "ลาพักร้อน", from: "2025-03-25", to: "2025-03-28", days: 4,  status: "อนุมัติแล้ว", reason: "พักผ่อนประจำปี",       avatar: "วภ" },
  { id: 3, name: "ธนา รักษ์ไทย",  dept: "การเงิน",        type: "ลากิจ",     from: "2025-03-22", to: "2025-03-22", days: 1,  status: "รออนุมัติ",   reason: "ธุระส่วนตัวสำคัญ",     avatar: "ธน" },
  { id: 4, name: "นภา แสงทอง",    dept: "ทรัพยากรบุคคล", type: "ลาคลอด",    from: "2025-04-01", to: "2025-06-30", days: 90, status: "อนุมัติแล้ว", reason: "คลอดบุตร",             avatar: "นภ" },
  { id: 5, name: "พิชัย ดีเลิศ",  dept: "ปฏิบัติการ",     type: "ลาบวช",     from: "2025-04-10", to: "2025-04-24", days: 15, status: "รออนุมัติ",   reason: "อุปสมบท",              avatar: "พช" },
  { id: 6, name: "มาลี สดใส",     dept: "วิศวกรรม",       type: "ลาป่วย",    from: "2025-03-18", to: "2025-03-19", days: 2,  status: "ปฏิเสธ",      reason: "ต้องการพักผ่อน",       avatar: "มล" },
  { id: 7, name: "อนุชา พัฒนา",   dept: "การตลาด",        type: "ลาพักร้อน", from: "2025-04-05", to: "2025-04-07", days: 3,  status: "รออนุมัติ",   reason: "ท่องเที่ยวต่างประเทศ", avatar: "อช" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function calcDays(from: string, to: string): number {
  return Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1);
}

// ── Modal: แจ้งลาใหม่ ─────────────────────────────────────────────────────────

function Modal({ onClose, onSubmit }: ModalProps) {
  const [form, setForm] = useState<LeaveForm>({
    name: "", dept: DEPARTMENTS[1], type: LEAVE_TYPES[0], from: "", to: "", reason: "",
  });

  const set = <K extends keyof LeaveForm>(key: K, value: LeaveForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const days = form.from && form.to ? calcDays(form.from, form.to) : 0;
  const canSubmit = Boolean(form.name && form.from && form.to && form.reason);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">แจ้งลาใหม่</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อ-นามสกุล</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ชื่อพนักงาน" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">แผนก</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" value={form.dept} onChange={(e) => set("dept", e.target.value)}>
                {DEPARTMENTS.slice(1).map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ประเภทการลา</label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map((t) => (
                <button key={t} onClick={() => set("type", t)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.type === t ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">วันที่เริ่มลา</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" value={form.from} onChange={(e) => set("from", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">วันที่สิ้นสุด</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" value={form.to} onChange={(e) => set("to", e.target.value)} />
            </div>
          </div>
          {days > 0 && <p className="text-xs text-violet-600 font-medium">รวม {days} วัน</p>}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">เหตุผลการลา</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" rows={3} value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="ระบุเหตุผล..." />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">ยกเลิก</button>
          <button onClick={() => canSubmit && onSubmit({ ...form, days })} disabled={!canSubmit} className="px-5 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">ส่งคำขอลา</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: รายละเอียด ─────────────────────────────────────────────────────────

function DetailModal({ request, onClose, onApprove, onReject }: DetailModalProps) {
  const st = STATUS_STYLE[request.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">รายละเอียดการลา</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-gray-900">{request.name}</p>
              <p className="text-sm text-gray-500">{request.dept}</p>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {request.status}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ประเภทการลา</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEAVE_COLOR[request.type]}`}>{request.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">วันที่ลา</span>
              <span className="font-medium text-gray-800">{formatDate(request.from)} - {formatDate(request.to)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">จำนวนวัน</span>
              <span className="font-semibold text-violet-700">{request.days} วัน</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-1">เหตุผล</p>
              <p className="text-sm text-gray-800">{request.reason}</p>
            </div>
          </div>
        </div>
        {request.status === "รออนุมัติ" ? (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => { onReject(request.id); onClose(); }} className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium">ปฏิเสธ</button>
            <button onClick={() => { onApprove(request.id); onClose(); }} className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium">อนุมัติ</button>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <button onClick={onClose} className="w-full py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">ปิด</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LeaveDashboard() {
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [filterDept, setFilterDept] = useState("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState<"ทั้งหมด" | LeaveStatus>("ทั้งหมด");
  const [search, setSearch] = useState("");

  const pending   = requests.filter((r) => r.status === "รออนุมัติ").length;
  const approved  = requests.filter((r) => r.status === "อนุมัติแล้ว").length;
  const rejected  = requests.filter((r) => r.status === "ปฏิเสธ").length;
  const totalDays = requests.filter((r) => r.status === "อนุมัติแล้ว").reduce((s, r) => s + r.days, 0);

  const filtered = requests.filter((r) => {
    const matchDept   = filterDept   === "ทั้งหมด" || r.dept   === filterDept;
    const matchStatus = filterStatus === "ทั้งหมด" || r.status === filterStatus;
    const matchSearch = r.name.includes(search) || r.type.includes(search) || r.dept.includes(search);
    return matchDept && matchStatus && matchSearch;
  });

  const handleSubmit = (form: LeaveForm & { days: number }) => {
    const newId = requests.length + 1;
    setRequests((prev) => [...prev, { ...form, id: newId, status: "รออนุมัติ", avatar: form.name.slice(0, 2) }]);
    setShowModal(false);
  };

  const approve = (id: number) => setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "อนุมัติแล้ว" } : r));
  const reject  = (id: number) => setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "ปฏิเสธ" }      : r));

  const allStatuses = (["ทั้งหมด", ...STATUS_OPTIONS] as const);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {showModal && <Modal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      {detail    && <DetailModal request={detail} onClose={() => setDetail(null)} onApprove={approve} onReject={reject} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">ระบบแจ้งลา</h1>
            <p className="text-xs text-gray-400">Leave Management System</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <span className="text-lg leading-none">+</span>
          แจ้งลาใหม่
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "รออนุมัติ",           value: pending,           color: "text-amber-600",  bg: "bg-amber-50",  icon: "⏳" },
            { label: "อนุมัติแล้ว",          value: approved,          color: "text-green-600",  bg: "bg-green-50",  icon: "✓" },
            { label: "ปฏิเสธ",              value: rejected,          color: "text-red-600",    bg: "bg-red-50",    icon: "✗" },
            { label: "วันลาสะสม (อนุมัติ)", value: `${totalDays} วัน`, color: "text-violet-600", bg: "bg-violet-50", icon: "📅" },
          ] as const).map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center text-sm mb-3`}>{icon}</div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="ค้นหาชื่อ, แผนก, ประเภทลา..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <div className="flex gap-2 flex-wrap">
              {allStatuses.map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${filterStatus === s ? "bg-violet-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">รายการใบลา <span className="text-gray-400 font-normal">({filtered.length} รายการ)</span></h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-center">
                  {(["พนักงาน", "แผนก", "ประเภทลา", "วันที่", "จำนวน", "สถานะ", ""] as const).map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">ไม่พบรายการลา</td></tr>
                )}
                {filtered.map((r) => {
                  const st    = STATUS_STYLE[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setDetail(r)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{r.dept}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${LEAVE_COLOR[r.type]}`}>{r.type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(r.from)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{r.days} วัน</td>
                      <td className="px-5 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                          {r.status}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {r.status === "รออนุมัติ" && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => approve(r.id)} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">อนุมัติ</button>
                            <button onClick={() => reject(r.id)}  className="px-3 py-1 text-xs bg-red-100  text-red-600  rounded-lg hover:bg-red-200  font-medium">ปฏิเสธ</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}