// components/Toast.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

// ── Hook ──────────────────────────────────────────────────────

let _addToast: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export function toast(type: ToastType, message: string, duration = 4000) {
  _addToast?.(type, message, duration);
}

toast.success = (message: string, duration?: number) => toast("success", message, duration);
toast.error   = (message: string, duration?: number) => toast("error",   message, duration);
toast.warning = (message: string, duration?: number) => toast("warning", message, duration);
toast.info    = (message: string, duration?: number) => toast("info",    message, duration);

// ── Config ────────────────────────────────────────────────────

const CONFIG: Record<ToastType, { icon: string; bg: string; border: string; text: string; bar: string }> = {
  success: {
    icon:   "M5 13l4 4L19 7",
    bg:     "bg-emerald-50",
    border: "border-emerald-200",
    text:   "text-emerald-800",
    bar:    "bg-emerald-400",
  },
  error: {
    icon:   "M6 18L18 6M6 6l12 12",
    bg:     "bg-red-50",
    border: "border-red-200",
    text:   "text-red-800",
    bar:    "bg-red-400",
  },
  warning: {
    icon:   "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    bg:     "bg-amber-50",
    border: "border-amber-200",
    text:   "text-amber-800",
    bar:    "bg-amber-400",
  },
  info: {
    icon:   "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    bg:     "bg-sky-50",
    border: "border-sky-200",
    text:   "text-sky-800",
    bar:    "bg-sky-400",
  },
};

// ── Single Toast ──────────────────────────────────────────────

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cfg = CONFIG[item.type];
  const duration = item.duration ?? 4000;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(item.id), 300);
  }, [item.id, onRemove]);

  useEffect(() => {
    // mount → slide in
    requestAnimationFrame(() => setVisible(true));
    // auto dismiss
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [dismiss, duration]);

  return (
    <div
      className={`
        relative w-80 rounded-2xl border shadow-lg overflow-hidden
        transition-all duration-300 ease-out
        ${cfg.bg} ${cfg.border}
        ${visible && !leaving ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      style={{ transform: leaving ? "translateX(110%)" : undefined }}
    >
      {/* Progress bar */}
      <div
        className={`absolute top-0 left-0 h-0.5 ${cfg.bar}`}
        style={{
          width: "100%",
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bar} bg-opacity-20`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cfg.text}>
            <path d={cfg.icon} />
          </svg>
        </div>

        {/* Message */}
        <p className={`flex-1 text-sm font-medium leading-snug pt-1 ${cfg.text}`}>
          {item.message}
        </p>

        {/* Close */}
        <button
          onClick={dismiss}
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg opacity-50 hover:opacity-100 transition-opacity ${cfg.text}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ลงทะเบียน addToast ให้ global toast() ใช้ได้
  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return createPortal(
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}

export default ToastContainer;