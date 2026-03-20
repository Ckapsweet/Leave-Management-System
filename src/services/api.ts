// services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// แนบ CSRF token จาก cookie ทุก request ที่เปลี่ยนแปลงข้อมูล
api.interceptors.request.use((config) => {
  const safeMethods = ["get", "head", "options"];
  if (safeMethods.includes(config.method?.toLowerCase() ?? "")) return config;

  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];

  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  return config;
});

// redirect ไป login ถ้า 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("role");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;