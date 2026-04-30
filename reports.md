## Automated Billing & Inventory Reporting System

This update introduces a background billing engine and a dynamic inventory reporting system capable of generating PDF exports.

### 1. Model Enhancements
The `Unit` model has been expanded to support more granular status tracking and automated billing cycles:

* **`Reserved` (bool):** Tracks if a unit is held for a future customer.
* **`Status` (string):** Categorizes unit condition (e.g., "Normal", "Needs Cleaning", "Damaged", "Deactivated").
* **`NextDueDate` (*time.Time):** A nullable date field that drives the automated billing engine.
* **`LockoutReported` (bool):** A flag used to ensure deactivated units are only included in the lockout report once, preventing duplicate administrative actions.

---

### 2. Automated Billing Engine
A background service now manages recurring revenue without manual intervention.

* **Scheduler:** A goroutine in `main.go` triggers the billing check immediately upon server startup and thereafter every **24 hours**.
* **`CheckAndProcessStorageBilling`:**
    * Scans for occupied units where `NextDueDate` is in the past.
    * Invokes `CreateCharge` to generate invoices and ledger entries.
    * Automatically advances the `NextDueDate` by **one month** upon successful processing.

---

### 3. Inventory & Lockout Reporting
A dual-track reporting pipeline provides both facility performance data and operational "lockout" lists.

#### Daily Utilitilization Report
* **Data Aggregation:** Groups units by size to calculate occupancy percentages, gross potential income vs. actual rent, and square footage utilization.
* **PDF Export:** Generates a landscape A4 report via `gofpdf`, archived locally in `backend/forms/util`.

#### Daily Lockout Report
* **Targeting:** Specifically identifies units with a `Deactivated` status where `LockoutReported` is `false`.
* **Renter Context:** Uses GORM `Preload` to fetch Renter names and contact info directly into the report.
* **State Management:** Upon successful PDF generation, the system batch-updates the processed units to `LockoutReported = true` to clear them from the next day's queue.
* **Local Archiving:** Automatically creates the directory path `forms/lockouts/` if it does not exist and saves timestamped files (e.g., `Daily Lockouts [2026-04-29].pdf`).

---

### 4. API & Security
* **Endpoints:**
    * `GET /api/forms/util`: Generates the Inventory/Utility PDF.
    * `GET /api/forms/lockouts`: Generates the Lockout Report PDF.
* **Protection:** Both are classified as **Protected** endpoints requiring administrative privileges.
* **Delivery:** Returns a binary stream (`application/pdf`) with `Content-Disposition: attachment`.

---

### 5. Testing & Validation
The system is validated through an automated test suite in `services_test.go`:
* **Math Verification:** Ensures `PercentUtil` and `GrossIncome` calculations are accurate based on seeded test units.
* **Logic Check:** Verifies that the Lockout Report query correctly excludes units that have already been marked as reported.
* **Binary Integrity:** Checks for the **PDF Magic Number** (`%PDF-`) to ensure the `gofpdf` buffer is valid and uncorrupted.