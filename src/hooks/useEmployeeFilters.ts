import { useEffect, useMemo, useState } from "react";
import type { EmployeeWithBalance } from "../components/adminHelpers";
import { isSameDepartment } from "../services/leaveFilters";

export function useEmployeeFilters(employees: EmployeeWithBalance[]) {
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("all");

  useEffect(() => {
    if (
      empDeptFilter !== "all" &&
      !employees.some((employee) => isSameDepartment(employee.department, empDeptFilter))
    ) {
      setEmpDeptFilter("all");
    }
  }, [empDeptFilter, employees]);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const matchDepartment =
          empDeptFilter === "all" ||
          isSameDepartment(employee.department, empDeptFilter);
        const query = empSearch.trim();
        const matchSearch =
          !query || employee.full_name.includes(query) || employee.employee_code.includes(query);
        return matchDepartment && matchSearch;
      }),
    [empDeptFilter, empSearch, employees]
  );

  return {
    empSearch,
    setEmpSearch,
    empDeptFilter,
    setEmpDeptFilter,
    filteredEmployees,
  };
}
