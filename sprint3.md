# SUIT — Sprint 3 Development Update

**Repository:** [LRWFromFH/Storage-Unit-Integrated-Tools---SUIT](https://github.com/LRWFromFH/Storage-Unit-Integrated-Tools---SUIT/issues)  
**Team Members:**
- Sumanthra Yerrabelly | Backend
- Manasa Kallam | Frontend
- Satvik LNU | Frontend
- Alexander Martin | Backend

---

## **Branch:** `backendv_latest`
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

### Test coverage

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


# Billing & Ledger System

This module handles financial transactions, balance tracking, and ledger management. Core logic is located in `services/billing.go`.

### 📡 API Endpoints

All endpoints require active session validation and standard security headers.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/customers/:id/balance` | `GET` | Returns a `float64`. A **negative** value indicates an outstanding balance (debt). |
| `/customers/:id/transactions` | `GET` | Returns a list of transactions to populate the frontend ledger. |
| `/PostPayment` | `POST` | Receives PaymentRequest from frontend to apply payment via billing's RecordPayment. |

```go
type PaymentRequest struct {
		CustomerID  uint    `json:"customer_id" binding:"required"`
		Unit        uint    `json:"unit_id"`
		Amount      float64 `json:"amount" binding:"required"`
		Description string  `json:"description"`
	}
```

---

### ⚙️ Core Logic (`billing.go`)

The billing service manages the creation of charges and the recording of payments. 

#### Function Headers
```go
func CreateCharge(customerID uint, unitID uint, amount float64, desc string) error

func RecordPayment(customerID uint, unitID uint, amount float64, desc string) error
```

#### Balance Calculation
* **`GetUnitBalance`** / **`GetCustomerBalance`**: These functions return a `float64` representing the current balance derived from the sum of all invoices and payments.

---

### 📑 Business Rules & Logic

* **Ledger Entries**: Every charge and payment is automatically recorded as an entry in the ledger.
* **Associations**: The system uses a **loose/naive association** between invoices and ledger entries. 
    * A **Payment** must be linked to a **Charge**.
    * A **Charge** can exist independently (awaiting payment).
* **Overpayment**: 
    * The system accurately updates the total balance during an overpayment.
    * However, the specific invoice association may not be precise. Overpayments are tracked as part of the overall balance logic.

---
## 🧪 Test Suite Reference

The following table outlines the validation logic implemented in the test suite to ensure financial data integrity.

| Test Function | Objective | Expected Outcome |
| :--- | :--- | :--- |
| `TestCreateCharge` | Verify charge initialization. | Creates "unpaid" invoice; appends negative entry to ledger. |
| `TestRecordPaymentAndBalance` | Verify standard payment flow. | Invoice status becomes "paid"; customer balance returns to `0.0`. |
| `TestOverpayment` | Verify credit handling. | Balance reflects a positive credit (e.g., `+400.0`) on the ledger. |
| `TestUnderpayment` | Verify partial payment logic. | Balance reflects a remaining negative debt (e.g., `-50.0`). |
| `TestTransactionRollback` | Verify DB atomicity. | If ledger entry fails, the entire transaction (including invoice creation) rolls back. |
---

### 🛠 Roadmap

- [ ] **Payment Reversals**: Scheduled for the next sprint.
- [ ] **On-Demand Invoicing**: Implementation of automated invoice generation for overpayment scenarios.
- [ ] **Reporting**: Autogenerated financial reports (Initial implementation started).
---
## Video Backend Team:
https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQCe4kF4Q-JCSYbu-M8zIQvKAQgFW2Ow1sT0PjMAq1yNEZk?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=86WO8p

### Backend - Billing unit tests video:
https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQB9M-0lJaRmT5nDWOS-Gm2ZAbApOE9ofcC6a6b23WSC2T0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=3V6n9g

