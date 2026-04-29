import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { logout } from "../../services/authService";
import type { AuthUser } from "../../services/authService";
import api from "../../services/api";
import {
  approveLeaveRequest,
  getAdminLeaveRequests,
  getAdminUserPool,
  rejectLeaveRequest,
  updateLeavePool,
} from "../../services/leaveService";
import type { LeavePool, LeaveRequest, LeaveStatus } from "../../services/leaveService";
import { toast } from "../../components/Toast";
import type { Employee, EmployeeWithBalance } from "../../components/adminHelpers";

export type RequestViewMode = "all" | "yearly" | "monthly";
export type ConfirmLeaveAction = { type: "approve" | "reject"; req: LeaveRequest };
export type BalanceModalState = {
  user: { id: number; full_name: string; employee_code: string; department: string };
  pool: LeavePool;
} | null;

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function useAdminAuthUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [showEditProfile, setShowEditProfile] = useState(false);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }, [navigate]);

  return {
    user,
    showEditProfile,
    setShowEditProfile,
    updateUser,
    handleLogout,
    navigate,
  };
}

export function useAdminLeaveRequests(onActionComplete?: () => void) {
  const year = new Date().getFullYear();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("pending");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<RequestViewMode>("all");
  const [selYear, setSelYear] = useState<number>(year);
  const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm] = useState<ConfirmLeaveAction | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminLeaveRequests();
      setRequests(data);
    } catch (err) {
      setError(getErrorMessage(err, "โหลดข้อมูลไม่สำเร็จ"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = useCallback(
    async (id: number, type: "approve" | "reject", comment: string) => {
      try {
        setActionLoading(true);
        const response =
          type === "approve"
            ? await approveLeaveRequest(id, comment)
            : await rejectLeaveRequest(id, comment);

        setRequests((prev) =>
          prev.map((request) =>
            request.id === id
              ? {
                  ...request,
                  status: response.status,
                  current_assignee_id: response.current_assignee_id,
                  approved_at: new Date().toISOString(),
                  comment: comment || undefined,
                }
              : request
          )
        );
        setConfirm(null);
        setSelected(null);
        toast.success(type === "approve" ? "อนุมัติคำขอลาเรียบร้อย" : "ปฏิเสธคำขอลาเรียบร้อย");
        onActionComplete?.();
      } catch (err) {
        toast.error(getErrorMessage(err, "ดำเนินการไม่สำเร็จ"));
      } finally {
        setActionLoading(false);
      }
    },
    [onActionComplete]
  );

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const matchStatus = statusFilter === "all" || request.status === statusFilter;
        const query = search.trim();
        const matchSearch =
          !query ||
          request.user?.full_name?.includes(query) ||
          request.user?.employee_code?.includes(query);
        const requestDate = new Date(request.start_date);
        const matchDate =
          viewMode === "all" ||
          (viewMode === "yearly" && requestDate.getFullYear() === selYear) ||
          (viewMode === "monthly" &&
            requestDate.getFullYear() === selYear &&
            requestDate.getMonth() + 1 === selMonth);
        return matchStatus && matchSearch && matchDate;
      }),
    [requests, search, selMonth, selYear, statusFilter, viewMode]
  );

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      rejected: requests.filter((request) => request.status === "rejected").length,
    }),
    [requests]
  );

  return {
    requests,
    setRequests,
    loading,
    actionLoading,
    error,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    viewMode,
    setViewMode,
    selYear,
    setSelYear,
    selMonth,
    setSelMonth,
    selected,
    setSelected,
    confirm,
    setConfirm,
    fetchRequests,
    handleAction,
    filtered,
    pending: counts.pending,
    approved: counts.approved,
    rejected: counts.rejected,
  };
}

async function fetchEmployeesWithPools(year: number, shouldInclude: (user: Employee) => boolean) {
  const usersRes = await api.get<Employee[]>("/api/admin/users");
  const users = usersRes.data.filter((user) => user.role !== "admin").filter(shouldInclude);

  return Promise.all(
    users.map(async (user) => {
      try {
        const res = await getAdminUserPool(user.id, year);
        return { ...user, pool: res };
      } catch {
        return { ...user, pool: null };
      }
    })
  );
}

export function useAdminEmployees(options: {
  year: number;
  user: AuthUser | null;
  requests: LeaveRequest[];
  filterToSupervisor?: boolean;
}) {
  const { year, user, requests, filterToSupervisor = false } = options;
  const [employees, setEmployees] = useState<EmployeeWithBalance[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBalance | null>(null);
  const [empLeaveRequests, setEmpLeaveRequests] = useState<LeaveRequest[]>([]);
  const [empLeaveLoading, setEmpLeaveLoading] = useState(false);
  const [balanceModal, setBalanceModal] = useState<BalanceModalState>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      const withPool = await fetchEmployeesWithPools(year, (employee) => {
        if (!filterToSupervisor) return true;
        return employee.supervisor_id === user?.id;
      });
      setEmployees(withPool);
    } catch (err) {
      console.error("fetch employees failed", err);
    } finally {
      setEmpLoading(false);
    }
  }, [filterToSupervisor, user?.id, year]);

  const openBalanceModal = useCallback(
    async (targetUser: { id: number; full_name: string; employee_code: string; department: string }) => {
      try {
        const pool = await getAdminUserPool(targetUser.id, year);
        setBalanceModal({ user: targetUser, pool });
      } catch {
        toast.error("โหลดข้อมูลวันลาไม่สำเร็จ");
      }
    },
    [year]
  );

  const handleUpdateBalance = useCallback(
    async (balances: { leave_type_id: number; total_days: number }[]) => {
      if (!balanceModal) return;
      try {
        const updated = await updateLeavePool(balanceModal.user.id, balances, year);
        setBalanceModal((prev) => (prev ? { ...prev, pool: updated } : null));
        setEmployees((prev) =>
          prev.map((employee) =>
            employee.id === balanceModal.user.id ? { ...employee, pool: updated } : employee
          )
        );
        toast.success("อัปเดตวันลาเรียบร้อย");
      } catch (err) {
        toast.error(getErrorMessage(err, "อัปเดตวันลาไม่สำเร็จ"));
      }
    },
    [balanceModal, year]
  );

  const handleEmployeeClick = useCallback(
    async (employee: EmployeeWithBalance) => {
      setSelectedEmployee(employee);
      setEmpLeaveRequests([]);
      setEmpLeaveLoading(true);
      try {
        const data = await getAdminLeaveRequests({ user_id: employee.id });
        setEmpLeaveRequests(data);
      } catch {
        setEmpLeaveRequests(requests.filter((request) => request.user_id === employee.id));
      } finally {
        setEmpLeaveLoading(false);
      }
    },
    [requests]
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchDepartment = empDeptFilter === "all" || employee.department === empDeptFilter;
        const query = empSearch.trim();
        const matchSearch =
          !query || employee.full_name.includes(query) || employee.employee_code.includes(query);
        return matchDepartment && matchSearch;
      }),
    [empDeptFilter, empSearch, employees]
  );

  return {
    employees,
    setEmployees,
    empLoading,
    empSearch,
    setEmpSearch,
    empDeptFilter,
    setEmpDeptFilter,
    selectedEmployee,
    setSelectedEmployee,
    empLeaveRequests,
    setEmpLeaveRequests,
    empLeaveLoading,
    balanceModal,
    setBalanceModal,
    fetchEmployees,
    openBalanceModal,
    handleUpdateBalance,
    handleEmployeeClick,
    filteredEmployees,
  };
}
