import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../../services/authService";
import api from "../../services/api";
import {
  approveLeaveRequest,
  getAdminLeaveRequests,
  getAdminUserPool,
  rejectLeaveRequest,
  updateLeavePool,
} from "../../services/leaveService";
import type { LeavePool, LeaveRequest } from "../../services/leaveService";
import { toast } from "../../components/Toast";
import type { Employee, EmployeeWithBalance } from "../../components/adminHelpers";
import { deriveLeavePoolFromRequests } from "../../services/leavePoolHelpers";
import { logoutAndRedirect, readStoredUser, writeStoredUser } from "../../services/authSession";
import { getErrorMessage } from "../../services/errors";
import { normalizeDepartment } from "../../services/leaveFilters";
import { useEmployeeFilters } from "../../hooks/useEmployeeFilters";
import { useLeaveRequestFilters } from "../../hooks/useLeaveRequestFilters";

export type ConfirmLeaveAction = { type: "approve" | "reject"; req: LeaveRequest };
export type BalanceModalState = {
  user: { id: number; full_name: string; employee_code: string; department: string };
  pool: LeavePool;
} | null;

export function useAdminAuthUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [showEditProfile, setShowEditProfile] = useState(false);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    writeStoredUser(updated);
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAndRedirect(navigate);
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
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm] = useState<ConfirmLeaveAction | null>(null);
  const {
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
    filtered,
    pending,
    approved,
    rejected,
  } = useLeaveRequestFilters(requests, { initialStatus: "pending" });

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
    pending,
    approved,
    rejected,
  };
}

function mergeUsers(primary: Employee[], secondary: Employee[]) {
  return [...primary, ...secondary].reduce<Employee[]>((acc, employee) => {
    if (!acc.some((item) => item.id === employee.id)) {
      acc.push({ ...employee, department: normalizeDepartment(employee.department) });
    }
    return acc;
  }, []);
}

async function fetchEmployeesWithPools(
  year: number,
  shouldInclude: (user: Employee, users: Employee[]) => boolean,
  seedUsers: Employee[] = [],
  requests: LeaveRequest[] = []
) {
  const usersRes = await api.get<Employee[]>("/api/admin/users");
  const nonAdminUsers = mergeUsers(usersRes.data, seedUsers).filter((user) => user.role !== "admin");
  const users = nonAdminUsers.filter((employee) => shouldInclude(employee, nonAdminUsers));

  return Promise.all(
    users.map(async (user) => {
      try {
        const res = await getAdminUserPool(user.id, year);
        return { ...user, pool: deriveLeavePoolFromRequests(res, requests.filter((request) => request.user_id === user.id), year) };
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
  departmentScope?: string | null;
}) {
  const { year, user, requests, filterToSupervisor = false, departmentScope = null } = options;
  const [employees, setEmployees] = useState<EmployeeWithBalance[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithBalance | null>(null);
  const [empLeaveRequests, setEmpLeaveRequests] = useState<LeaveRequest[]>([]);
  const [empLeaveLoading, setEmpLeaveLoading] = useState(false);
  const [balanceModal, setBalanceModal] = useState<BalanceModalState>(null);
  const {
    empSearch,
    setEmpSearch,
    empDeptFilter,
    setEmpDeptFilter,
    filteredEmployees,
  } = useEmployeeFilters(employees);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmpLoading(true);
      const requestUsers = requests.flatMap((request) => (request.user ? [request.user] : []));
      const withPool = await fetchEmployeesWithPools(year, (employee, users) => {
        if (departmentScope && normalizeDepartment(employee.department) !== normalizeDepartment(departmentScope)) {
          return false;
        }
        if (!filterToSupervisor) return true;
        if (employee.supervisor_id === user?.id) return true;
        const supervisor = users.find((item) => item.id === employee.supervisor_id);
        return supervisor?.supervisor_id === user?.id;
      }, requestUsers, requests);
      setEmployees(withPool);
    } catch (err) {
      console.error("fetch employees failed", err);
    } finally {
      setEmpLoading(false);
    }
  }, [departmentScope, filterToSupervisor, requests, user?.id, year]);

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
