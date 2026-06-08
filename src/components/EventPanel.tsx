import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "../services/authService";
import type { Employee } from "./adminHelpers";
import { avatarColor, fmtDate } from "./adminHelpers";
import { toast } from "./Toast";
import { getErrorMessage } from "../services/errors";
import api from "../services/api";
import {
  createManualEventAttendance,
  createEvent,
  deleteEvent,
  deleteEventAttendance,
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
type EventAttachment = NonNullable<EventAttendance["attachments"]>[number];

const canCreateEvent = (role?: string | null) => role === "manager" || role === "assistant manager" || role === "admin";
const canPrintEventReport = (role?: string | null) => role === "manager" || role === "assistant manager" || role === "admin";
const canInputEventAttendance = (role?: string | null) => role === "manager" || role === "assistant manager" || role === "admin";

function eventAttendanceStatusLabel(status?: string) {
  if (status === "approved") return "ยืนยันแล้ว";
  if (status === "pending") return "รอยืนยัน";
  if (status === "rejected") return "ปฏิเสธ";
  return "ยังไม่ส่ง";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function eventDateRange(start: string, end: string) {
  const dates: string[] = [];
  const startDate = new Date(dateOnly(start));
  const endDate = new Date(dateOnly(end || start));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return dates;

  for (let current = startDate; current <= endDate; current = addDays(current, 1)) {
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}

function shortPrintDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function weekdayLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { weekday: "short" });
}

function printEventReport(event: WorkEvent, attendance: EventAttendance[]) {
  const dates = eventDateRange(event.start_date, event.end_date);
  const participants = [
    ...(event.participants ?? []).map((participant) => ({
      key: `user:${participant.id}`,
      full_name: participant.full_name,
      employee_code: participant.employee_code,
      department: participant.department,
    })),
    ...(event.external_participants ?? []).map((participant) => ({
      key: `external:${participant.id}`,
      full_name: participant.full_name,
      employee_code: "",
      department: participant.department || "บุคคลอื่นๆ",
    })),
    ...attendance.map((item) => ({
      key: item.external_participant_id ? `external:${item.external_participant_id}` : `user:${item.user_id ?? 0}`,
      full_name: item.full_name ?? "",
      employee_code: item.employee_code ?? "",
      department: item.department ?? "",
    })),
  ].reduce<{ key: string; full_name: string; employee_code?: string | null; department?: string | null }[]>((unique, participant) => {
    if (!participant.key || participant.key.endsWith(":0") || unique.some((item) => item.key === participant.key)) return unique;
    return [...unique, participant];
  }, []);
  const attendanceByParticipantAndDate = new Map<string, EventAttendance>();
  attendance.forEach((item) => {
    const participantKey = item.external_participant_id ? `external:${item.external_participant_id}` : item.user_id ? `user:${item.user_id}` : "";
    if (!participantKey || !item.event_date) return;
    attendanceByParticipantAndDate.set(`${participantKey}:${dateOnly(item.event_date)}`, item);
  });
  const rows = participants.map((participant, index) => {
    const dayCells = dates.map((date) => {
      const item = attendanceByParticipantAndDate.get(`${participant.key}:${date}`);
      const checkIn = item?.check_in_time?.slice(0, 5) ?? "";
      const checkOut = item?.check_out_time?.slice(0, 5) ?? "";
      const statusTitle = item ? eventAttendanceStatusLabel(item.status) : "ยังไม่ส่ง";
      return `
        <td title="${escapeHtml(statusTitle)}">${escapeHtml(checkIn || "-")}</td>
        <td title="${escapeHtml(statusTitle)}">${escapeHtml(checkOut || "-")}</td>
      `;
    }).join("");
    return `
      <tr>
        <td class="col-no">${index + 1}</td>
        <td class="employee-name">
          <div>${escapeHtml(participant.full_name || "-")}</div>
        </td>
        ${dayCells}
        <td class="signature-cell"><span></span></td>
      </tr>
    `;
  }).join("");
  const emptyColspan = Math.max(3, dates.length * 2 + 3);
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
          @page { size: A4 landscape; margin: 8mm; }
          body { font-family: Arial, "Noto Sans Thai", sans-serif; color: #111827; margin: 0; }
          .report-page { box-sizing: border-box; width: 100%; padding: 0; }
          .report-title { text-align: center; font-size: 14px; font-weight: 700; margin: 0 0 3px; }
          .report-subtitle { text-align: center; font-size: 11px; font-weight: 700; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
          th, td { border: 1px solid #6b7280; padding: 3px 4px; text-align: center; vertical-align: middle; height: 24px; line-height: 1.2; }
          th { background: #e5e7eb; font-weight: 700; }
          .col-no { width: 26px; }
          .employee-name { width: 150px; text-align: left; font-weight: 700; }
          .employee-name small { display: block; color: #6b7280; font-weight: 400; margin-top: 2px; }
          .date-head { background: #dbeafe; }
          .time-head { background: #eef2ff; font-size: 8px; }
          .signature-head, .signature-cell { width: 58px; background: #eef2f7; font-weight: 700; }
          .signature-cell span { display: block; height: 18px; border-bottom: 1px solid #111827; }
          .manager-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; margin-top: 28px; font-size: 11px; }
          .manager-signature { text-align: center; }
          .manager-signature-line { height: 34px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 8px; }
          .manager-signature-title { font-weight: 700; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .report-page { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="report-page">
        <h1 class="report-title">รายงาน ${escapeHtml(event.title)}</h1>
        <div class="report-subtitle">(${escapeHtml(fmtDate(event.start_date))} - ${escapeHtml(fmtDate(event.end_date))})</div>
        <table>
          <colgroup>
            <col class="col-no" />
            <col class="employee-name" />
            ${dates.map(() => `<col /><col />`).join("")}
            <col class="signature-head" />
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2">#</th>
              <th rowspan="2">รายชื่อ</th>
              ${dates.map((date) => `<th colspan="2" class="date-head">${escapeHtml(weekdayLabel(date))}<br>${escapeHtml(shortPrintDate(date))}</th>`).join("")}
              <th rowspan="2" class="signature-head">ลงชื่อ</th>
            </tr>
            <tr>
              ${dates.map(() => `<th class="time-head">Check In</th><th class="time-head">Check Out</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${emptyColspan}">ยังไม่มีข้อมูลลงเวลา</td></tr>`}
          </tbody>
        </table>
        <div class="manager-signatures">
          <div class="manager-signature">
            <div class="manager-signature-line">ลงชื่อ ...............................................................</div>
            <div class="manager-signature-title">ผจก.ฝ่ายการตลาดและขาย</div>
          </div>
          <div class="manager-signature">
            <div class="manager-signature-line">ลงชื่อ ...............................................................</div>
            <div class="manager-signature-title">ผจก.ฝ่ายทั่วไป</div>
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

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime24(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isImageAttachment(file: EventAttachment) {
  return file.mime_type.startsWith("image/");
}

function externalParticipantName(participant: NonNullable<WorkEvent["external_participants"]>[number]) {
  return participant.full_name.trim();
}

function normalizeExternalParticipantNames(names: string[]) {
  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
}

function eventParticipantCount(event?: WorkEvent | null) {
  return (event?.participants.length ?? 0) + (event?.external_participants?.length ?? 0);
}

function eventParticipantOptions(event?: WorkEvent | null) {
  return [
    ...(event?.participants ?? []).map((participant) => ({
      key: `user:${participant.id}`,
      label: `${participant.full_name} / ${participant.employee_code}`,
    })),
    ...(event?.external_participants ?? []).map((participant) => ({
      key: `external:${participant.id}`,
      label: `${participant.full_name} / ${participant.department || "บุคคลอื่นๆ"}`,
    })),
  ];
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
  onCreateManualAttendance,
  onDeleteAttendance,
  onDeleteEvent,
  onRefreshParticipants,
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
  onCreate: (payload: { title: string; description: string; start_date: string; end_date: string; lead_ids: number[]; participant_ids: number[]; external_participant_names: string[] }) => void;
  onSaveParticipants: (ids: number[], externalParticipantNames: string[]) => void;
  onOpenParticipants: (event: WorkEvent) => void;
  onCreateManualAttendance: (payload: { userId?: number; externalParticipantId?: number; eventDate: string; checkInTime: string; checkOutTime: string }) => void;
  onDeleteAttendance: (logId: number) => Promise<void>;
  onDeleteEvent: (eventId: number) => Promise<void>;
  onRefreshParticipants: () => Promise<void>;
  onReviewAttendance: (logId: number, action: "approve" | "reject") => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [externalParticipantNames, setExternalParticipantNames] = useState<string[]>([]);
  const [externalParticipantInput, setExternalParticipantInput] = useState("");
  const [previewFile, setPreviewFile] = useState<EventAttachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventAttendance | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<WorkEvent | null>(null);
  const [manualParticipantKey, setManualParticipantKey] = useState("");
  const [manualDate, setManualDate] = useState(todayIso());
  const [manualCheckInTime, setManualCheckInTime] = useState("");
  const [manualCheckOutTime, setManualCheckOutTime] = useState("");

  useEffect(() => {
    if (mode !== "create") return;
    setSelectedIds(new Set());
    setExternalParticipantNames([]);
    setExternalParticipantInput("");
  }, [mode]);

  useEffect(() => {
    if (mode !== "participants" || !event) return;
    setSelectedIds(new Set(event.participants.map((participant) => participant.id)));
    setExternalParticipantNames(normalizeExternalParticipantNames((event.external_participants ?? []).map(externalParticipantName)));
    setExternalParticipantInput("");
  }, [event, mode]);

  useEffect(() => {
    if (mode !== "detail" || !event) return;
    setManualDate(toDateInputValue(event.start_date));
    setManualParticipantKey(eventParticipantOptions(event)[0]?.key ?? "");
    setManualCheckInTime("");
    setManualCheckOutTime("");
  }, [event, mode]);

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);

    api.get(previewFile.url, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setPreviewUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setPreviewError(getErrorMessage(err, "โหลดรูปไม่สำเร็จ"));
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewFile]);

  const isCreate = mode === "create";
  const isDetail = mode === "detail";
  const titleText = isCreate ? "สร้าง Event" : isDetail ? "รายละเอียด Event" : "เลือกสมาชิกเข้าร่วม Event";
  const showManualAttendanceForm = isDetail && event && canInputEventAttendance(user?.role);
  const externalCount = isDetail ? (event?.external_participants?.length ?? 0) : externalParticipantNames.length;
  const totalParticipantCount = isDetail ? eventParticipantCount(event) : selectedIds.size + externalParticipantNames.length;
  const manualParticipantOptions = eventParticipantOptions(event);

  const addExternalParticipant = () => {
    const name = externalParticipantInput.trim();
    if (!name) return toast.error("กรุณากรอกชื่อ-นามสกุลบุคคลอื่น");
    setExternalParticipantNames((prev) => normalizeExternalParticipantNames([...prev, name]));
    setExternalParticipantInput("");
  };

  const submit = () => {
    if (isCreate) {
      if (!title.trim()) return toast.error("กรุณาระบุชื่อ Event");
      if (selectedIds.size === 0 && externalParticipantNames.length === 0) return toast.error("กรุณาเลือกหรือเพิ่มผู้เข้าร่วม Event อย่างน้อย 1 คน");
      if (endDate < startDate) return toast.error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น");
      const participantIds = Array.from(selectedIds);
      onCreate({
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        lead_ids: participantIds,
        participant_ids: participantIds,
        external_participant_names: externalParticipantNames,
      });
      return;
    }
    onSaveParticipants(Array.from(selectedIds), externalParticipantNames);
  };

  const submitManualAttendance = () => {
    if (!manualParticipantKey) return toast.error("กรุณาเลือกผู้เข้าร่วม");
    if (!manualDate) return toast.error("กรุณาระบุวันที่");
    if (event && (manualDate < toDateInputValue(event.start_date) || manualDate > toDateInputValue(event.end_date))) {
      return toast.error("วันที่ต้องอยู่ในช่วง Event");
    }
    if (!manualCheckInTime) return toast.error("กรุณาระบุเวลาเข้า");
    if (!manualCheckOutTime) return toast.error("กรุณาระบุเวลาออก");
    if (!isValidTime24(manualCheckInTime) || !isValidTime24(manualCheckOutTime)) {
      return toast.error("กรุณาระบุเวลาเป็นรูปแบบ 24 ชั่วโมง เช่น 08:00 หรือ 17:30");
    }
    if (manualCheckOutTime <= manualCheckInTime) return toast.error("เวลาออกต้องมากกว่าเวลาเข้า");

    const [participantType, participantIdValue] = manualParticipantKey.split(":");
    const participantId = Number(participantIdValue);
    if (!Number.isInteger(participantId) || participantId <= 0) return toast.error("ผู้เข้าร่วมไม่ถูกต้อง");

    onCreateManualAttendance({
      userId: participantType === "user" ? participantId : undefined,
      externalParticipantId: participantType === "external" ? participantId : undefined,
      eventDate: manualDate,
      checkInTime: manualCheckInTime,
      checkOutTime: manualCheckOutTime,
    });
  };

  const confirmDeleteAttendance = async () => {
    if (!deleteTarget?.id) return;
    await onDeleteAttendance(deleteTarget.id);
    setDeleteTarget(null);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    await onDeleteEvent(deleteEventTarget.id);
    setDeleteEventTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{titleText}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {isCreate ? "เลือกช่วงเวลาและผู้เข้าร่วม Event" : event?.title}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-500">ผู้เข้าร่วม Event</label>
                  <span className="text-xs text-gray-400">{selectedIds.size} คน</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {leads.length === 0 ? (
                    <p className="text-sm text-gray-400 p-2">ไม่พบพนักงานที่เลือกได้</p>
                  ) : leads.map((lead) => {
                    const checked = selectedIds.has(lead.id);
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
                            setSelectedIds((prev) => {
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
                          <p className="text-xs text-gray-400 truncate">{lead.department} / {lead.employee_code}</p>
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
                  <p className="text-sm font-medium text-gray-800">{totalParticipantCount} คน</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">รายชื่อผู้เข้าร่วม</p>
                  <span className="text-xs text-gray-400">{totalParticipantCount} คน</span>
                </div>
                {totalParticipantCount === 0 ? (
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
                    {event?.external_participants?.map((participant, index) => (
                      <div key={`${participant.id ?? "external"}-${index}-${participant.full_name}`} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-sky-50 text-sky-700">
                          {participant.full_name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{participant.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{participant.department || "บุคคลอื่นๆ"}</p>
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
                {showManualAttendanceForm && (
                  <div className="border border-gray-100 rounded-xl p-3 mb-3 space-y-3 bg-slate-50/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">ผู้เข้าร่วม</label>
                        <select
                          value={manualParticipantKey}
                          onChange={(e) => setManualParticipantKey(e.target.value)}
                          disabled={saving || manualParticipantOptions.length === 0}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                        >
                          {manualParticipantOptions.length === 0 ? (
                            <option value="">ยังไม่มีผู้เข้าร่วม</option>
                          ) : (
                            manualParticipantOptions.map((participant) => (
                              <option key={participant.key} value={participant.key}>
                                {participant.label}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">วันที่</label>
                        <input
                          type="date"
                          value={manualDate}
                          min={toDateInputValue(event?.start_date)}
                          max={toDateInputValue(event?.end_date)}
                          onChange={(e) => setManualDate(e.target.value)}
                          disabled={saving}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">เวลาเข้า</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="08:00"
                          maxLength={5}
                          value={manualCheckInTime}
                          onChange={(e) => setManualCheckInTime(normalizeTimeInput(e.target.value))}
                          disabled={saving}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">เวลาออก</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="17:00"
                          maxLength={5}
                          value={manualCheckOutTime}
                          onChange={(e) => setManualCheckOutTime(normalizeTimeInput(e.target.value))}
                          disabled={saving}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={submitManualAttendance}
                        disabled={saving || manualParticipantOptions.length === 0}
                        className="px-4 py-2 text-sm rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        บันทึกเวลา
                      </button>
                    </div>
                  </div>
                )}
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
                                  isImageAttachment(file) ? (
                                    <button
                                      key={file.id}
                                      type="button"
                                      onClick={() => setPreviewFile(file)}
                                      className="text-xs text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
                                    >
                                      {file.original_name}
                                    </button>
                                  ) : (
                                    <a key={file.id} href={file.url} target="_blank" className="text-xs text-indigo-600 hover:text-indigo-800" rel="noreferrer">
                                      {file.original_name}
                                    </a>
                                  )
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
                        {item.id && canInputEventAttendance(user?.role) && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ลบ
                            </button>
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
                  <p className="font-medium text-gray-800">{totalParticipantCount} คน</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">รีเฟรชเพื่อดึงรายชื่อพนักงานที่เพิ่มใหม่ล่าสุด</p>
                <button
                  type="button"
                  onClick={onRefreshParticipants}
                  disabled={saving || teamLoading}
                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {teamLoading ? "กำลังรีเฟรช..." : "รีเฟรชรายชื่อ"}
                </button>
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
              <div className="border border-gray-100 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">บุคคลอื่นๆ</p>
                    <p className="text-xs text-gray-400 mt-0.5">กรอกชื่อ-นามสกุลจากแผนกอื่น</p>
                  </div>
                  <span className="text-xs text-gray-400">{externalCount} คน</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={externalParticipantInput}
                    onChange={(e) => setExternalParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addExternalParticipant();
                      }
                    }}
                    disabled={saving}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                    placeholder="ชื่อ-นามสกุล"
                  />
                  <button
                    type="button"
                    onClick={addExternalParticipant}
                    disabled={saving}
                    className="px-4 py-2 text-sm border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    เพิ่มบุคคลอื่นๆ
                  </button>
                </div>
                {externalParticipantNames.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {externalParticipantNames.map((name) => (
                      <div key={name} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-gray-800 truncate">{name}</span>
                        <button
                          type="button"
                          onClick={() => setExternalParticipantNames((prev) => prev.filter((item) => item !== name))}
                          disabled={saving}
                          className="text-xs text-red-500 hover:text-red-600 disabled:opacity-40"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {user?.role === "lead" && !(event?.lead_ids ?? [event?.lead_id]).includes(user.id) && (
                <p className="text-xs text-amber-600">Event นี้ไม่ได้ assign ให้ Lead คนนี้ จึงไม่สามารถแก้ไขรายชื่อได้</p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {isDetail && event && canCreateEvent(user?.role) ? (
            <button
              type="button"
              onClick={() => setDeleteEventTarget(event)}
              disabled={saving}
              className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ลบ Event
            </button>
          ) : <span />}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium">
              ยกเลิก
            </button>
            {isDetail && event ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenParticipants(event)}
                  disabled={saving}
                  className="px-4 py-2.5 text-sm text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  เพิ่มบุคคลอื่นๆ
                </button>
                <button
                  onClick={() => onOpenParticipants(event)}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  เลือกคนเข้า Event
                </button>
              </>
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
      {deleteEventTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => !saving && setDeleteEventTarget(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
                  !
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">ลบ Event</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ข้อมูล Event และรีพอร์ตเวลาที่เกี่ยวข้องจะถูกลบ</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                ต้องการลบ <span className="font-semibold text-gray-900">{deleteEventTarget.title}</span> ใช่หรือไม่?
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">ช่วงเวลา</span>
                  <span className="font-medium text-gray-900">
                    {fmtDate(deleteEventTarget.start_date)} - {fmtDate(deleteEventTarget.end_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">ผู้เข้าร่วม</span>
                  <span className="font-medium text-gray-900">{eventParticipantCount(deleteEventTarget)} คน</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">รีพอร์ตเวลา</span>
                  <span className="font-medium text-gray-900">{attendance.length} รายการ</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteEventTarget(null)}
                disabled={saving}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                disabled={saving}
                className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังลบ...
                  </>
                ) : "ลบ Event"}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewFile && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">{previewFile.original_name}</p>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center"
                aria-label="ปิด"
              >
                x
              </button>
            </div>
            <div className="bg-gray-50 p-4 overflow-auto flex-1 flex items-center justify-center">
              {previewLoading ? (
                <div className="text-sm text-gray-400 py-20">กำลังโหลดรูป...</div>
              ) : previewError ? (
                <div className="text-sm text-red-500 py-20">{previewError}</div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={previewFile.original_name}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-sm"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => !saving && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
                  !
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">ลบบันทึกเวลา Event</h3>
                  <p className="text-xs text-gray-400 mt-0.5">รายการนี้จะถูกลบออกจากรีพอร์ตเวลา</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                ต้องการลบบันทึกเวลาของ <span className="font-semibold text-gray-900">{deleteTarget.full_name ?? "-"}</span> ใช่หรือไม่?
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">วันที่</span>
                  <span className="font-medium text-gray-900">{fmtDate(deleteTarget.event_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">เวลา</span>
                  <span className="font-medium text-gray-900">
                    {deleteTarget.check_in_time?.slice(0, 5) ?? "-"} - {deleteTarget.check_out_time?.slice(0, 5) ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteAttendance}
                disabled={saving}
                className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังลบ...
                  </>
                ) : "ลบบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [deleteEventTarget, setDeleteEventTarget] = useState<WorkEvent | null>(null);

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
    const currentEvent = events.find((item) => item.id === event.id) ?? event;
    setSelectedEvent(currentEvent);
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

  const refreshParticipantList = async () => {
    if (!selectedEvent) return;
    setTeamLoading(true);
    try {
      setTeam(await getLeadTeam(selectedEvent.id));
      toast.success("รีเฟรชรายชื่อเรียบร้อย");
    } catch (err) {
      toast.error(getErrorMessage(err, "รีเฟรชรายชื่อไม่สำเร็จ"));
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

  const handleCreateManualAttendance = async (payload: { userId?: number; externalParticipantId?: number; eventDate: string; checkInTime: string; checkOutTime: string }) => {
    if (!selectedEvent) return;
    try {
      setSaving(true);
      const created = await createManualEventAttendance({
        eventId: selectedEvent.id,
        ...payload,
      });
      setAttendance((prev) => {
        const matchedIndex = prev.findIndex((item) =>
          (created.id && item.id === created.id) ||
          (!!created.user_id && item.user_id === created.user_id && item.event_date === created.event_date) ||
          (!!created.external_participant_id && item.external_participant_id === created.external_participant_id && item.event_date === created.event_date)
        );
        if (matchedIndex === -1) return [created, ...prev];
        return prev.map((item, index) => index === matchedIndex ? { ...item, ...created } : item);
      });
      toast.success("บันทึกเวลา Event เรียบร้อย");
    } catch (err) {
      toast.error(getErrorMessage(err, "บันทึกเวลา Event ไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttendance = async (logId: number) => {
    try {
      setSaving(true);
      await deleteEventAttendance(logId);
      setAttendance((prev) => prev.filter((item) => item.id !== logId));
      toast.success("ลบบันทึกเวลา Event เรียบร้อย");
    } catch (err) {
      toast.error(getErrorMessage(err, "ลบบันทึกเวลา Event ไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      setSaving(true);
      await deleteEvent(eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      toast.success("ลบ Event เรียบร้อย");
      setDeleteEventTarget(null);
      closeModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "ลบ Event ไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    await handleDeleteEvent(deleteEventTarget.id);
  };

  const closeModal = (force = false) => {
    if (saving && !force) return;
    setModalMode(null);
    setSelectedEvent(null);
    setTeam([]);
  };

  const handleCreate = async (payload: { title: string; description: string; start_date: string; end_date: string; lead_ids: number[]; participant_ids: number[]; external_participant_names: string[] }) => {
    try {
      setSaving(true);
      const created = await createEvent(payload);
      const saved = await updateEventParticipants(created.id, payload.participant_ids, payload.external_participant_names);
      setEvents((prev) => [saved, ...prev]);
      setSelectedEvent(saved);
      toast.success("สร้าง Event เรียบร้อย");
      closeModal(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "สร้าง Event ไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveParticipants = async (ids: number[], externalParticipantNames: string[]) => {
    if (!selectedEvent) return;
    try {
      setSaving(true);
      const updated = await updateEventParticipants(selectedEvent.id, ids, externalParticipantNames);
      setEvents((prev) => prev.map((event) => event.id === updated.id ? updated : event));
      setSelectedEvent(updated);
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
            Manager/Assist Manager สร้าง Event และเลือกผู้เข้าร่วมได้ทันที
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
                  const externalNames = (event.external_participants ?? []).map(externalParticipantName);
                  const participantNames = [...event.participants.map((participant) => participant.full_name), ...externalNames];
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
                          <span className="text-sm font-semibold text-gray-800">{eventParticipantCount(event)}</span>
                          <span className="text-xs text-gray-400">คน</span>
                        </div>
                        <p className="text-xs text-gray-400 max-w-[220px] truncate">
                          {participantNames.join(", ") || "ยังไม่ได้เลือก"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          {canCreateEvent(user?.role) && (
                            <button
                              type="button"
                              onClick={() => setDeleteEventTarget(event)}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              ลบ
                            </button>
                          )}
                          <button
                            onClick={() => openParticipantModal(event)}
                            disabled={!canEditParticipants || saving}
                            className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            เลือกคนเข้า Event
                          </button>
                        </div>
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
          leads={leads}
          team={team}
          attendance={attendance}
          teamLoading={teamLoading}
          saving={saving}
          onClose={closeModal}
          onCreate={handleCreate}
          onSaveParticipants={handleSaveParticipants}
          onOpenParticipants={openParticipantModal}
          onCreateManualAttendance={handleCreateManualAttendance}
          onDeleteAttendance={handleDeleteAttendance}
          onDeleteEvent={handleDeleteEvent}
          onRefreshParticipants={refreshParticipantList}
          onReviewAttendance={handleReviewAttendance}
        />
      )}
      {deleteEventTarget && !modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => !saving && setDeleteEventTarget(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
                  !
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">ลบ Event</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ข้อมูล Event และรีพอร์ตเวลาที่เกี่ยวข้องจะถูกลบ</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                ต้องการลบ <span className="font-semibold text-gray-900">{deleteEventTarget.title}</span> ใช่หรือไม่?
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">ช่วงเวลา</span>
                  <span className="font-medium text-gray-900">
                    {fmtDate(deleteEventTarget.start_date)} - {fmtDate(deleteEventTarget.end_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">ผู้เข้าร่วม</span>
                  <span className="font-medium text-gray-900">{eventParticipantCount(deleteEventTarget)} คน</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteEventTarget(null)}
                disabled={saving}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                disabled={saving}
                className="px-5 py-2.5 text-sm text-white rounded-xl font-medium bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังลบ...
                  </>
                ) : "ลบ Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
