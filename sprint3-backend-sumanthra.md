# SUIT — Sprint 3 Backend (Sumanthra Yerrabelly)

**Branch:** `backendv_latest`

---

## 1. RBAC — Delete Restriction

Restricted the delete endpoints so that only managers can remove customer or unit records. Regular employees now receive `403 Forbidden`.

### What changed

Moved `DELETE /api/customers/:id` and `DELETE /api/units/:unit_number` from the general protected group to the manager-only route group in `routes/routes.go`. No handler changes — the existing `RoleRequired("manager")` middleware handles the rejection.

### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `DELETE` | `/api/customers/:id` | Manager only | Delete a customer record |
| `DELETE` | `/api/units/:unit_number` | Manager only | Delete a unit record |

**Before this change:** any logged-in employee could delete.
**After:** returns `403 Forbidden` for employees, `200` for managers.

---

## 2. Customer Notes

A notes system for attaching free-text records to customer accounts. Any employee can read and write notes. Deletion is permissioned — only the note's author or a manager can delete.

### Files changed

- `controllers/controller.go` — `GetNotes`, `CreateNote`, `DeleteNote` handlers
- `models/note.go` — `NoteRequest` struct
- `routes/routes.go` — three new routes under the protected group
- `database/database.go` — `Note` added to `AutoMigrate`

### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers/:id/notes` | Protected | Get all notes for a customer |
| `POST` | `/api/customers/:id/notes` | Protected | Add a note to a customer |
| `DELETE` | `/api/customers/:id/notes/:nid` | Protected (author or manager) | Delete a note |

### Request body — create note

```json
{ "content": "Customer called about late payment" }
```

`AuthorID` is set server-side from the session. Do not send it from the client.

### Note object

```json
{
  "ID": 5,
  "CreatedAt": "2026-04-13T11:00:00Z",
  "UpdatedAt": "2026-04-13T11:00:00Z",
  "CustomerID": 42,
  "Content": "Customer called about late payment",
  "AuthorID": 3
}
```

### Business rules

- `GET` returns an empty array `[]` when no notes exist — not a 404.
- `DELETE` returns `403` if the caller is neither the author nor a manager.
- `DELETE` returns `404` if the note does not exist or does not belong to the given customer.

---

## 3. Unit Insurance

Insurance records attached to individual units. One insurance record per unit. The POST endpoint handles both create and update — the client calls it the same way regardless.

### Files changed

- `controllers/controller.go` — `GetInsurance`, `UpsertInsurance` handlers
- `models/insurance.go` — `InsuranceRequest` struct
- `routes/routes.go` — two new routes under the protected group
- `database/database.go` — `Insurance` added to `AutoMigrate`

### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/units/:unit_number/insurance` | Protected | Get insurance for a unit |
| `POST` | `/api/units/:unit_number/insurance` | Protected | Create or update insurance for a unit |

### Request body — create / update insurance (all fields required)

```json
{
  "provider_name": "SafeStore Insurance Co.",
  "policy_number": "POL-00123",
  "coverage_limit": 5000.00,
  "expiry_date": "2027-01-01T00:00:00Z"
}
```

`expiry_date` must be an ISO 8601 string.

### Insurance object

```json
{
  "ID": 1,
  "CreatedAt": "2026-04-13T10:00:00Z",
  "UpdatedAt": "2026-04-13T10:00:00Z",
  "UnitID": 7,
  "ProviderName": "SafeStore Insurance Co.",
  "PolicyNumber": "POL-00123",
  "CoverageLimit": 5000.00,
  "ExpiryDate": "2027-01-01T00:00:00Z"
}
```

### Business rules

- `GET` returns `404` if the unit has no insurance on file — treat this as "no insurance yet", not an error.
- `POST` creates if none exists, updates if it does. No duplicate records.

---

## Test coverage

All new handlers have test coverage in `controllers/CRUD_test.go` and `controllers/auth_test.go`.

| Test | What it verifies |
|---|---|
| `TestGetNotes` | Returns notes for a customer |
| `TestCreateNote` | Creates a note, verifies content in response |
| `TestDeleteNote` | Author can delete their own note |
| `TestDeleteNote_Forbidden` | Employee cannot delete another employee's note |
| `TestDeleteNote_Manager` | Manager can delete any note |
| `TestGetInsurance` | Returns insurance record for a unit |
| `TestCreateInsurance` | Creates insurance, verifies all fields |
| `TestUpdateInsurance` | POST twice on same unit — second call updates, no duplicate created |
