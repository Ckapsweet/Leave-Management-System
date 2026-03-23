// src/components/__tests__/Toast.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ToastContainer, toast } from "../Toast";

// ── Helper ────────────────────────────────────────────────────
// render + เรียก toast แล้วรอ React flush state ก่อน assert

async function renderAndToast(fn: () => void) {
  render(<ToastContainer />);
  await act(async () => { fn(); });
}

// reset real timers หลังทุก test เผื่อ test ก่อนหน้าใช้ fake timers
afterEach(() => vi.useRealTimers());

// ── Tests ─────────────────────────────────────────────────────

describe("ToastContainer — render", () => {
  it("render โดยไม่มี toast เริ่มต้น", () => {
    render(<ToastContainer />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("แสดง toast.success ได้", async () => {
    await renderAndToast(() => toast.success("บันทึกสำเร็จ"));
    expect(screen.getByText("บันทึกสำเร็จ")).toBeInTheDocument();
  });

  it("แสดง toast.error ได้", async () => {
    await renderAndToast(() => toast.error("เกิดข้อผิดพลาด"));
    expect(screen.getByText("เกิดข้อผิดพลาด")).toBeInTheDocument();
  });

  it("แสดง toast.warning ได้", async () => {
    await renderAndToast(() => toast.warning("คำเตือน"));
    expect(screen.getByText("คำเตือน")).toBeInTheDocument();
  });

  it("แสดง toast.info ได้", async () => {
    await renderAndToast(() => toast.info("แจ้งเตือน"));
    expect(screen.getByText("แจ้งเตือน")).toBeInTheDocument();
  });
});

describe("ToastContainer — หลาย toast พร้อมกัน", () => {
  it("แสดงหลาย toast พร้อมกันได้", async () => {
    await renderAndToast(() => {
      toast.success("สำเร็จ");
      toast.error("ผิดพลาด");
      toast.info("ข้อมูล");
    });
    expect(screen.getByText("สำเร็จ")).toBeInTheDocument();
    expect(screen.getByText("ผิดพลาด")).toBeInTheDocument();
    expect(screen.getByText("ข้อมูล")).toBeInTheDocument();
  });
});

describe("ToastContainer — dismiss", () => {
  it("กดปุ่มปิดแล้ว toast หายไป", async () => {
    await renderAndToast(() => toast.success("ปิดได้"));
    expect(screen.getByText("ปิดได้")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ปิด" }));

    await waitFor(
      () => expect(screen.queryByText("ปิดได้")).not.toBeInTheDocument(),
      { timeout: 1000 }
    );
  });

  it("toast หายอัตโนมัติหลังหมดเวลา", async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);
    await act(async () => { toast.success("หายอัตโนมัติ", 1000); });

    expect(screen.getByText("หายอัตโนมัติ")).toBeInTheDocument();

    // duration 1000ms + animation 300ms
    await act(async () => { vi.advanceTimersByTime(1300); });

    expect(screen.queryByText("หายอัตโนมัติ")).not.toBeInTheDocument();
  });

  it("toast ยังอยู่ก่อนหมดเวลา", async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);
    await act(async () => { toast.success("ยังอยู่", 3000); });

    expect(screen.getByText("ยังอยู่")).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(500); });

    expect(screen.getByText("ยังอยู่")).toBeInTheDocument();
  });
});

describe("ToastContainer — custom duration", () => {
  it("รับ duration แบบ custom ได้", async () => {
    vi.useFakeTimers();
    render(<ToastContainer />);
    await act(async () => { toast("success", "custom duration", 500); });

    expect(screen.getByText("custom duration")).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(800); });

    expect(screen.queryByText("custom duration")).not.toBeInTheDocument();
  });
});

describe("toast — global function", () => {
  it("toast() ก่อน mount ToastContainer ไม่ crash", () => {
    expect(() => toast.success("ก่อน mount")).not.toThrow();
  });

  it("toast() หลัง unmount ToastContainer ไม่ crash", () => {
    const { unmount } = render(<ToastContainer />);
    unmount();
    expect(() => toast.success("หลัง unmount")).not.toThrow();
  });

  it("toast.success / error / warning / info เป็น shorthand ของ toast()", async () => {
    await renderAndToast(() => {
      toast.success("s");
      toast.error("e");
      toast.warning("w");
      toast.info("i");
    });
    expect(screen.getByText("s")).toBeInTheDocument();
    expect(screen.getByText("e")).toBeInTheDocument();
    expect(screen.getByText("w")).toBeInTheDocument();
    expect(screen.getByText("i")).toBeInTheDocument();
  });
});