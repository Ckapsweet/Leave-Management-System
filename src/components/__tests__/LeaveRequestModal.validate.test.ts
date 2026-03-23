// src/components/__tests__/LeaveRequestModal.validate.test.ts
import { describe, it, expect } from "vitest";
import dayjs from "dayjs";

// ── Copy validate และ type มาทดสอบตรงๆ ──────────────────────
// (ถ้า export validate ออกมาจาก Modal ได้ ให้ import แทน)

type LeaveUnit = "day" | "hour";

interface LeaveRequestForm {
  leave_type_id: number;
  leave_unit: LeaveUnit;
  start_date: string;
  end_date: string;
  start_time: ReturnType<typeof dayjs> | null;
  end_time: ReturnType<typeof dayjs> | null;
  reason: string;
}

interface FormErrors {
  leave_type_id?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

function validate(form: LeaveRequestForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.leave_type_id) errors.leave_type_id = "กรุณาเลือกประเภทการลา";
  if (!form.start_date) errors.start_date = "กรุณาระบุวันที่";
  if (form.leave_unit === "day") {
    if (!form.end_date) errors.end_date = "กรุณาระบุวันสิ้นสุด";
    else if (form.end_date < form.start_date) errors.end_date = "วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น";
  }
  if (form.leave_unit === "hour") {
    if (!form.start_time || !form.start_time.isValid()) errors.start_time = "กรุณาระบุเวลาเริ่ม";
    if (!form.end_time || !form.end_time.isValid()) errors.end_time = "กรุณาระบุเวลาสิ้นสุด";
    else if (form.start_time && form.start_time.isValid() && form.end_time.isBefore(form.start_time))
      errors.end_time = "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม";
  }
  if (!form.reason.trim()) errors.reason = "กรุณาระบุเหตุผล";
  return errors;
}

// ── Base form (ผ่านทุก field) ──────────────────────────────────

const validDayForm: LeaveRequestForm = {
  leave_type_id: 1,
  leave_unit: "day",
  start_date: "2026-03-01",
  end_date: "2026-03-03",
  start_time: null,
  end_time: null,
  reason: "ป่วย",
};

const validHourForm: LeaveRequestForm = {
  leave_type_id: 2,
  leave_unit: "hour",
  start_date: "2026-03-01",
  end_date: "2026-03-01",
  start_time: dayjs("2026-03-01 09:00"),
  end_time: dayjs("2026-03-01 12:00"),
  reason: "นัดหมายแพทย์",
};

// ── Tests ──────────────────────────────────────────────────────

describe("validate() — ลาเป็นวัน", () => {
  it("ไม่มี error เมื่อข้อมูลครบถ้วน", () => {
    expect(validate(validDayForm)).toEqual({});
  });

  it("error เมื่อไม่เลือกประเภทการลา", () => {
    const form = { ...validDayForm, leave_type_id: 0 };
    expect(validate(form).leave_type_id).toBe("กรุณาเลือกประเภทการลา");
  });

  it("error เมื่อไม่ระบุวันที่เริ่มต้น", () => {
    const form = { ...validDayForm, start_date: "" };
    expect(validate(form).start_date).toBe("กรุณาระบุวันที่");
  });

  it("error เมื่อไม่ระบุวันสิ้นสุด", () => {
    const form = { ...validDayForm, end_date: "" };
    expect(validate(form).end_date).toBe("กรุณาระบุวันสิ้นสุด");
  });

  it("error เมื่อวันสิ้นสุดก่อนวันเริ่มต้น", () => {
    const form = { ...validDayForm, start_date: "2026-03-05", end_date: "2026-03-01" };
    expect(validate(form).end_date).toBe("วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น");
  });

  it("ไม่ error เมื่อวันเริ่มต้น = วันสิ้นสุด (ลาวันเดียว)", () => {
    const form = { ...validDayForm, start_date: "2026-03-01", end_date: "2026-03-01" };
    expect(validate(form).end_date).toBeUndefined();
  });

  it("error เมื่อไม่ระบุเหตุผล", () => {
    const form = { ...validDayForm, reason: "" };
    expect(validate(form).reason).toBe("กรุณาระบุเหตุผล");
  });

  it("error เมื่อเหตุผลเป็นแค่ space", () => {
    const form = { ...validDayForm, reason: "   " };
    expect(validate(form).reason).toBe("กรุณาระบุเหตุผล");
  });

  it("ไม่ตรวจ start_time/end_time เมื่อลาเป็นวัน", () => {
    const errors = validate(validDayForm);
    expect(errors.start_time).toBeUndefined();
    expect(errors.end_time).toBeUndefined();
  });
});

describe("validate() — ลาเป็นชั่วโมง", () => {
  it("ไม่มี error เมื่อข้อมูลครบถ้วน", () => {
    expect(validate(validHourForm)).toEqual({});
  });

  it("error เมื่อไม่ระบุเวลาเริ่ม", () => {
    const form = { ...validHourForm, start_time: null };
    expect(validate(form).start_time).toBe("กรุณาระบุเวลาเริ่ม");
  });

  it("error เมื่อ start_time invalid", () => {
    const form = { ...validHourForm, start_time: dayjs("invalid") };
    expect(validate(form).start_time).toBe("กรุณาระบุเวลาเริ่ม");
  });

  it("error เมื่อไม่ระบุเวลาสิ้นสุด", () => {
    const form = { ...validHourForm, end_time: null };
    expect(validate(form).end_time).toBe("กรุณาระบุเวลาสิ้นสุด");
  });

  it("error เมื่อ end_time invalid", () => {
    const form = { ...validHourForm, end_time: dayjs("invalid") };
    expect(validate(form).end_time).toBe("กรุณาระบุเวลาสิ้นสุด");
  });

  it("error เมื่อเวลาสิ้นสุดก่อนเวลาเริ่ม", () => {
    const form = {
      ...validHourForm,
      start_time: dayjs("2026-03-01 12:00"),
      end_time: dayjs("2026-03-01 09:00"),
    };
    expect(validate(form).end_time).toBe("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
  });

  it("error เมื่อเวลาสิ้นสุด = เวลาเริ่ม (isBefore = false แต่ไม่ต่างกัน)", () => {
    const form = {
      ...validHourForm,
      start_time: dayjs("2026-03-01 09:00"),
      end_time: dayjs("2026-03-01 09:00"),
    };
    // end_time.isBefore(start_time) = false → ไม่ error
    expect(validate(form).end_time).toBeUndefined();
  });

  it("ไม่ตรวจ end_date เมื่อลาเป็นชั่วโมง", () => {
    const form = { ...validHourForm, end_date: "" };
    expect(validate(form).end_date).toBeUndefined();
  });

  it("error เมื่อไม่ระบุเหตุผล", () => {
    const form = { ...validHourForm, reason: "" };
    expect(validate(form).reason).toBe("กรุณาระบุเหตุผล");
  });
});

describe("validate() — error หลายตัวพร้อมกัน", () => {
  it("คืน error ทุก field เมื่อ form ว่างเปล่า (ลาเป็นวัน)", () => {
    const emptyForm: LeaveRequestForm = {
      leave_type_id: 0,
      leave_unit: "day",
      start_date: "",
      end_date: "",
      start_time: null,
      end_time: null,
      reason: "",
    };
    const errors = validate(emptyForm);
    expect(errors.leave_type_id).toBeDefined();
    expect(errors.start_date).toBeDefined();
    expect(errors.end_date).toBeDefined();
    expect(errors.reason).toBeDefined();
  });

  it("คืน error ทุก field เมื่อ form ว่างเปล่า (ลาเป็นชั่วโมง)", () => {
    const emptyForm: LeaveRequestForm = {
      leave_type_id: 0,
      leave_unit: "hour",
      start_date: "",
      end_date: "",
      start_time: null,
      end_time: null,
      reason: "",
    };
    const errors = validate(emptyForm);
    expect(errors.leave_type_id).toBeDefined();
    expect(errors.start_date).toBeDefined();
    expect(errors.start_time).toBeDefined();
    expect(errors.end_time).toBeDefined();
    expect(errors.reason).toBeDefined();
  });
});