import type { LeaveRequest } from "../services/leaveService";
import { formatLeaveDuration, leaveTypeLabel } from "./leaveDisplay";

export interface LeaveReportDay {
    date: string; // YYYY-MM-DD
    requests: LeaveRequest[];
}

function escapeHtml(value: unknown) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function formatReportDay(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export function buildLeaveReportHtml(days: LeaveReportDay[], printedAt = new Date()) {
    const first = days[0]?.date;
    const last = days[days.length - 1]?.date;
    const range = first && last ? `${formatReportDay(first)} – ${formatReportDay(last)}` : "";
    const total = new Set(days.flatMap((day) => day.requests.map((request) => request.user_id))).size;

    const sections = days.map((day) => {
        const rows = day.requests.length === 0
            ? `<tr><td colspan="7" class="empty">ไม่มีผู้ลา</td></tr>`
            : day.requests.map((request, index) => `
                <tr>
                    <td class="num">${index + 1}</td>
                    <td>${escapeHtml(request.user?.full_name)}</td>
                    <td>${escapeHtml(request.user?.employee_code)}</td>
                    <td>${escapeHtml(request.user?.department)}</td>
                    <td>${escapeHtml(leaveTypeLabel(request))}</td>
                    <td>${escapeHtml(formatLeaveDuration(request).replace(/^\((.*)\)$/, "$1"))}</td>
                    <td>${escapeHtml(request.reason)}</td>
                </tr>`).join("");
        return `
            <section>
                <h2>${escapeHtml(formatReportDay(day.date))} <span>(${day.requests.length} คน)</span></h2>
                <table>
                    <colgroup><col class="c-num" /><col class="c-name" /><col class="c-code" /><col class="c-dept" /><col class="c-type" /><col class="c-dur" /><col /></colgroup>
                    <thead>
                        <tr><th class="num">#</th><th>ชื่อ-นามสกุล</th><th>รหัส</th><th>แผนก</th><th>ประเภท</th><th>ระยะเวลา</th><th>หมายเหตุ</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </section>`;
    }).join("");

    return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>รายงานผู้ลา ${escapeHtml(range)}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: "Sarabun", "Tahoma", sans-serif; color: #111827; margin: 24px; font-size: 13px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #6b7280; margin-bottom: 16px; }
    section { margin-bottom: 18px; break-inside: avoid; }
    h2 { font-size: 15px; margin: 0 0 6px; padding: 6px 8px; background: #eef2ff; border-left: 4px solid #4f46e5; }
    h2 span { font-weight: normal; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .c-num { width: 5%; } .c-name { width: 24%; } .c-code { width: 11%; } .c-dept { width: 12%; } .c-type { width: 17%; } .c-dur { width: 11%; }
    td { word-wrap: break-word; }
    th, td { border: 1px solid #d1d5db; padding: 5px 7px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-weight: 600; }
    .num { width: 32px; text-align: center; }
    .empty { text-align: center; color: #9ca3af; }
    @page { size: A4; margin: 12mm; }
    @media print { body { margin: 0; } }
</style>
</head>
<body>
    <h1>รายงานผู้ลา</h1>
    <div class="meta">ช่วงวันที่ ${escapeHtml(range)} · ผู้ลาทั้งหมด ${total} คน · พิมพ์เมื่อ ${escapeHtml(printedAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }))}</div>
    ${sections}
</body>
</html>`;
}

export function printLeaveReport(days: LeaveReportDay[]) {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return false;
    win.document.open();
    win.document.write(buildLeaveReportHtml(days));
    win.document.close();
    win.focus();
    // รอให้ฟอนต์/เลย์เอาต์พร้อมก่อนเปิดหน้าพิมพ์
    win.setTimeout(() => win.print(), 300);
    return true;
}
