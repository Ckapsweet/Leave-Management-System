// src/components/__tests__/LeaveRequestModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import dayjs from "dayjs"; // ✅ import แทน require
import { LeaveRequestModal } from "../Leaverequestmodal";

// ── Mock MUI TimeField (ไม่ต้องการ MUI ใน unit test) ──────────
vi.mock("@mui/x-date-pickers/TimeField", () => ({
  TimeField: ({ onChange, value, slotProps }: any) => (
    <input
      data-testid={slotProps?.textField?.error ? "time-field-error" : "time-field"}
      type="time"
      value={value ? value.format("HH:mm") : ""}
      onChange={(e) => {
        onChange(dayjs(`2026-01-01 ${e.target.value}`)); // ✅ ใช้ dayjs ที่ import มา
      }}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: any) => children,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

// ── Mock toast ────────────────────────────────────────────────
vi.mock("../Toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────
const mockLeaveTypes = [
  { id: 1, name: "ลาป่วย",    description: "",  max_days: 30 },
  { id: 2, name: "ลากิจ",     description: "",  max_days: 10 },
  { id: 3, name: "ลาพักร้อน", description: "",  max_days: 15 },
];

const defaultProps = {
  leaveTypes: mockLeaveTypes,
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
  isLoading: false,
};

// ── Helpers ───────────────────────────────────────────────────
function renderModal(props = {}) {
  return render(<LeaveRequestModal {...defaultProps} {...props} />);
}

// ── Tests ─────────────────────────────────────────────────────

describe("LeaveRequestModal — การ render", () => {
  beforeEach(() => vi.clearAllMocks());

  it("แสดง header และ title ถูกต้อง", () => {
    renderModal();
    expect(screen.getByText("ยื่นคำขอลา")).toBeInTheDocument();
    expect(screen.getByText("กรอกข้อมูลการลาให้ครบถ้วน")).toBeInTheDocument();
  });

  it("แสดงปุ่ม toggle ลาเป็นวัน / ลาเป็นชั่วโมง", () => {
    renderModal();
    expect(screen.getByText("ลาเป็นวัน")).toBeInTheDocument();
    expect(screen.getByText("ลาเป็นชั่วโมง")).toBeInTheDocument();
  });

  it("แสดงประเภทการลาทั้งหมด", () => {
    renderModal();
    expect(screen.getByText(/ลาป่วย/)).toBeInTheDocument();
    expect(screen.getByText(/ลากิจ/)).toBeInTheDocument();
    expect(screen.getByText(/ลาพักร้อน/)).toBeInTheDocument();
  });

  it("แสดง field วันที่เริ่มลา และวันที่สิ้นสุด (mode วัน)", () => {
    renderModal();
    expect(screen.getByText("วันที่เริ่มลา")).toBeInTheDocument();
    expect(screen.getByText("วันที่สิ้นสุด")).toBeInTheDocument();
  });

  it("แสดง textarea เหตุผล", () => {
    renderModal();
    expect(screen.getByPlaceholderText("ระบุเหตุผลการลา...")).toBeInTheDocument();
  });

  it("แสดงปุ่มยกเลิก และส่งคำขอลา", () => {
    renderModal();
    expect(screen.getByText("ยกเลิก")).toBeInTheDocument();
    expect(screen.getByText("ส่งคำขอลา")).toBeInTheDocument();
  });
});

describe("LeaveRequestModal — ปุ่มปิด", () => {
  beforeEach(() => vi.clearAllMocks());

  it("กดปุ่ม × แล้วเรียก onClose", async () => {
    renderModal();
    await userEvent.click(screen.getByText("×"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("กด Backdrop แล้วเรียก onClose", async () => {
    const { container } = renderModal();
    const backdrop = container.querySelector(".absolute.inset-0") as HTMLElement;
    await userEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("กด Escape แล้วเรียก onClose", async () => {
    renderModal();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("กดปุ่มยกเลิกแล้วเรียก onClose", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ยกเลิก"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("LeaveRequestModal — validation errors", () => {
  beforeEach(() => vi.clearAllMocks());

  it("แสดง error ทุก field เมื่อกด submit โดยไม่กรอก", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ส่งคำขอลา"));
    expect(await screen.findByText("กรุณาเลือกประเภทการลา")).toBeInTheDocument();
    expect(screen.getByText("กรุณาระบุวันที่")).toBeInTheDocument();
    expect(screen.getByText("กรุณาระบุวันสิ้นสุด")).toBeInTheDocument();
    expect(screen.getByText("กรุณาระบุเหตุผล")).toBeInTheDocument();
  });

  it("ไม่เรียก onSubmit เมื่อ validate ไม่ผ่าน", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ส่งคำขอลา"));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("error หายเมื่อกรอกข้อมูลครบหลัง submit ครั้งแรก", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ส่งคำขอลา"));
    expect(await screen.findByText("กรุณาระบุเหตุผล")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("ระบุเหตุผลการลา..."), "ป่วย");
    await waitFor(() => {
      expect(screen.queryByText("กรุณาระบุเหตุผล")).not.toBeInTheDocument();
    });
  });
});

describe("LeaveRequestModal — เลือกประเภทการลา", () => {
  beforeEach(() => vi.clearAllMocks());

  it("เลือกประเภทการลาแล้ว error หาย", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ส่งคำขอลา"));
    expect(await screen.findByText("กรุณาเลือกประเภทการลา")).toBeInTheDocument();

    await userEvent.click(screen.getByText(/ลาป่วย/));
    await waitFor(() => {
      expect(screen.queryByText("กรุณาเลือกประเภทการลา")).not.toBeInTheDocument();
    });
  });
});

describe("LeaveRequestModal — toggle ลาเป็นวัน / ชั่วโมง", () => {
  beforeEach(() => vi.clearAllMocks());

  it("switch ไป ลาเป็นชั่วโมง แสดง field เวลาเริ่ม/สิ้นสุด", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ลาเป็นชั่วโมง"));
    expect(await screen.findByText("เวลาเริ่ม")).toBeInTheDocument();
    expect(screen.getByText("เวลาสิ้นสุด")).toBeInTheDocument();
  });

  it("switch ไป ลาเป็นชั่วโมง ซ่อน field วันที่สิ้นสุด", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ลาเป็นชั่วโมง"));
    await waitFor(() => {
      expect(screen.queryByText("วันที่สิ้นสุด")).not.toBeInTheDocument();
    });
  });

  it("switch กลับ ลาเป็นวัน แสดง field วันที่สิ้นสุด", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ลาเป็นชั่วโมง"));
    await userEvent.click(screen.getByText("ลาเป็นวัน"));
    expect(await screen.findByText("วันที่สิ้นสุด")).toBeInTheDocument();
  });

  it("validate error ลาชั่วโมง — ไม่ระบุเวลา", async () => {
    renderModal();
    await userEvent.click(screen.getByText("ลาเป็นชั่วโมง"));
    await userEvent.click(screen.getByText("ส่งคำขอลา"));
    expect(await screen.findByText("กรุณาระบุเวลาเริ่ม")).toBeInTheDocument();
    expect(screen.getByText("กรุณาระบุเวลาสิ้นสุด")).toBeInTheDocument();
  });
});

describe("LeaveRequestModal — SummaryPill", () => {
  beforeEach(() => vi.clearAllMocks());

  it("แสดงจำนวนวันเมื่อเลือกวันครบ", async () => {
    renderModal();
    const dateInputs = screen.getAllByDisplayValue("");
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-03" } });
    expect(await screen.findByText("3 วัน")).toBeInTheDocument();
  });
});

describe("LeaveRequestModal — submit สำเร็จ", () => {
  beforeEach(() => vi.clearAllMocks());

  it("เรียก onSubmit พร้อม form data ที่ถูกต้อง", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });

    await userEvent.click(screen.getByText(/ลาป่วย/));
    const dateInputs = screen.getAllByDisplayValue("");
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-03" } });
    await userEvent.type(screen.getByPlaceholderText("ระบุเหตุผลการลา..."), "ป่วยไข้");
    await userEvent.click(screen.getByText("ส่งคำขอลา"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          leave_type_id: 1,
          leave_unit: "day",
          start_date: "2026-03-01",
          end_date: "2026-03-03",
          reason: "ป่วยไข้",
        })
      );
    });
  });
});

describe("LeaveRequestModal — isLoading state", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ปุ่มทั้งสอง disable เมื่อ isLoading=true", () => {
    renderModal({ isLoading: true });
    expect(screen.getByText("กำลังส่ง...").closest("button")).toBeDisabled();
    expect(screen.getByText("ยกเลิก")).toBeDisabled();
  });

  it("แสดงข้อความ 'กำลังส่ง...' เมื่อ isLoading=true", () => {
    renderModal({ isLoading: true });
    expect(screen.getByText("กำลังส่ง...")).toBeInTheDocument();
  });

  it("ปุ่ม enable เมื่อ isLoading=false", () => {
    renderModal({ isLoading: false });
    expect(screen.getByText("ส่งคำขอลา").closest("button")).not.toBeDisabled();
    expect(screen.getByText("ยกเลิก")).not.toBeDisabled();
  });
});