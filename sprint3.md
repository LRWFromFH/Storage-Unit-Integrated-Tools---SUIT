# SUIT — Sprint 3 Development Update

**Repository:** [LRWFromFH/Storage-Unit-Integrated-Tools---SUIT](https://github.com/LRWFromFH/Storage-Unit-Integrated-Tools---SUIT/issues)  
**Team Members:**
- Sumanthra Yerrabelly | Backend
- Manasa Kallam | Frontend
- Satvik LNU | Frontend
- Alexander Martin | Backend

---

## Backend

### Branch: `backendv_latest`

### 1. RBAC — Delete Restriction

Restricted the delete endpoints so that only managers can remove customer or unit records. Regular employees now receive `403 Forbidden`.

#### What changed

Moved `DELETE /api/customers/:id` and `DELETE /api/units/:unit_number` from the general protected group to the manager-only route group in `routes/routes.go`. No handler changes — the existing `RoleRequired("manager")` middleware handles the rejection.

#### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `DELETE` | `/api/customers/:id` | Manager only | Delete a customer record |
| `DELETE` | `/api/units/:unit_number` | Manager only | Delete a unit record |

**Before this change:** any logged-in employee could delete.  
**After:** returns `403 Forbidden` for employees, `200` for managers.

---

### 2. Customer Notes

A notes system for attaching free-text records to customer accounts. Any employee can read and write notes. Deletion is permissioned — only the note's author or a manager can delete.

#### Files changed

- `controllers/controller.go` — `GetNotes`, `CreateNote`, `DeleteNote` handlers
- `models/note.go` — `NoteRequest` struct
- `routes/routes.go` — three new routes under the protected group
- `database/database.go` — `Note` added to `AutoMigrate`

#### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers/:id/notes` | Protected | Get all notes for a customer |
| `POST` | `/api/customers/:id/notes` | Protected | Add a note to a customer |
| `DELETE` | `/api/customers/:id/notes/:nid` | Protected (author or manager) | Delete a note |

#### Request body — create note

```json
{ "content": "Customer called about late payment" }
```

`AuthorID` is set server-side from the session. Do not send it from the client.

#### Note object

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

#### Business rules

- `GET` returns an empty array `[]` when no notes exist — not a 404.
- `DELETE` returns `403` if the caller is neither the author nor a manager.
- `DELETE` returns `404` if the note does not exist or does not belong to the given customer.

---

### 3. Unit Insurance

Insurance records attached to individual units. One insurance record per unit. The POST endpoint handles both create and update — the client calls it the same way regardless.

#### Files changed

- `controllers/controller.go` — `GetInsurance`, `UpsertInsurance` handlers
- `models/insurance.go` — `InsuranceRequest` struct
- `routes/routes.go` — two new routes under the protected group
- `database/database.go` — `Insurance` added to `AutoMigrate`

#### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/units/:unit_number/insurance` | Protected | Get insurance for a unit |
| `POST` | `/api/units/:unit_number/insurance` | Protected | Create or update insurance for a unit |

#### Request body — create / update insurance (all fields required)

```json
{
  "provider_name": "SafeStore Insurance Co.",
  "policy_number": "POL-00123",
  "coverage_limit": 5000.00,
  "expiry_date": "2027-01-01T00:00:00Z"
}
```

`expiry_date` must be an ISO 8601 string.

#### Insurance object

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

#### Business rules

- `GET` returns `404` if the unit has no insurance on file — treat this as "no insurance yet", not an error.
- `POST` creates if none exists, updates if it does. No duplicate records.

---

### 4. Billing & Ledger System

This module handles financial transactions, balance tracking, and ledger management. Core logic is located in `services/billing.go`.

#### API Endpoints

All endpoints require active session validation and standard security headers.

| Endpoint | Method | Description |
|---|---|---|
| `/customers/:id/balance` | `GET` | Returns a `float64`. A **negative** value indicates an outstanding balance (debt). |
| `/customers/:id/transactions` | `GET` | Returns a list of transactions to populate the frontend ledger. |
| `/PostPayment` | `POST` | Receives `PaymentRequest` from frontend to apply payment via billing's `RecordPayment`. |
| `/PostCharge` | `POST` | Receives charge details from frontend to create a new charge via billing's `CreateCharge`. |

```go
type PaymentRequest struct {
    CustomerID  uint    `json:"customer_id" binding:"required"`
    Unit        uint    `json:"unit_id"`
    Amount      float64 `json:"amount" binding:"required"`
    Description string  `json:"description"`
}
```

#### Core Logic (`billing.go`)

```go
func CreateCharge(customerID uint, unitID uint, amount float64, desc string) error

func RecordPayment(customerID uint, unitID uint, amount float64, desc string) error
```

**`GetUnitBalance` / `GetCustomerBalance`:** Return a `float64` representing the current balance derived from the sum of all invoices and payments.

#### Business Rules

- Every charge and payment is automatically recorded as an entry in the ledger.
- The system uses a **loose/naive association** between invoices and ledger entries. A payment must be linked to a charge; a charge can exist independently (awaiting payment).
- Overpayments are accurately reflected in the total balance, though the specific invoice association may not be precise.

---

### Backend Test Coverage

All new handlers have test coverage in `controllers/CRUD_test.go` and `controllers/auth_test.go`.

**Notes & Insurance**

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

**Billing**

| Test Function | Objective | Expected Outcome |
|---|---|---|
| `TestCreateCharge` | Verify charge initialization | Creates "unpaid" invoice; appends negative entry to ledger |
| `TestRecordPaymentAndBalance` | Verify standard payment flow | Invoice status becomes "paid"; customer balance returns to `0.0` |
| `TestOverpayment` | Verify credit handling | Balance reflects a positive credit (e.g., `+400.0`) on the ledger |
| `TestUnderpayment` | Verify partial payment logic | Balance reflects a remaining negative debt (e.g., `-50.0`) |
| `TestTransactionRollback` | Verify DB atomicity | If ledger entry fails, the entire transaction (including invoice creation) rolls back |

---

### Backend Roadmap

- [ ] Payment Reversals — scheduled for the next sprint
- [ ] On-Demand Invoicing — automated invoice generation for overpayment scenarios
- [ ] Reporting — autogenerated financial reports (initial implementation started)

---



---

## Frontend

### 1. Billing Dialog

A billing dialog accessible from the Tenants page surfaces financial information and actions for a selected customer.

- **Balance display:** shows the customer's current balance. A positive value indicates a credit; a negative value indicates an outstanding debt.
- **Create Charge section:** includes a unit selector (auto-fills the unit price), a description field (defaults to `"Monthly rent"`), and a submit button. This section is available whenever the customer has a unit assigned. Uses the new `POST /PostCharge` endpoint backed by the `PostCharge` controller.
- **Post Payment section:** only shown when an outstanding balance exists. A charge must be on record before a payment can be applied.
- **Transaction history table:** lists all ledger entries with columns for type, amount, description, and date.

#### API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers/:id/balance` | Fetch current balance for the billing dialog header |
| `GET` | `/customers/:id/transactions` | Populate the transaction history table |
| `POST` | `/PostCharge` | Submit a new charge from the Create Charge form |
| `POST` | `/PostPayment` | Submit a payment from the Post Payment form |

---

### 2. Notes (Tenant Notes)

A notes dialog accessible from the Tenants page in both table view and card view.

- Lists all notes for a customer, each showing the author ID and timestamp.
- Any employee can add a note via the compose input.
- Delete is restricted to the note's author or a manager — enforced on both the frontend (button visibility) and the backend (HTTP 403).

#### API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/customers/:id/notes` | Fetch all notes for the notes dialog |
| `POST` | `/customers/:id/notes` | Submit a new note |
| `DELETE` | `/customers/:id/notes/:note_id` | Delete a note (author or manager only) |

---

### 3. Insurance (Unit Insurance)

An insurance dialog accessible from the Units page in both table view and card view.

- Displays current insurance details if a record exists for the unit.
- Pre-fills the form fields when updating an existing record.
- Add and update both submit to the same `POST /units/:unit_number/insurance` upsert endpoint — no separate create/edit flows.
- A `GET` that returns `404` is treated as "no insurance on file" and shows an empty add form rather than an error state.

#### API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/units/:unit_number/insurance` | Fetch insurance details (404 = none on file) |
| `POST` | `/units/:unit_number/insurance` | Create or update insurance record |

---

### 4. Dashboard Search

A global search bar on the dashboard backed by `POST /searchDB`.

- Input is debounced at **300 ms** to avoid excessive requests while the user types.
- Searches customers by name, email, or phone number, and units by unit number.
- Results render inline below the search bar with status badges (**Occupied** / **Available**).
- Clicking a result navigates to the relevant page (Tenants or Units).

---

### 5. Unit Management

#### Combining Units

Managers can merge two or more available units into a single combined unit. The operation produces a merged unit number, an aggregated size, and a custom price set at combine time.

#### Assigning Units to Tenants

Employees and managers can assign an available unit (including combined units) to a tenant directly from the Tenants page. The unit selector is populated by `GET /AllUnits` filtered to unoccupied units.

`GET /AllUnits` has been moved to the protected route group so that all authenticated roles can access the full unit inventory (occupied, available, and combined units).

---

### 6. Role-Based Access Control (RBAC) — Frontend

Frontend RBAC mirrors the backend permission model:

- **Delete buttons** for customers and units are hidden from employees and visible only to managers. This is enforced in both the AG Grid table view and the card view.
- **Employee Management page** is manager-only: guarded at the routing level and hidden from the dashboard navigation for non-manager roles.
- **Note deletion** buttons are only shown to the note's author or a manager.
- Backend enforcement (`403 Forbidden` on `DELETE /customers/:id` and `DELETE /units/:unit_number` for non-manager roles) remains the authoritative check; the frontend restrictions are an additional UX layer.



### Frontend Demo Video [ including unit tests ] 
- https://drive.google.com/drive/folders/1HGIRUn2conUsAknq0TIcYpxYv2ud9Nx6?usp=drive_link


### Backend Demo Videos

- [Full backend walkthrough](https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQCe4kF4Q-JCSYbu-M8zIQvKAQgFW2Ow1sT0PjMAq1yNEZk?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=86WO8p)
- [Billing unit tests](https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQB9M-0lJaRmT5nDWOS-Gm2ZAbApOE9ofcC6a6b23WSC2T0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=3V6n9g)
- [Notes unit tests](https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQBJQ8ivVHRgSJd_aVTwVAOKAUoIt-2-LjLcFsrmdtvFKNQ?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=LcdvND)
