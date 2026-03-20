// services/api.ts
// axios instance กลาง — ส่ง cookie + CSRF header ทุก request อัตโนมัติ

import axios from "axios";

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true, // ส่ง httpOnly cookie ไปด้วยทุก request
});

// ── Request interceptor — แนบ CSRF token จาก cookie ──────────
api.interceptors.request.use((config) => {
  const safeMethods = ["get", "head", "options"];
  if (safeMethods.includes(config.method?.toLowerCase() ?? "")) return config;

  // อ่าน csrf_token จาก cookie (JS อ่านได้เพราะ httpOnly: false)
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];

  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// ── Response interceptor — redirect ถ้า 401 ──────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // token หมดอายุหรือไม่มี — ไปหน้า login
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;