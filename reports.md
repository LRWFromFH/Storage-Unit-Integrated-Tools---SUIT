## Automated Billing & Inventory Reporting System

This update introduces a background billing engine and a dynamic inventory reporting system capable of generating PDF exports.

---

### 1. Model Enhancements
The `Unit` model has been expanded to support more granular status tracking and automated billing cycles:

* **`Reserved` (bool):** Tracks if a unit is held for a future customer.
* **`Status` (string):** Categorizes unit condition (e.g., "Normal", "Needs Cleaning", "Damaged").
* **`NextDueDate` (*time.Time):** A nullable date field (formatted as `type:date` in the DB) that drives the automated billing engine.

---

### 2. Automated Billing Engine
A background service now manages recurring revenue without manual intervention.

* **Scheduler:** A goroutine in `main.go` triggers the billing check immediately upon server startup and thereafter every **24 hours** using a `time.Ticker`.
* **`CheckAndProcessStorageBilling`:** * Scans for occupied units where `NextDueDate` is in the past.
    * Safely handles `nil` due dates to prevent runtime panics.
    * Invokes `CreateCharge` to generate invoices and ledger entries.
    * Automatically advances the `NextDueDate` by **one month** upon successful processing.

---

### 3. Inventory & Utility Reporting
A new reporting pipeline provides a comprehensive overview of facility performance.

#### Data Aggregation
The `GenerateInventoryReport` function groups all units by size and calculates:
* **Occupancy Metrics:** Total rooms, occupied vs. vacant counts, and percentage utilization.
* **Financial Metrics:** Gross potential income, actual rent collected, and rent per square foot.
* **Physical Metrics:** Total square footage and occupied square footage.

#### PDF Export (`gofpdf`)
The system utilizes the `gofpdf` library to generate landscape A4 reports natively (eliminating external dependencies like `wkhtmltopdf`).
* **Local Archiving:** Generated reports are automatically saved to `backend/forms/util` with a timestamped filename (e.g., `Daily Utility [Date].pdf`).
* **Scheduler:** A goroutine in `main.go` triggers the immediately upon server startup and thereafter every **24 hours** using a `time.Ticker`.

---

### 4. API & Security
* **Endpoint:** `GET /api/forms/util`
* **Protection:** Classified as a Protected endpoint.
* **Delivery:** Returns the PDF as an `application/pdf` stream with a `Content-Disposition: attachment` header to trigger browser downloads.

---

### 5. Testing & Validation
The `TestUtilPDFDownload` suite ensures the integrity of the reporting system by:
* Verifying the **PDF Magic Number** (`%PDF-`) in the response body to ensure the binary stream is valid.

# Automated Billing & Inventory Reporting System

This update introduces a background billing engine, a dynamic inventory reporting system, and a **dedicated lockout management pipeline** capable of generating professional PDF exports.

---

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

#### Inventory & Utility Report
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