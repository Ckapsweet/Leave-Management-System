import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Avatar,
  AppBar,
  Toolbar,
  // IconButton
} from "@mui/material";

export default function SystemSelectionPage() {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const role = localStorage.getItem("role");

  const handleSelectLeave = () => {
    // Redirect based on role
    const roleToPath: Record<string, string> = {
      manager: "/manager",
      hr: "/hr",
    };
    navigate(roleToPath[role || ""] ?? "/dashboard");
  };

  const handleSelectOT = () => {
    const baseUrl = import.meta.env.VITE_OT_SYSTEM_URL || "http://localhost:5174";
    // ตั้งค่า Path ใหม่ตามความต้องการของคุณ
    const roleToPath: Record<string, string> = {
      manager: "/ot-manager",
      hr: "/ot-admin", // เปลี่ยนจาก /ot-hr เป็น /ot-admin
    };
    // ถ้าไม่ใช่ manager/hr จะไปที่ /ot (แทน /dashboard เดิม)
    const targetPath = roleToPath[role || ""] ?? "/ot";
    window.location.href = `${baseUrl}${targetPath}`;
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: "transparent", color: "text.primary" }}>
        <Toolbar sx={{ justifyContent: "flex-end" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                {user?.full_name?.slice(0, 2) ?? "??"}
              </div>
              <div className="hidden sm:block text-right cursor-pointer hover:opacity-80 transition-opacity">
                <p className="text-xs font-semibold text-gray-800">{user?.full_name ?? ""}</p>
                <p className="text-xs text-gray-400">{user?.employee_code ?? ""}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              ออกจากระบบ
            </button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 8, mb: 4, flex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" fontWeight="800" sx={{ mb: 2, color: "#1a2a6c" }}>
            เลือกเข้าใช้งานระบบ
          </Typography>
          <Typography variant="h6" color="text.secondary">
            ยินดีต้อนรับสู่ CKAP Portal กรุณาเลือกระบบที่ท่านต้องการใช้งาน
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {/* Leave Management System */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 4,
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                }
              }}
            >
              <CardActionArea onClick={handleSelectLeave} sx={{ height: "100%", p: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "primary.light",
                      mb: 3,
                      mx: "auto",
                      boxShadow: "0 8px 16px rgba(25, 118, 210, 0.2)",
                      fontSize: 50
                    }}
                  >
                    📅
                  </Avatar>
                  <Typography variant="h5" fontWeight="700" gutterBottom>
                    ระบบจัดการการลา
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ยื่นเรื่องขอลาอนุมัติ ตรวจสอบประวัติการลา และจัดการสิทธิ์พนักงาน
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* OT Management System */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 4,
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                }
              }}
            >
              <CardActionArea onClick={handleSelectOT} sx={{ height: "100%", p: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "warning.light",
                      mb: 3,
                      mx: "auto",
                      boxShadow: "0 8px 16px rgba(237, 108, 2, 0.2)",
                      fontSize: 50
                    }}
                  >
                    ⏰
                  </Avatar>
                  <Typography variant="h5" fontWeight="700" gutterBottom>
                    ระบบจัดการ OT
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ขออนุมัติทำงานล่วงเวลา รายงานข้อมูลสรุป OT และจัดการตารางงาน
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} CKAP Management System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
