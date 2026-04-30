# Sprint 4

## Frontend Overview

Sprint 4 focused on three new frontend features, comprehensive test coverage (unit + Cypress), and UI polish across the SUIT application.

---

## Features Implemented

### 1. Inventory Report PDF Download

**Backend endpoint:** `GET /api/forms/util`

The backend generates a daily inventory PDF (unit mix, occupancy rates, gross income) using the `gofpdf` library and streams it as `application/pdf`.

**Frontend integration:**

- Added `downloadUtilReport(): Observable<Blob>` to `UnitsService` — issues a `GET /api/forms/util` with `responseType: 'blob'`.
- Added `downloadReport()` method to `Dashboard` — receives the blob, creates a temporary object URL, programmatically clicks an `<a>` element to trigger the browser's native download, then immediately revokes the URL.
- Added a **Reports** card to the dashboard grid (visible to all authenticated users). The card contains a "Download Inventory Report" button that disables itself while the request is in flight and re-enables after the download completes or errors.
- If the server returns an error, a `MatSnackBar` toast is shown: *"Failed to generate report"*.

---

### 2. Deassign Unit from Tenant (Manager Only)

**Backend endpoint:** `POST /api/units/:unit_number/moveout`

The moveout endpoint clears `customer_id` and `next_due_date`, resets the unit status to normal, and cancels any active reservation for that tenant/size combination.

**Frontend integration:**

- Added `moveout(unitNumber: string): Observable<any>` to `UnitsService`.
- Added `deassignUnit(unitNumber: string, customerId: number)` to the `Tenants` component. Calls `window.confirm` for a destructive-action guard, then calls `unitsService.moveout(unitNumber)`. On success: clears the cached units for that customer and re-fetches. On error: shows a snackbar.
- In the **Grid View**, each unit chip now shows a `link_off` icon button (manager-only, `@if (auth.isManager())`). The button is styled inside an updated `.unit-chip` flex layout so it sits flush to the right of the unit info without breaking the chip's compact design.

---

### 3. UI Enhancements

- **View toggle labels** on both the Tenants and Units pages changed from "Table" / "Grid" to **"Table View"** / **"Grid View"** for clearer affordance.
- **Reports card** added to the dashboard grid with feature-list bullets (inventory, occupancy, income) matching the visual style of the Units and Tenants cards.
- **Download button state** — button text changes to "Generating…" and is disabled during the API call so users cannot double-submit.
- **Unit chip layout** — chips in the tenant units panel now use a flex row so the info text and the deassign icon button sit on the same line without wrapping.

---

## Unit Tests

All unit tests use **Vitest** + **Angular TestBed** with `provideNoopAnimations()`.

### Dashboard — `dashboard.spec.ts`

| Test | What it verifies |
|------|-----------------|
| should create the component | Component instantiates without error |
| should call getAllUnits and getCustomers on init | Both service calls triggered in `loadStats()` |
| should set totalUnits from loaded units | KPI value populated correctly |
| should calculate occupiedUnits correctly | Only units with non-null `CustomerID` counted |
| should set totalTenants from loaded customers | Tenant count reflects response length |
| should set statsLoading to false after both requests complete | Loading flag cleared when both finish |
| should set statsLoading to false even if units request fails | Error path also clears the flag |
| should start with empty search results | `searchResults` is null on mount |
| should clear search results when query is emptied | `onSearchInput('')` resets state |
| should clear search and results on clearSearch() | `clearSearch()` resets query, results, and flag |
| should return false for hasResults when results are empty | Computed property when arrays are empty |
| should return true for hasResults when customers exist | Computed property when customers present |
| should return true for noResults when results are set but empty | Computed property for "no match" state |
| should call downloadUtilReport on downloadReport() | Service method invoked |
| should set downloadingReport to true during download | Flag set synchronously before subscribe resolves |
| should show snackbar and reset flag on download error | Error handling path |

### Tenants — `tenants.spec.ts` (additions)

| Test | What it verifies |
|------|-----------------|
| should call moveout with the correct unit number on deassign | Correct API call |
| should show success snackbar after successful deassign | Success message displayed |
| should show error snackbar when deassign fails | Error handling path |
| should not call moveout when confirm is cancelled | Guard against accidental deassign |
| should clear unit cache and re-expand after deassign | Cache invalidated; units re-fetched |

### Units — `units.spec.ts` (additions)

| Test | What it verifies |
|------|-----------------|
| should filter units by query string | Text filter on `UnitNumber` |
| should filter units by size type | Size type filter |
| should filter units by max budget | Budget cap filter |
| should show all units when filters are reset | No filter shows all |
| should open insurance dialog for a unit | `openInsuranceDialog` passes correct data |

---

## Cypress E2E Tests

All Cypress tests require the Angular dev server (`ng serve`) and backend (`go run main.go`) to be running. Login uses the seed credentials in `cypress/support/commands.ts`.

### Dashboard — `cypress/e2e/dashboard.cy.ts`

| Test | What it verifies |
|------|-----------------|
| loads the dashboard after login | URL contains `/dashboard` |
| renders the KPI strip with three stat cards | Total Units, Occupancy, Active Tenants visible |
| renders the Units navigation card | Card + Enter Units button present |
| renders the Tenants navigation card | Card + Enter Tenants button present |
| renders the Reports card with download button | Card + Download Inventory Report button present |
| navigates to /units when Enter Units is clicked | Routing works |
| navigates to /tenants when Enter Tenants is clicked | Routing works |
| has a global search field | Search input present |
| shows search results when a query is typed | Results or empty state appears |
| clears search results when the clear button is clicked | Results cleared on `close` click |
| shows the Download Inventory Report button | Button visible and enabled |
| calls the /api/forms/util endpoint when button is clicked | Network request intercepted |
| disables the download button while report is generating | Button disabled during slow request |
| loads numeric values into the KPI cards | Shimmer placeholders replaced by numbers |

### Tenants — `cypress/e2e/tenants.cy.ts`

| Test | What it verifies |
|------|-----------------|
| loads the tenants page | Page heading visible |
| shows the ag-grid table by default | Grid component mounted |
| has an Add Customer button | Button present |
| navigates back to dashboard | Back button routing |
| can switch to grid view and back to table view | View toggle |
| opens the add customer dialog when Add Customer is clicked | Dialog opens |
| closes the dialog without saving when Cancel is clicked | Dialog dismissed cleanly |
| has a search field that accepts input | Filter input works |
| displays expected column headers in table view | ID, First Name, Last Name, Email, Actions |
| shows View Units button on each card in grid view | Button exists on cards |
| expands the units panel when View Units is clicked | Panel appears |
| shows loading state briefly then shows units or empty message | No stuck loading spinner |
| collapses the units panel when Hide Units is clicked | Panel disappears |
| shows the Assign Unit button inside the units panel | `+ Assign Unit` button present |
| opens assign unit dialog when Assign Unit is clicked | Dialog opens |
| shows deassign button on occupied units for manager | `.deassign-btn` exists when units assigned |
| shows Edit, Billing, and Notes buttons for each card | Action buttons present in grid view |
| opens billing dialog when Billing is clicked | Dialog opens |
| opens notes dialog when Notes is clicked | Dialog opens |

### Units — `cypress/e2e/units.cy.ts`

| Test | What it verifies |
|------|-----------------|
| loads the units page | Page heading visible |
| shows the ag-grid table by default | Grid mounted |
| has an Add Unit button | Button present |
| has a Combine Units button | Button present |
| navigates back to dashboard | Back button routing |
| can switch to grid view and back to table view | View toggle |
| has a search input in the filter bar | Input present |
| has a Size filter dropdown | Dropdown present |
| has a Max Budget filter input | Input present |
| table view shows Status column | Column header exists |
| grid view shows status badges on unit cards | `.suit-badge` present |
| status badge shows Available or Occupied text | Badge text matches regex |
| displays expected column headers | Unit #, Size Type, Price, Actions |
| opens the add unit dialog when Add Unit is clicked | Dialog opens |
| closes the dialog without saving when Cancel is clicked | Dialog dismissed cleanly |
| opens the combine dialog when Combine Units is clicked | Dialog opens (if 2+ available) |
| shows Edit and Insurance buttons on unit cards in grid view | Action buttons present |
| opens insurance dialog when Insurance button clicked | Dialog opens |

---

## How to Run Tests

### Unit Tests (Vitest)
```bash
cd frontend
npm test
```

### Cypress E2E Tests (interactive)
```bash
# Terminal 1 — start backend
cd backend && go run main.go

# Terminal 2 — start frontend
cd frontend && ng serve

# Terminal 3 — open Cypress
cd frontend && npx cypress open
```

### Cypress E2E Tests (headless CI)
```bash
cd frontend && npx cypress run
```
## Backend Overview
Sprint 4 focused on automated tasks such as report generation, billing cycles, lockouts, and reservations.

---

### 1. Automated Billing Engine

A background service that automates recurring monthly revenue by monitoring unit due dates. This replaces manual invoice generation for storage rentals and ensures consistent cash flow.

#### What changed

- `main.go` — Added a background goroutine and `time.Ticker` (24-hour interval).
- `services/billing.go` — Implemented `CheckAndProcessStorageBilling` to scan for past-due units.
- `models/unit.go` — Ensured `NextDueDate` is properly utilized for logic triggers.

#### Business rules

- **Scheduler:** Runs immediately on server start, then every 24 hours thereafter.
- **Auto-Advance:** Upon a successful charge, the `NextDueDate` is automatically advanced by **one month**.
- **Safety:** Skips units with `nil` due dates (vacant units) to prevent runtime panics.

---

### 2. Unit Management: Move-Outs & Deactivation

Enhanced the lifecycle of a unit rental, specifically handling the end of a tenancy and the identification of delinquent accounts for physical lockout.

#### Files changed

- `controllers/controller.go` — `MoveOut`, `GetDeactivatedUnits` handlers.
- `routes/routes.go` — Added move-out and deactivated list endpoints.
- `models/unit.go` — Defined statuses for `Normal` vs `Deactivated`.

#### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/DeactivatedUnits` | Protected | List all units with status `Deactivated` |
| `POST` | `/api/units/:unit_number/moveout` | Protected | Process customer move-out and reset unit |

#### Business rules

- **Move-out Reset:** Clears `CustomerID` and `NextDueDate`, and resets status to `Normal`.
- **Reservation Cleanup:** Moving a customer out automatically cancels any active reservations that customer held for that specific unit size.
- **Lockout Identification:** `DeactivatedUnits` preloads the Renter data to assist staff in generating physical lockout lists.

---

### 3. Inventory & Lockout PDF Reporting

A dynamic reporting pipeline utilizing the `gofpdf` library to generate administrative documents. Reports are both streamed to the client as downloads and archived locally on the server for record-keeping.

#### Files changed

- `services/reports.go` — Logic for `GenerateInventoryReport` and `GenerateLockoutReport`.
- `controllers/controller.go` — `GetLockoutReport` and `GetInventoryReport` (Utility) handlers.
- `models/unit.go` — Added `LockoutReported` (bool) field to track report state.

#### API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/forms/util` | Protected | Download Daily Inventory/Utility PDF |
| `GET` | `/api/forms/lockouts` | Protected | Download Daily Lockout PDF |

#### Business rules

- **State Management:** When a Lockout PDF is generated, all included units are batch-updated to `LockoutReported = true` to prevent duplicate entries on subsequent reports.
- **Local Archiving:** Reports are saved to `forms/util/` and `forms/lockouts/` using timestamped filenames. Directories are created programmatically via `os.MkdirAll`.
- **Inventory Math:** Calculations include Occupancy %, Gross Potential Income, and Rent per Square Foot.

---

### Backend Test Coverage

All core reporting logic and unit lifecycle handlers have been validated via `services_test.go` and `controllers/CRUD_test.go`.

**Reporting & Billing Services**

| Test Function | Objective | Expected Outcome |
|---|---|---|
| `TestGenerateInventoryReport` | Verify size grouping and math | Correctly aggregates units by SizeType; confirms utility % |
| `TestGenerateLockoutReport` | Verify query filtering | Only fetches `Deactivated` units where `LockoutReported` is false |
| `TestExportInventoryPDF` | Verify PDF buffer | Returns valid byte stream starting with `%PDF-` |
| `TestCheckAndProcessBilling` | Verify scheduler logic | Charges units with past-due dates and advances `NextDueDate` |

**Unit Lifecycle & Endpoints**

| Test Function | Objective | Expected Outcome |
|---|---|---|
| `TestMoveOut` | Verify unit reset | `CustomerID` and `NextDueDate` become `nil` |
| `TestMoveOut_CancelsActiveReservation` | Verify cleanup logic | Associated reservation status changes to `cancelled` |
| `TestGetDeactivatedUnits` | Verify filtering | Normal units are excluded; Renter data is preloaded |
| `TestLockoutPDFDownload` | Verify side-effects | Unit is marked `LockoutReported = true` after successful download |
---
## Backend Video
https://drive.google.com/file/d/18z5ay39iePkiGnopJDdLk5TgYXsFa_tb/view?usp=sharing

## Frontend Video
