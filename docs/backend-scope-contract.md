# Backend Scope Contract

Frontend filtering is kept as a display safeguard, but backend APIs must enforce the same scope.

## Role scopes

- `admin`: can read and update every non-admin employee, including leave entitlement balances.
- `lead`: can read and update only users where:
  - `user.department` matches the lead department after trimming and case-folding.
  - `user.supervisor_id` equals the authenticated lead id.
- `manager` and `assistant manager`: can read and update users in their supervisor tree:
  - direct reports where `user.supervisor_id` equals the authenticated manager id.
  - second-level reports where the user's supervisor reports to the authenticated manager.

## Required endpoint behavior

- `GET /api/admin/users`
  - Must return only users visible to the authenticated role.
  - For lead, return only department-matching direct reports.
- `GET /api/admin/leave-requests`
  - Must return only leave requests belonging to visible users.
  - For lead, this means same-department direct reports only.
- `GET /api/admin/leave-pool/:userId`
  - Must reject with `403` when `userId` is outside the authenticated user's scope.
  - Should always return `balances` for every leave type, even when the employee has no saved balance yet.
- `PATCH /api/admin/leave-pool/:userId`
  - Only `admin` can update leave entitlement balances.
  - Leads, managers, and assistant managers must receive `403`.
  - Treat incoming `balances[].total_days` as the new total entitlement per leave type.
- `PATCH /api/admin/users/:userId/assign-subordinate`
  - Only `admin` can assign or unassign team relationships.
  - Leads and managers must receive `403`.

## Department matching

Use the same semantic comparison as the frontend:

```ts
normalizeDepartment(value).toLocaleLowerCase()
```

This intentionally treats `Test`, `test`, and ` test ` as equal, but does not treat `test` and `ทดสอบ` as equal.
