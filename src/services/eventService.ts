import api from "./api";
import type { Employee } from "../components/adminHelpers";

export interface EventParticipant extends Employee {
  selected_by_lead_id?: number | null;
  selected_by_lead_name?: string | null;
  selected_at?: string | null;
}

export interface ExternalEventParticipant {
  id?: number;
  full_name: string;
  department?: string | null;
  created_at?: string | null;
}

export interface EventTeamMember extends Employee {
  lead_id?: number;
  lead_name?: string;
}

export interface WorkEvent {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_by: number;
  creator_name?: string | null;
  creator_role?: string | null;
  lead_id: number;
  lead_ids?: number[];
  leads?: Employee[];
  lead_name?: string | null;
  lead_employee_code?: string | null;
  department: string | null;
  created_at: string;
  participants: EventParticipant[];
  external_participants?: ExternalEventParticipant[];
  attendance?: EventAttendance | null;
  attendance_days?: EventAttendance[];
}

export interface EventAttendance {
  id?: number;
  event_id: number;
  user_id?: number;
  external_participant_id?: number | null;
  event_date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status?: "draft" | "pending" | "approved" | "rejected";
  approval_comment?: string | null;
  full_name?: string;
  english_name?: string | null;
  employee_code?: string;
  department?: string;
  approver_name?: string | null;
  attachments?: { id: number; evidence_type?: "check_in" | "check_out"; original_name: string; mime_type: string; size: number; url: string }[];
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  lead_ids: number[];
  participant_ids?: number[];
  external_participant_names?: string[];
}

export async function getEvents(): Promise<WorkEvent[]> {
  const res = await api.get("/api/events");
  return res.data;
}

export async function getEventLeads(): Promise<Employee[]> {
  const res = await api.get("/api/events/leads");
  return res.data;
}

export async function getLeadTeam(eventId: number): Promise<EventTeamMember[]> {
  const res = await api.get(`/api/events/${eventId}/team`);
  return res.data;
}

export async function createEvent(payload: CreateEventPayload): Promise<WorkEvent> {
  const res = await api.post("/api/events", payload);
  return res.data;
}

export async function updateEventParticipants(eventId: number, participantIds: number[], externalParticipantNames: string[] = []): Promise<WorkEvent> {
  const res = await api.patch(`/api/events/${eventId}/participants`, {
    participant_ids: participantIds,
    external_participant_names: externalParticipantNames,
  });
  return res.data;
}

export async function deleteEvent(eventId: number): Promise<{ id: number }> {
  const res = await api.delete(`/api/events/${eventId}`);
  return res.data;
}

export async function getMyEvents(): Promise<WorkEvent[]> {
  const res = await api.get("/api/events/my");
  return res.data;
}

export function isWorkEventActive(event: WorkEvent, now: Date | number = Date.now()): boolean {
  const endDate = String(event.end_date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return true;

  const finalDay = event.attendance_days?.find((day) => String(day.event_date).slice(0, 10) === endDate);
  const endTime = finalDay?.check_out_time?.slice(0, 8) || "23:59:59";
  const normalizedTime = /^\d{2}:\d{2}$/.test(endTime) ? `${endTime}:00` : endTime;
  const expiresAt = Date.parse(`${endDate}T${normalizedTime}+07:00`);
  const currentTime = now instanceof Date ? now.getTime() : now;
  return !Number.isFinite(expiresAt) || currentTime <= expiresAt;
}

export async function submitEventAttendance(payload: {
  eventId: number;
  eventDate: string;
  checkInTime: string;
  checkOutTime: string;
  checkInEvidence: File;
  checkOutEvidence: File;
}): Promise<EventAttendance> {
  const formData = new FormData();
  formData.append("event_date", payload.eventDate);
  formData.append("check_in_time", payload.checkInTime);
  formData.append("check_out_time", payload.checkOutTime);
  formData.append("check_in_evidence", payload.checkInEvidence);
  formData.append("check_out_evidence", payload.checkOutEvidence);
  const res = await api.post(`/api/events/${payload.eventId}/attendance`, formData);
  return res.data;
}

export async function getEventAttendance(eventId: number): Promise<EventAttendance[]> {
  const res = await api.get(`/api/events/${eventId}/attendance`);
  return res.data;
}

export async function createManualEventAttendance(payload: {
  eventId: number;
  userId?: number;
  externalParticipantId?: number;
  eventDate: string;
  checkInTime: string;
  checkOutTime: string;
}): Promise<EventAttendance> {
  const res = await api.post(`/api/events/${payload.eventId}/attendance/manual`, {
    user_id: payload.userId,
    external_participant_id: payload.externalParticipantId,
    event_date: payload.eventDate,
    check_in_time: payload.checkInTime,
    check_out_time: payload.checkOutTime,
  });
  return res.data;
}

export async function deleteEventAttendance(logId: number): Promise<{ id: number }> {
  const res = await api.delete(`/api/events/attendance/${logId}`);
  return res.data;
}

export async function reviewEventAttendance(logId: number, action: "approve" | "reject", comment?: string): Promise<EventAttendance> {
  const res = await api.patch(`/api/events/attendance/${logId}/${action}`, { comment });
  return res.data;
}
