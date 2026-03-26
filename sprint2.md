# SUIT — Sprint 2 Development Update (Backend)

**Repository:** [LRWFromFH/Storage-Unit-Integrated-Tools---SUIT](https://github.com/LRWFromFH/Storage-Unit-Integrated-Tools---SUIT/issues)  
**Team Members:**
- Sumanthra Yerrabelly | Backend
- Manasa Kallam | Frontend
- Satvik LNU | Frontend
- Alexander Martin | Backend

---

## 🔐 RBAC — Role-Based Access Control
SUIT uses role-based access control to restrict employee actions. On login, roles are embedded into a **JWT token**, allowing the backend to enforce access on every request without redundant database hits.

### Roles & Permissions
| Role | Description |
|:---|:---|
| **manager** | Full access. Can create employee accounts and modify employee roles. |
| **employee** | Standard access. Can manage customers, units, search, and the dashboard. |

* **Default State:** New accounts default to `employee`. Roles cannot be self-assigned during registration.
* **Assignment:** Managers can update roles via `POST /api/employees/:id/role`.

---

## 🛠 Core Functionality & CRUD Routes
We have implemented full CRUD (Create, Read, Update, Delete) capabilities for core business entities. All routes below are protected by the middleware chain.

### Customer Management
| Route | Action | Access |
|:---|:---|:---|
| `GET /api/customers` | List all customers | Employee/Manager |
| `POST /api/customers` | Create a new customer | Employee/Manager |
| `GET /api/customers/:id` | View specific customer | Employee/Manager |
| `POST /api/customers/:id` | Update customer details | Employee/Manager |
| `DELETE /api/customers/:id` | Remove a customer | Employee/Manager |
| `GET /api/customers/:id/units` | List units assigned to customer | Employee/Manager |

### Storage Unit Management
| Route | Action | Access |
|:---|:---|:---|
| `GET /api/units/:unit_number` | View unit details | Employee/Manager |
| `POST /api/units` | Create a new unit | Employee/Manager |
| `POST /api/units/:unit_number` | Update unit status/info | Employee/Manager |
| `POST /api/units/combine` | Merge multiple units | Employee/Manager |
| `DELETE /api/units/:unit_number` | Remove a unit | Employee/Manager |
| `GET /api/AvailableUnits` | List all vacant units | Employee/Manager |

### Administrative & Auth
| Route | Action | Access |
|:---|:---|:---|
| `POST /api/register` | Register new employee | **Manager Only** |
| `POST /api/employees/:id/role`| Change employee role | **Manager Only** |
| `GET /api/session` | Validate active session | Public |

---

## 🛡 Security & Middleware
All protected routes pass through a structured middleware chain to ensure data integrity and authorization.

### Middleware Chain
Manager-only routes specifically require a four-stage validation:
`AuthRequired` → `CSRFRequired` → `RoleRequired("manager")` → `Handler`

* **AuthRequired:** Validates the session cookie and parses the JWT into the request context.
* **CSRFRequired:** Validates that the `X-CSRF-TOKEN` header matches the `csrf_token` cookie.
* **RoleRequired:** Reads the role from context; returns `403 Forbidden` if requirements aren't met.
* **Session Persistence:** Sessions now persist through page refreshes and server restarts by reading the token to locate the active session.

---

## 📦 Data & Testing

# Testing Documentation
 
## Overview
 
This project includes both **unit tests** (Vitest) and **end-to-end tests** (Cypress) for the Tenants and Units features of the Angular application.
 
---
 
## Unit Tests
 
Unit tests are written using **Vitest** and **Angular's TestBed**.
 
### Tenants Component (`tenants.spec.ts`)
 
Tests for the `Tenants` component with mocked dependencies (`TenantsService`, `MatDialog`, `MatSnackBar`).
 
| Test | Description |
|------|-------------|
| should create the component | Verifies the component instantiates successfully |
| should load customers on init | Confirms `getCustomers()` is called on `ngOnInit` |
| should toggle between table and grid view | Validates `toggleView()` switches `viewMode` correctly |
 
**Mocked Services:**
- `TenantsService` — stubs `getCustomers`, `createCustomer`, `updateCustomer`, `deleteCustomer` (all return `of([])` / `of({})`)
- `MatDialog` — stubs `open()` returning `{ afterClosed: () => of(null) }`
- `MatSnackBar` — stubs `open()`
 
---
 
### Units Component (`units.spec.ts`)
 
Tests for the `Units` component with mocked dependencies (`UnitsService`, `MatDialog`, `MatSnackBar`).
 
| Test | Description |
|------|-------------|
| should create the component | Verifies the component instantiates successfully |
| should load units on init | Confirms `getUnits()` is called on `ngOnInit` |
| should set units after loading | Checks that `units` and `filteredUnits` are populated from the service response |
| should toggle between table and grid view | Validates `toggleView()` switches `viewMode` correctly |
| should call deleteUnit service | Confirms `deleteUnit()` calls the service when the user confirms the dialog |
 
**Mocked Services:**
- `UnitsService` — stubs `getUnits`, `createUnit`, `updateUnit`, `deleteUnit`
- `MatDialog` — stubs `open()` returning `{ afterClosed: () => of(null) }`
- `MatSnackBar` — stubs `open()`
 
---
 
### Running Unit Tests
 
```bash
npx vitest
```
 
---
 
## End-to-End Tests
 
E2E tests are written using **Cypress** and require the Angular dev server to be running at `http://localhost:4200`.
 
### Prerequisites
 
- The Angular app must be running: `ng serve`
- A `cy.login()` custom command must be defined in `cypress/support/commands.ts`
 
---
 
### Tenants Page (`tenants.cy.ts`)
 
| Test | Description |
|------|-------------|
| loads the tenants page | Checks that "Tenant Management" heading is visible |
| shows table view with data | Verifies `ag-grid-angular` exists and sample data (e.g. "John") is rendered |
| can switch to grid view | Clicks "Grid View" and asserts `.tenant-card` elements appear |
| can switch back to table view | Toggles to Grid View then back, confirms AG Grid is restored |
| has Back to Dashboard button | Clicks the button and asserts URL navigates to `/dashboard` |
 
---
 
### Units Page (`units.cy.ts`)
 
| Test | Description |
|------|-------------|
| loads the units page | Checks that "Unit Management" heading is visible |
| shows table view with data | Verifies `ag-grid-angular` exists and sample data (e.g. "Unit 100") is rendered |
| can switch to grid view | Clicks "Grid View" and asserts `.unit-card` elements appear |
| can switch back to table view | Toggles to Grid View then back, confirms AG Grid is restored |
| has Back to Dashboard button | Clicks the button and asserts URL navigates to `/dashboard` |
 
---
 
### Running E2E Tests
 
```bash
# Open Cypress Test Runner (interactive)
npx cypress open
 
# Run headlessly (CI)
npx cypress run
```
 
---
 
## Project Structure
 
```
cypress/
  e2e/
    tenants.cy.ts       # E2E tests for Tenants page
    units.cy.ts         # E2E tests for Units page
  support/
    commands.ts         # Custom commands (e.g. cy.login())
 
src/
  app/
    tenants/
      tenants.ts        # Tenants component
      tenants.service.ts
      tenants.spec.ts   # Unit tests
    units/
      units.ts          # Units component
      units.service.ts
      units.spec.ts     # Unit tests
```
 
---
 
## Notes
 
- Unit tests use `provideRouter([])` to satisfy Angular Router dependencies without a full routing setup.
- `window.confirm` is spied on in the `deleteUnit` unit test to simulate user confirmation.
- E2E tests include a `cy.wait(2000)` buffer to allow Angular to fully bootstrap before assertions run.
- Adjust sample data values in E2E tests (e.g. `"Unit 100"`, `"John"`) to match your actual seed/mock data.

### Initial Seeding (Development)
Upon initialization, the database is automatically populated to facilitate testing:
* **144** Basic Test Customers
* **120** Storage Units
* **Default Manager Account:** If the database is empty, a seed account is created:
    * *Email:* `manager@suit.com` | *Password:* `Manager123!`

### Validation
* **Executable Test Suites:** Added for all CRUD routes to validate response codes and data integrity.

### Unit Test Documentation

| Test Function | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `TestGetAllCustomers` | **GET** | `/api/customers` | Verifies the retrieval of all customer records. |
| `TestGetCustomer` | **GET** | `/api/customers/:id` | Verifies retrieval of a specific customer by ID. |
| `TestUpdateCustomer` | **POST** | `/api/customers/:id` | Validates updating existing customer details (e.g., FirstName). |
| `TestCreateCustomer` | **POST** | `/api/customers` | Ensures new customer records can be created successfully. |
| `TestDeleteCustomer` | **DELETE** | `/api/customers/:id` | Verifies the deletion of a customer record. |
| `TestGetCustomerUnits` | **GET** | `/api/customers/:id/units` | Verifies retrieval of all storage units assigned to a specific customer. |
| `TestGetAllUnits` | **GET** | `/api/AvailableUnits` | Checks the retrieval of all currently available storage units. |
| `TestGetUnit` | **GET** | `/api/units/:unit_number` | Verifies retrieval of specific unit details by unit number. |
| `TestUpdateUnit` | **POST** | `/api/units/:unit_number` | Validates updating unit properties (e.g., UnitNumber). |
| `TestCreateUnit` | **POST** | `/api/units` | Ensures new storage units can be added to the system. |
| `TestDeleteUnit` | **DELETE** | `/api/units/:unit_number` | Verifies the removal of a storage unit from the database. |

* **Manual Testing:** All routes have been verified to ensure the middleware correctly blocks unauthorized access.

---

## 🚀 Upcoming Scope
The roadmap for the next sprint includes:
* Unit Reservation logic.
* Creating a Ledger system.
* Billing and Invoice implementation

---

## Frontend Video:

https://1drv.ms/v/c/d28ebc8a2329bdff/IQBoHT5cYm8zTpvpkMOLX3jyAbpOLhw2EnjsWlD7paDJkgI?e=bBw2CK

## Backend Video:

https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQDh8yvDO9pHRovU9Y2c8ml1AVXJrUPSE9hiy8zX_oYYiM0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=wzcQ6i

CRUD unit test sample:
https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQAXJuNDHHCbSq6RvMPk7HEnAdg-o6SI7D2hTqRGs1RtH_Q?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=teWJNj

---
