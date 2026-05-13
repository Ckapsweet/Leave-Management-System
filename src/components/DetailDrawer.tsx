// components/DetailDrawer.tsx
import { useState } from "react";
import type { LeaveAttachment, LeaveRequest } from "../services/leaveService";
import { formatLeaveDays, formatLeaveHours } from "../services/leaveTime";
import { STATUS_META, TYPE_COLORS, fmtDate, fmtDatetime, avatarColor } from "./adminHelpers";

function formatAttachmentSize(size: number | string | null | undefined) {
  const value = Number(size ?? 0);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
}

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.filter(Boolean)));
}

function getAttachmentPath(url: string) {
  const normalizedUrl = url.replace(/\\/g, "/");
  const cleanPath = normalizedUrl.replace(/^\/+/, "");

  if (cleanPath.includes("uploads/")) {
    return `/${cleanPath.slice(cleanPath.indexOf("uploads/"))}`;
  }

  if (cleanPath.includes("leave-attachments/")) {
    return `/uploads/${cleanPath.slice(cleanPath.indexOf("leave-attachments/"))}`;
  }

  const filename = cleanPath.split("/").filter(Boolean).pop() ?? cleanPath;
  return `/uploads/leave-attachments/${filename}`;
}

function getAttachmentBaseUrl() {
  const envBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!envBase || typeof window === "undefined") return envBase;

  try {
    const apiUrl = new URL(envBase, window.location.origin);
    const pageHost = window.location.hostname;
    const apiHost = apiUrl.hostname;
    const localApi = apiHost === "localhost" || apiHost === "127.0.0.1";
    const localPage = pageHost === "localhost" || pageHost === "127.0.0.1";
    return localApi && !localPage ? "" : envBase;
  } catch {
    return envBase;
  }
}

function resolveAttachmentUrls(url: string) {
  const normalizedUrl = url.replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalizedUrl) || /^data:/i.test(normalizedUrl) || /^blob:/i.test(normalizedUrl)) return [normalizedUrl];

  const base = getAttachmentBaseUrl();
  if (normalizedUrl.startsWith("/api/") || normalizedUrl.startsWith("api/")) {
    const apiPath = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
    return uniqueUrls([
      base ? `${base}${apiPath}` : "",
      apiPath,
    ]);
  }

  const path = getAttachmentPath(normalizedUrl);
  return uniqueUrls([
    base ? `${base}${path}` : "",
    path,
    `/api${path}`,
  ]);
}

function resolveAttachmentUrl(url: string) {
  return resolveAttachmentUrls(url)[0] ?? "";
}

function decodeMojibakeName(name: string) {
  if (!/[à-ÿ]/.test(name)) return name;
  try {
    const bytes = Uint8Array.from(Array.from(name, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded.includes("\uFFFD") ? name : decoded;
  } catch {
    return name;
  }
}

function getAttachments(req: LeaveRequest) {
  const files = req.attachments ?? [];
  const urlFiles: LeaveAttachment[] = (req.attachment_urls ?? []).map((url, index) => ({
    id: `url-${index}`,
    name: `ไฟล์แนบ ${index + 1}`,
    url,
  }));

  return [...files, ...urlFiles]
    .map((file, index) => {
      const url = file.url ?? file.file_url ?? file.download_url ?? file.path ?? "";
      return {
        id: file.id ?? `${url}-${index}`,
        name: decodeMojibakeName(file.original_name ?? file.file_name ?? file.filename ?? file.name ?? `ไฟล์แนบ ${index + 1}`),
        url: url ? resolveAttachmentUrl(url) : "",
        urls: url ? resolveAttachmentUrls(url) : [],
        mimeType: file.mime_type ?? "",
        size: formatAttachmentSize(file.size),
      };
    })
    .filter((file) => file.url);
}

function isImageAttachment(file: { name: string; url: string; mimeType?: string }) {
  if (file.mimeType?.startsWith("image/")) return true;
  const cleanUrl = file.url.split("?")[0].toLowerCase();
  const cleanName = file.name.toLowerCase();
  return /\.(apng|avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(cleanUrl) || /\.(apng|avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(cleanName);
}

interface DetailDrawerProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  canApprove?: boolean; 
}

export function DetailDrawer({ request: req, onClose, onApprove, onReject, canApprove = true }: DetailDrawerProps) {
  const typeColor = TYPE_COLORS[req.leave_type_id] ?? "bg-gray-100 text-gray-600";
  const meta = STATUS_META[req.status];
  const isHourly = req.leave_unit === "hour";
  const ac = avatarColor(req.user?.department);
  const attachments = getAttachments(req);
  const [previewImage, setPreviewImage] = useState<{ name: string; urls: string[]; index: number } | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">คำขอ #{req.id}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Employee */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ac}`}>
              {req.user?.full_name?.slice(0, 2) ?? "??"}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{req.user?.full_name}</p>
              <p className="text-xs text-gray-500">{req.user?.department} · {req.user?.employee_code}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${meta.bg}`}>
            <span className="text-xl">{meta.icon}</span>
            <div>
              <p className={`font-semibold text-sm ${meta.color}`}>{meta.label}</p>
              {req.approved_at && (
                <p className="text-xs text-gray-500">{fmtDatetime(req.approved_at)}</p>
              )}
            </div>
          </div>

          {/* Leave Type */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">ประเภทการลา</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${typeColor}`}>
                {req.leave_type.name}
              </span>
              {isHourly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  ลาชั่วโมง
                </span>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่ลา</span>
              <span className="font-medium text-gray-800">{fmtDate(req.start_date)}</span>
            </div>
            {!isHourly && req.start_date !== req.end_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">ถึงวันที่</span>
                <span className="font-medium text-gray-800">{fmtDate(req.end_date)}</span>
              </div>
            )}
            {isHourly && req.start_time && (
              <div className="flex justify-between">
                <span className="text-gray-500">ช่วงเวลา</span>
                <span className="font-medium text-gray-800">{req.start_time} – {req.end_time} น.</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-gray-500">รวม</span>
              <span className="font-bold text-gray-900">
                {isHourly ? formatLeaveHours(req.total_hours) : formatLeaveDays(req.total_days)}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">เหตุผล</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{req.reason}</p>
          </div>

          {attachments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">ไฟล์แนบ</p>
              <div className="space-y-2">
                {attachments.map((file) => {
                  const image = isImageAttachment(file);
                  const content = (
                    <>
                      <span className="flex items-center gap-2 min-w-0">
                        <svg className="flex-shrink-0 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span className="truncate font-medium text-gray-700">{file.name}</span>
                      </span>
                      <span className="flex-shrink-0 text-xs text-gray-400">{file.size || "เปิดดู"}</span>
                    </>
                  );

                  return image ? (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setPreviewImage({ name: file.name, urls: file.urls.length > 0 ? file.urls : [file.url], index: 0 })}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left text-sm hover:bg-slate-100 transition-colors"
                    >
                      {content}
                    </button>
                  ) : (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm hover:bg-slate-100 transition-colors"
                    >
                      {content}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment */}
          {req.comment && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">หมายเหตุ</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">"{req.comment}"</p>
                {req.approver_name && (
                  <p className="text-xs text-amber-600 mt-1">— {req.approver_name}</p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">ส่งคำขอเมื่อ {fmtDatetime(req.created_at)}</p>
        </div>

        {/* Action buttons */}
        {req.status === "pending" && canApprove && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-2.5 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors"
            >
              อนุมัติ
            </button>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative flex max-h-full max-w-full flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
              <p className="min-w-0 truncate text-sm font-medium text-gray-800">{previewImage.name}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="ปิดรูปภาพ"
              >
                x
              </button>
            </div>
            <div className="flex max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2rem)] items-center justify-center overflow-hidden rounded-xl bg-white shadow-2xl">
              <img
                src={previewImage.urls[previewImage.index]}
                alt={previewImage.name}
                className="block max-h-[calc(100vh-7rem)] max-w-[calc(100vw-2rem)] object-contain"
                onError={() => {
                  setPreviewImage((current) => {
                    if (!current || current.index >= current.urls.length - 1) return current;
                    return { ...current, index: current.index + 1 };
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
