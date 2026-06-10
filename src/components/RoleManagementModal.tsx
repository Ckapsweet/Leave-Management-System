import { useMemo, useState } from "react";
import type { UserRole } from "../services/superAdminService";
import type { EmployeeWithBalance } from "./adminHelpers";

export type ManageableRole = Exclude<UserRole, "admin">;

export interface RoleCreateForm {
  employee_code: string;
  full_name: string;
  department: string;
  password: string;
  role: ManageableRole;
}

interface RoleManagementModalProps {
  employees: EmployeeWithBalance[];
  loading: boolean;
  updatingId: number | null;
  onCreate: (form: RoleCreateForm) => Promise<void>;
  onUpdateRole: (employeeId: number, role: ManageableRole) => Promise<void>;
  onDelete: (employeeId: number) => Promise<void>;
  onClose: () => void;
}

const ROLE_OPTIONS: ManageableRole[] = ["user", "lead", "assistant manager", "manager", "hr"];

const ROLE_LABEL: Record<ManageableRole, string> = {
  user: "User",
  lead: "Lead",
  "assistant manager": "Assistant Manager",
  manager: "Manager",
  hr: "HR",
};

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white";

export function RoleManagementModal({
  employees,
  loading,
  updatingId,
  onCreate,
  onUpdateRole,
  onDelete,
  onClose,
}: RoleManagementModalProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<RoleCreateForm>({
    employee_code: "",
    full_name: "",
    department: "",
    password: "",
    role: "user",
  });

  const departments = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) =>
      [employee.full_name, employee.employee_code, employee.department, employee.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [employees, search]);

  const setCreate = <K extends keyof RoleCreateForm>(key: K, value: RoleCreateForm[K]) => {
    setCreateForm((current) => ({ ...current, [key]: value }));
  };

  const canCreate =
    createForm.employee_code.trim() &&
    createForm.full_name.trim() &&
    createForm.department.trim() &&
    createForm.password.length >= 6;

  const handleCreate = async () => {
    if (!canCreate) return;
    await onCreate(createForm);
    setCreateForm({
      employee_code: "",
      full_name: "",
      department: "",
      password: "",
      role: "user",
    });
    setShowCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4Z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">จัดการ Role</h2>
            <p className="text-xs text-gray-400">เพิ่มผู้ใช้ แก้ไข role และลบผู้ใช้</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl"
          >
            x
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className={`${INPUT} pl-9`}
                placeholder="ค้นหาชื่อ รหัส แผนก หรือ role..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              onClick={() => setShowCreate((current) => !current)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 font-medium whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              เพิ่ม Role/User
            </button>
          </div>

          {showCreate && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className={INPUT}
                  placeholder="รหัสพนักงาน"
                  value={createForm.employee_code}
                  onChange={(event) => setCreate("employee_code", event.target.value)}
                />
                <input
                  className={INPUT}
                  placeholder="ชื่อ-นามสกุล"
                  value={createForm.full_name}
                  onChange={(event) => setCreate("full_name", event.target.value)}
                />
                <input
                  className={INPUT}
                  list="role-management-departments"
                  placeholder="แผนก"
                  value={createForm.department}
                  onChange={(event) => setCreate("department", event.target.value)}
                />
                <datalist id="role-management-departments">
                  {departments.map((department) => (
                    <option key={department} value={department} />
                  ))}
                </datalist>
                <input
                  className={INPUT}
                  type="password"
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
                  value={createForm.password}
                  onChange={(event) => setCreate("password", event.target.value)}
                />
                <select
                  className={INPUT}
                  value={createForm.role}
                  onChange={(event) => setCreate("role", event.target.value as ManageableRole)}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !canCreate}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังเพิ่ม..." : "เพิ่มผู้ใช้"}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400">พนักงาน</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm text-gray-400">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const currentRole = (employee.role || "user") as ManageableRole;
                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-800">{employee.full_name}</p>
                          <p className="text-xs text-gray-400">{employee.department} · {employee.employee_code}</p>
                        </td>
                        <td className="px-5 py-4">
                          {updatingId === employee.id ? (
                            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <select
                              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                              value={currentRole}
                              onChange={(event) => onUpdateRole(employee.id, event.target.value as ManageableRole)}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>{ROLE_LABEL[role]}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => onDelete(employee.id)}
                            className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบผู้ใช้"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleManagementModal;
