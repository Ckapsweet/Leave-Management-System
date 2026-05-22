import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../services/authService";
import type { Employee } from "./adminHelpers";
import { avatarColor, fmtDate } from "./adminHelpers";
import { toast } from "./Toast";
import { getErrorMessage } from "../services/errors";
import {
  createEvent,
  getEventAttendance,
  getEventLeads,
  getEvents,
  getLeadTeam,
  reviewEventAttendance,
  updateEventParticipants,
  type EventAttendance,
  type WorkEvent,
} from "../services/eventService";

interface EventPanelProps {
  user: AuthUser | null;
}

type EventModalMode = "create" | "participants" | "detail";
type EventTeamMember = Employee & { lead_id?: number; lead_name?: string };

const canCreateEvent = (role?: string | null) => role === "manager" || role === "assistant manager" || role === "admin";
const canPrintEventReport = (role?: string | null) => role === "manager" || role === "assistant manager" || role === "admin";

function eventAttendanceStatusLabel(status?: string) {
  if (status === "approved") return "ยืนยันแล้ว";
  if (status === "pending") return "รอยืนยัน";
  if (status === "rejected") return "ปฏิเสธ";
  return "ยังไม่ส่ง";
}

function printEventReport(event: WorkEvent, attendance: EventAttendance[]) {
  const rows = attendance.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.full_name ?? "-"}</td>
      <td>${item.department ?? "-"}</td>
      <td>${item.event_date ? fmtDate(item.event_date) : "-"}</td>
      <td>${item.check_in_time?.slice(0, 5) ?? "-"}</td>
      <td>${item.check_out_time?.slice(0, 5) ?? "-"}</td>
      <td>${eventAttendanceStatusLabel(item.status)}</td>
      <td>${item.approver_name ?? "-"}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    toast.error("ไม่สามารถเปิดหน้าพิมพ์ได้ กรุณาอนุญาต popup");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Event Report - ${event.title}</title>
        <style>
          @page { size: A4 portrait; margin: 16mm; }
          body { font-family: Arial, "Noto Sans Thai", sans-serif; color: #111827; margin: 0; }
          .report-page { box-sizing: border-box; display: flex; flex-direction: column; min-height: calc(297mm - 48px); padding: 24px; }
          h1 { font-size: 20px; margin: 0 0 6px; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; font-weight: 700; }
          .summary { display: flex; gap: 16px; margin: 14px 0 18px; font-size: 12px; }
          .summary div { border: 1px solid #e5e7eb; padding: 8px 10px; border-radius: 8px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; margin-top: auto; padding-top: 64px; font-size: 13px; }
          .signature-box { text-align: center; }
          .signature-line { border-bottom: 1px solid #111827; height: 44px; margin-bottom: 10px; }
          .signature-title { font-weight: 700; }
          @media print { .report-page { min-height: calc(297mm - 32mm); padding: 0; } }
        </style>
      </head>
      <body>
        <div class="report-page">
        <h1>รายงานเวลา Event: ${event.title}</h1>
        <div class="meta">
          ช่วงเวลา ${fmtDate(event.start_date)} - ${fmtDate(event.end_date)}
          ${event.lead_name ? ` / Lead: ${event.lead_name}` : ""}
        </div>
        <div class="summary">
          <div>ทั้งหมด: ${attendance.length} รายการ</div>
          <div>ยืนยันแล้ว: ${attendance.filter((item) => item.status === "approved").length}</div>
          <div>รอยืนยัน: ${attendance.filter((item) => item.status === "pending").length}</div>
          <div>ปฏิเสธ: ${attendance.filter((item) => item.status === "rejected").length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>พนักงาน</th>
              <th>แผนก</th>
              <th>วันที่</th>
              <th>เวลาเข้า</th>
              <th>เวลาออก</th>
              <th>สถานะ</th>
              <th>ผู้ยืนยัน</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="9">ยังไม่มีข้อมูลลงเวลา</td></tr>`}</tbody>
        </table>
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">ผจก.การตลาด</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-title">ผจก.ฝ่ายทั่วไป</div>
          </div>
        </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function EventModal({
  mode,
  user,
  event,
  leads,
  team,
  attendance,
  teamLoading,
  saving,
  onClose,
  onCreate,
  onSaveParticipants,
  onOpenParticipants,
  onReviewAttendance,
}: {
  mode: EventModalMode;
  user: AuthUser | null;
  event: WorkEvent | null;
  leads: Employee[];
  team: EventTeamMember[];
  attendance: EventAttendance[];
  teamLoading: boolean;
  saving: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description: string; start_date: string; end_date: string; lead_ids: number[] }) => void;
  onSaveParticipants: (ids: number[]) => void;
  onOpenParticipants: (event: WorkEvent) => void;
  onReviewAttendance: (logId: number, action: "approve" | "reject") => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [leadIds, setLeadIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (mode !== "participants" || !event) return;
    setSelectedIds(new Set(event.participants.map((participant) => participant.id)));
  }, [event, mode]);

  const isCreate = mode === "create";
  const isDetail = mode === "detail";
  const titleText = isCreate ? "สร้าง Event" : isDetail ? "รายละเอียด Event" : "เลือกสมาชิกเข้าร่วม Event";

  const submit = () => {
    if (isCreate) {
      if (!title.trim()) return toast.error("กรุณาระบุชื่อ Event");
      if (leadIds.size === 0) return toast.error("กรุณาเลือก Lead อย่างน้อย 1 คน");
      if (endDate < startDate) return toast.error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น");
      onCreate({
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        lead_ids: Array.from(leadIds),
      });
      return;
    }
    onSaveParticipants(Array.from(selectedIds));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{titleText}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {isCreate ? "Manager หรือรอง Manager เลือกระยะเวลาและ Lead" : event?.title}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">x</button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[65vh]">
          {isCreate ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">ชื่อ Event</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="เช่น จัดบูธ, ออกงาน, ประชุมทีม"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">วันที่เริ่ม</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Lead ผู้รับผิดชอบ</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {leads.length === 0 ? (
                    <p className="text-sm text-gray-400 p-2">ไม่พบ Lead ที่เลือกได้</p>
                  ) : leads.map((lead) => {
                    const checked = leadIds.has(lead.id);
                    return (
                      <label
                        key={lead.id}
                        className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${
                          checked ? "bg-slate-100" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-slate-800"
                          checked={checked}
                          onChange={(e) => {
                            setLeadIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(lead.id);
                              else next.delete(lead.id);
                              return next;
                            });
                          }}
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(lead.department)}`}>
                          {lead.full_name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{lead.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{lead.employee_code}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">รายละเอียด</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                />
              </div>
            </>
          ) : isDetail ? (
            <>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">ชื่อ Event</p>
                  <h4 className="text-lg font-semibold text-gray-900">{event?.title}</h4>
                </div>
                <div>
                  <p className="text-xs text-gray-400">รายละเอียด</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{event?.description || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">ช่วงเวลา</p>
                  <p className="text-sm font-medium text-gray-800">
                    {event ? `${fmtDate(event.start_date)} - ${fmtDate(event.end_date)}` : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">สร้างโดย</p>
                  <p className="text-sm font-medium text-gray-800">{event?.creator_name ?? "-"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400">ผู้เข้าร่วม</p>
                  <p className="text-sm font-medium text-gray-800">{event?.participants.length ?? 0} คน</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">Lead</p>
                  <span className="text-xs text-gray-400">{event?.leads?.length ?? event?.lead_ids?.length ?? 1} คน</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(event?.leads?.length ? event.leads : []).map((lead) => (
                    <div key={lead.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(lead.department)}`}>
                        {lead.full_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{lead.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{lead.department} / {lead.employee_code}</p>
                      </div>
                    </div>
                  ))}
                  {!event?.leads?.length && (
                    <div className="text-sm text-gray-400 border border-gray-100 rounded-xl p-3">{event?.lead_name ?? "-"}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">รายชื่อผู้เข้าร่วม</p>
                  <span className="text-xs text-gray-400">{event?.participants.length ?? 0} คน</span>
                </div>
                {(event?.participants.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400 border border-gray-100 rounded-xl">ยังไม่ได้เลือกผู้เข้าร่วม</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {event?.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(participant.department)}`}>
                          {participant.full_name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{participant.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {participant.department} / {participant.employee_code}
                            {participant.selected_by_lead_name ? ` / Lead: ${participant.selected_by_lead_name}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">รีพอร์ตเวลา Event</p>
                    <p className="text-xs text-gray-400 mt-0.5">{attendance.filter((item) => item.status === "pending").length} รอยืนยัน / {attendance.filter((item) => item.status === "approved").length} ยืนยันแล้ว</p>
                  </div>
                  {event && canPrintEventReport(user?.role) && (
                    <button
                      type="button"
                      onClick={() => printEventReport(event, attendance)}
                      className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                    >
                      พิมพ์รีพอร์ต
                    </button>
                  )}
                </div>
                {attendance.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400 border border-gray-100 rounded-xl">ยังไม่มีการส่งเวลา</div>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((item) => (
                      <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.full_name} / {fmtDate(item.event_date)}</p>
                            <p className="text-xs text-gray-400">เวลา {item.check_in_time?.slice(0, 5)} - {item.check_out_time?.slice(0, 5)}</p>
                            {!!item.attachments?.length && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.attachments.map((file) => (
                                  <a key={file.id} href={file.url} target="_blank" className="text-xs text-indigo-600 hover:text-indigo-800" rel="noreferrer">
                                    {file.original_name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                            item.status === "approved" ? "bg-emerald-50 text-emerald-700" : item.status === "pending" ? "bg-amber-50 text-amber-700" : item.status === "rejected" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {item.status === "approved" ? "ยืนยันแล้ว" : item.status === "pending" ? "รอยืนยัน" : item.status === "rejected" ? "ปฏิเสธ" : "ยังไม่ส่ง"}
                          </span>
                        </div>
                        {item.status === "pending" && item.id && item.user_id !== user?.id && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => onReviewAttendance(item.id!, "reject")} className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">ปฏิเสธ</button>
                            <button onClick={() => onReviewAttendance(item.id!, "approve")} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">ยืนยัน</button>
                          </div>
                        )}
                        {item.status === "pending" && item.user_id === user?.id && (
                          <p className="text-xs text-amber-600 text-right">รอผู้มีสิทธิ์ระดับถัดไปยืนยัน</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-50 rounded-xl p-4 text-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-400">ช่วงเวลา</p>
                  <p className="font-medium text-gray-800">{event ? `${fmtDate(event.start_date)} - ${fmtDate(event.end_date)}` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Lead</p>
                  <p className="font-medium text-gray-800">{event?.lead_name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">เลือกแล้ว</p>
                  <p className="font-medium text-gray-800">{selectedIds.size} คน</p>
                </div>
              </div>
              {teamLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : team.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">ไม่พบสมาชิกในทีมของ Lead นี้</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {team.map((member) => {
                    const checked = selectedIds.has(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                          checked ? "border-slate-700 bg-slate-50" : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-slate-800"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(member.id);
                              else next.delete(member.id);
                              return next;
                            });
                          }}
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(member.department)}`}>
                          {member.full_name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{member.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {member.department} / {member.employee_code}
                            {"lead_name" in member && member.lead_name ? ` / Lead: ${member.lead_name}` : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {user?.role === "lead" && !(event?.lead_ids ?? [event?.lead_id]).includes(user.id) && (
                <p className="text-xs text-amber-600">Event นี้ไม่ได้ assign ให้ Lead คนนี้ จึงไม่สามารถแก้ไขรายชื่อได้</p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
            ยกเลิก
          </button>
          {isDetail && event ? (
            <button
              onClick={() => onOpenParticipants(event)}
              className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-slate-800 hover:bg-slate-700"
            >
              เลือกคนเข้า Event
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving || (!isCreate && teamLoading) || (!isCreate && user?.role === "lead" && !(event?.lead_ids ?? [event?.lead_id]).includes(user.id))}
              className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "กำลังบันทึก..." : isCreate ? "สร้าง Event" : "บันทึกรายชื่อ"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventPanel({ user }: EventPanelProps) {
  const [events, setEvents] = useState<WorkEvent[]>([]);
  const [leads, setLeads] = useState<Employee[]>([]);
  const [team, setTeam] = useState<EventTeamMember[]>([]);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<EventModalMode | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorkEvent | null>(null);

  const leadChoices = useMemo(() => {
    if (!user || user.role !== "assistant manager") return leads;
    return leads.filter((lead) => lead.supervisor_id === user.id);
  }, [leads, user]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const [eventData, leadData] = await Promise.all([
        getEvents(),
        canCreateEvent(user?.role) ? getEventLeads() : Promise.resolve([]),
      ]);
      setEvents(eventData);
      setLeads(leadData);
    } catch (err) {
      toast.error(getErrorMessage(err, "โหลดข้อมูล Event ไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openParticipantModal = async (event: WorkEvent) => {
    setSelectedEvent(event);
    setModalMode("participants");
    setTeam([]);
    setTeamLoading(true);
    try {
      setTeam(await getLeadTeam(event.id));
    } catch (err) {
      toast.error(getErrorMessage(err, "โหลดทีมของ Lead ไม่สำเร็จ"));
    } finally {
      setTeamLoading(false);
    }
  };

  const openDetailModal = (event: WorkEvent) => {
    setSelectedEvent(event);
    setModalMode("detail");
    getEventAttendance(event.id).then(setAttendance).catch(() => setAttendance([]));
  };

  const handleReviewAttendance = async (logId: number, action: "approve" | "reject") => {
    try {
      const updated = await reviewEventAttendance(logId, action);
      setAttendance((prev) => prev.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      toast.success(action === "approve" ? "ยืนยันเวลาเรียบร้อย" : "ปฏิเสธเวลาเรียบร้อย");
    } catch (err) {
      toast.error(getErrorMessage(err, "ดำเนินการไม่สำเร็จ"));
    }
  };

  const closeModal = (force = false) => {
    if (saving && !force) return;
    setModalMode(null);
    setSelectedEvent(null);
    setTeam([]);
  };

  const handleCreate = async (payload: { title: string; description: string; start_date: string; end_date: string; lead_ids: number[] }) => {
    try {
      setSaving(true);
      const created = await createEvent(payload);
      setEvents((prev) => [created, ...prev]);
      toast.success("สร้าง Event เรียบร้อย");
      closeModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "สร้าง Event ไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParticipants = async (ids: number[]) => {
    if (!selectedEvent) return;
    try {
      setSaving(true);
      const updated = await updateEventParticipants(selectedEvent.id, ids);
      setEvents((prev) => prev.map((event) => event.id === updated.id ? updated : event));
      toast.success("บันทึกรายชื่อผู้เข้าร่วมเรียบร้อย");
      closeModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "บันทึกรายชื่อไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Event</h2>
          <p className="text-xs text-gray-400 mt-1">
            Manager/Assist Manager สร้าง Event และเลือก Lead จากนั้น Lead เลือกสมาชิกในทีม
          </p>
        </div>
        {canCreateEvent(user?.role) && (
          <button
            onClick={() => setModalMode("create")}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
          >
            สร้าง Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">รายการ Event <span className="ml-2 text-gray-400 font-normal">({events.length} รายการ)</span></h3>
          <button onClick={fetchEvents} className="text-xs text-gray-400 hover:text-gray-600">รีเฟรช</button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">ยังไม่มี Event</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-left">
                  {["Event", "ช่วงเวลา", "Lead", "ผู้เข้าร่วม", ""].map((header) => (
                    <th key={header} className="px-5 py-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => {
                  const eventLeadIds = event.lead_ids ?? event.leads?.map((lead) => lead.id) ?? [event.lead_id];
                  const canEditParticipants = user?.role === "admin" || user?.role === "manager" || user?.role === "assistant manager" || (user?.role === "lead" && eventLeadIds.includes(user.id));
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => openDetailModal(event)}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-400 max-w-[320px] truncate">{event.description || event.department || "-"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {fmtDate(event.start_date)} - {fmtDate(event.end_date)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800 max-w-[260px] truncate">{event.lead_name ?? "-"}</p>
                        <p className="text-xs text-gray-400">{event.leads?.length ? `${event.leads.length} lead` : event.lead_employee_code ?? ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{event.participants.length}</span>
                          <span className="text-xs text-gray-400">คน</span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-[220px] truncate">
                          {event.participants.map((participant) => participant.full_name).join(", ") || "ยังไม่ได้เลือก"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openParticipantModal(event)}
                          disabled={!canEditParticipants}
                          className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          เลือกคนเข้า Event
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode && (
        <EventModal
          mode={modalMode}
          user={user}
          event={selectedEvent}
          leads={leadChoices}
          team={team}
          attendance={attendance}
          teamLoading={teamLoading}
          saving={saving}
          onClose={closeModal}
          onCreate={handleCreate}
          onSaveParticipants={handleSaveParticipants}
          onOpenParticipants={openParticipantModal}
          onReviewAttendance={handleReviewAttendance}
        />
      )}
    </div>
  );
}
