## Automated Billing & Inventory Reporting System

This update introduces a background billing engine and a dynamic inventory reporting system capable of generating professional PDF exports.

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
* **Protection:** The route is protected by authentication and CSRF middleware.
* **Delivery:** Returns the PDF as an `application/pdf` stream with a `Content-Disposition: attachment` header to trigger browser downloads.

---

### 5. Testing & Validation
The `TestUtilPDFDownload` suite ensures the integrity of the reporting system by:
* Verifying the **PDF Magic Number** (`%PDF-`) in the response body to ensure the binary stream is valid.