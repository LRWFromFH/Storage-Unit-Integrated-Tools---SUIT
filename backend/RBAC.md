# RBAC — Role-Based Access Control

## Overview

SUIT uses role-based access control to restrict what employees can do
based on their role. Not all employees should have the same level of
access — managers have additional privileges over regular employees.

---

## Roles

| Role | Description |
|---|---|
| `manager` | Can create employee accounts and change employee roles |
| `employee` | Can access customers, units, search, and dashboard |

Every employee has a role stored in the database. On login, the role
is embedded into the JWT token so the backend can enforce access on
every request without hitting the database.

New accounts always default to `employee` — role cannot be self-assigned
at registration.

---

## Protected Endpoints

| Route | Access |
|---|---|
| `POST /api/login` | Public |
| `POST /api/logout` | Public |
| `GET /api/session` | Public |
| `GET /api/customers` | Any logged-in employee |
| `POST /api/customers` | Any logged-in employee |
| `GET /api/units/:unit_number` | Any logged-in employee |
| `POST /api/searchDB` | Any logged-in employee |
| `POST /api/register` | **Manager only** |
| `POST /api/employees/:id/role` | **Manager only** |

---

## Middleware Chain

Manager-only routes pass through three middleware layers in order:

```
AuthRequired → CSRFRequired → RoleRequired("manager") → Handler
```

- **AuthRequired** — validates the session cookie, parses the JWT, puts the employee's role into the request context
- **CSRFRequired** — validates the X-CSRF-TOKEN header matches the csrf_token cookie
- **RoleRequired** — reads the role from context, returns 403 if it does not match the required role

If any layer fails the request is stopped — the handler never runs.

---

## Role Assignment

A manager can change any employee's role via:

```
POST /api/employees/:id/role
Content-Type: application/json
X-CSRF-TOKEN: <csrf token>

{ "role": "manager" | "employee" }
```

**Responses:**
- `200` — role updated successfully
- `400` — missing role field or unrecognised role value
- `403` — caller is not a manager
- `404` — employee not found

---

## Default Manager (Development)

On first startup, if no employees exist in the database, a default
manager account is seeded automatically:

| Field | Value |
|---|---|
| Email | `manager@suit.com` |
| Password | `Manager123!` |
| Role | `manager` |

This account is for development only. Change or remove it before
deploying to production.

---

## Key Files

| File | What it contains |
|---|---|
| `middleware/auth.go` | `RoleRequired`, `HasRole`, `GetRoleFromContext`, role constants |
| `routes/routes.go` | Manager-only route group definition |
| `controllers/controller.go` | `UpdateEmployeeRole` handler |
| `models/employees.go` | `RoleUpdateRequest` struct |
| `database/init.go` | Default manager seed |
