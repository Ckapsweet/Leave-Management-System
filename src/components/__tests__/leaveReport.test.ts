import { describe, expect, it } from "vitest";
import { buildLeaveReportHtml } from "../leaveReport";
import type { LeaveRequest } from "../../services/leaveService";

const request = {
  id: 1,
  user_id: 5,
  leave_type_id: 2,
  start_date: "2026-10-12",
  end_date: "2026-10-12",
  leave_unit: "half_day",
  request_type: "leave",
  total_days: 0.5,
  reason: "<b>ธุระ</b>",
  status: "approved",
  created_at: "2026-10-01",
  leave_type: { id: 2, name: "ลากิจ" },
  user: { id: 5, full_name: "สมชาย ใจดี", employee_code: "IT-01", department: "IT", role: "user", supervisor_id: null },
} as unknown as LeaveRequest;

describe("buildLeaveReportHtml", () => {
  it("renders one table per day and escapes user text", () => {
    const html = buildLeaveReportHtml([
      { date: "2026-10-12", requests: [request] },
      { date: "2026-10-13", requests: [] },
    ], new Date(2026, 9, 12, 8, 30));

    expect(html.match(/<table>/g)).toHaveLength(2);
    expect(html).toContain("สมชาย ใจดี");
    expect(html).toContain("ลากิจ");
    expect(html).toContain("ครึ่งวัน");
    expect(html).toContain("&lt;b&gt;ธุระ&lt;/b&gt;");
    expect(html).not.toContain("<b>ธุระ</b>");
    expect(html).toContain("ผู้ลาทั้งหมด 1 คน");
    expect(html).toContain("ไม่มีผู้ลา");
  });
});
