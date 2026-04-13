# SUIT Backend — API Reference

Go + Gin backend for the Storage Unit Integrated Tools system.

---

## Auth model

All endpoints (except login/logout/session) require two things sent with every request:

- **`session_token`** — HttpOnly cookie set by the server on login. The browser sends it automatically.
- **`X-CSRF-TOKEN`** — header populated from the readable `csrf_token` cookie. Must be included on every POST and DELETE request.

Session lifetime is 30 minutes, rolling. Every call to `GET /api/session` extends it.

---

## Access levels

| Level | Middleware chain | Who gets in |
|---|---|---|
| Public | none | Anyone |
| Protected | `AuthRequired` → `CSRFRequired` | Any logged-in employee |
| Manager only | `AuthRequired` → `CSRFRequired` → `RoleRequired("manager")` | Employees with role `manager` |

---

## Endpoints

### Auth

| Method | URL | Access | Description |
|---|---|---|---|
| `POST` | `/api/login` | Public | Log in. Sets `session_token` (HttpOnly) and `csrf_token` cookies. |
| `POST` | `/api/logout` | Public | Log out. Clears both cookies and deletes the session from the DB. |
| `GET` | `/api/session` | Public | Validate the current session. Returns employee ID and expiry. Extends session by 30 min. |

**Login request body:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Session response (200):**
```json
{ "employee_id": 3, "expires_at": "2026-04-13T18:00:00Z" }
```

---

### Employees (manager only)

| Method | URL | Access | Description |
|---|---|---|---|
| `POST` | `/api/register` | Manager only | Register a new employee. Role is always set to `employee` — cannot be overridden. |
| `GET` | `/api/employees` | Manager only | Get all employees. |
| `POST` | `/api/employees/:id/role` | Manager only | Update an employee's role (`manager` or `employee`). |

**Register request body:**
```json
{ "smid": "emp001", "email": "new@example.com", "password": "StrongPass1!" }
```

**Update role request body:**
```json
{ "role": "manager" }
```

---

### Customers

| Method | URL | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Protected | Get all customers (with their units preloaded). |
| `POST` | `/api/customers` | Protected | Create a new customer. |
| `GET` | `/api/customers/:id` | Protected | Get a single customer by ID. |
| `POST` | `/api/customers/:id` | Protected | Update a customer. |
| `DELETE` | `/api/customers/:id` | **Manager only** | Delete a customer. |
| `GET` | `/api/customers/:id/units` | Protected | Get all units assigned to a customer. |
| `GET` | `/api/customers/:id/balance` | Protected | Get a customer's current balance. |
| `GET` | `/api/customers/:id/transactions` | Protected | Get a customer's full transaction history. |

**Customer fields:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "555-123-4567",
  "address": "123 Main St",
  "email": "jane@example.com"
}
```

---

### Customer Notes

Notes are free-text records attached to a customer. Any employee can read and write them. Only the note's author or a manager can delete a note.

| Method | URL | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers/:id/notes` | Protected | Get all notes for a customer. Returns empty array if none. |
| `POST` | `/api/customers/:id/notes` | Protected | Add a note. `AuthorID` is set from the session — do not send it from the client. |
| `DELETE` | `/api/customers/:id/notes/:nid` | Protected (author or manager) | Delete a specific note. Returns `403` if caller is neither the author nor a manager. |

**Create note request body:**
```json
{ "content": "Customer called about late payment" }
```

**Note object (in responses):**
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

**Delete note errors:**

| Status | Meaning |
|---|---|
| `403` | Caller is not the author and not a manager |
| `404` | Note does not exist or does not belong to this customer |

---

### Units

| Method | URL | Access | Description |
|---|---|---|---|
| `GET` | `/api/AvailableUnits` | Protected | Get all units with no customer assigned. |
| `GET` | `/api/AllUnits` | **Manager only** | Get all units (occupied and available). |
| `GET` | `/api/units/:unit_number` | Protected | Get a single unit by its unit number. |
| `POST` | `/api/units` | Protected | Create a new unit. |
| `POST` | `/api/units/:unit_number` | Protected | Update a unit. |
| `DELETE` | `/api/units/:unit_number` | **Manager only** | Delete a unit. |
| `POST` | `/api/units/combine` | Protected | Combine multiple units into one. |

**Unit fields:**
```json
{
  "unit_number": "A101",
  "size_type": "10x10",
  "length": 10,
  "width": 10,
  "height": 8,
  "price": 149.95,
  "customer_id": null
}
```

**Combine units request body:**
```json
{
  "unit_ids": [1, 2],
  "customer_id": 0,
  "price": 249.95
}
```

Note: after combining, the frontend is expected to send individual DELETE requests for the original units.

---

### Unit Insurance

Each unit can have one insurance record. `POST` handles both create and update — call it the same way regardless of whether insurance already exists for the unit.

| Method | URL | Access | Description |
|---|---|---|---|
| `GET` | `/api/units/:unit_number/insurance` | Protected | Get the insurance record for a unit. Returns `404` if the unit has no insurance on file. |
| `POST` | `/api/units/:unit_number/insurance` | Protected | Create or update insurance for a unit. |

**Insurance request body (all fields required):**
```json
{
  "provider_name": "SafeStore Insurance Co.",
  "policy_number": "POL-00123",
  "coverage_limit": 5000.00,
  "expiry_date": "2027-01-01T00:00:00Z"
}
```

**Insurance object (in responses):**
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

`expiry_date` must be an ISO 8601 string (e.g. `"2027-01-01T00:00:00Z"`).

A `404` on GET means the unit has no insurance yet — show a "no insurance on file" state, not an error screen.

---

### Billing

| Method | URL | Access | Description |
|---|---|---|---|
| `POST` | `/api/PostPayment` | Protected | Record a payment for a customer against a unit. |

**Payment request body:**
```json
{
  "customer_id": 42,
  "unit_id": 7,
  "amount": 149.95,
  "description": "Monthly rent - April 2026"
}
```

---

### Search

| Method | URL | Access | Description |
|---|---|---|---|
| `POST` | `/api/searchDB` | Protected | Search customers (by name, email, phone) and units (by unit number) in one call. |

**Request body:**
```json
{ "query": "john" }
```

**Response:**
```json
{
  "customers": [...],
  "units": [...]
}
```

---

## Error responses

All errors return the same shape:

```json
{ "error": "description of what went wrong" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request — missing or malformed fields |
| `401` | Not logged in or session expired |
| `403` | Logged in but insufficient role |
| `404` | Resource not found |
| `409` | Conflict — duplicate email or username on register |
| `500` | Server error |

---

## RBAC summary

| Action | Employee | Manager |
|---|---|---|
| Login / logout | Yes | Yes |
| View customers, units, notes, insurance | Yes | Yes |
| Create / update customers, units, notes, insurance | Yes | Yes |
| Delete a note they authored | Yes | Yes |
| Delete someone else's note | No | Yes |
| Delete a customer or unit | No | Yes |
| Register new employees | No | Yes |
| View all employees | No | Yes |
| Update employee roles | No | Yes |
| View all units (occupied + available) | No | Yes |
