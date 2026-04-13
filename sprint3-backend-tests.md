# SUIT — Sprint 3 Backend Unit Tests (Sumanthra Yerrabelly)

**Files:** `backend/controllers/CRUD_test.go`, `backend/controllers/auth_test.go`
**Run:** `go test ./controllers/... -v` from the `backend/` directory

---

## Test setup

All tests share a single in-memory SQLite database (`file::memory:?cache=shared`) initialized by `database.ConnectTest()`. Every test calls `setupTestRouter()` which:

1. Connects to the in-memory DB and runs AutoMigrate
2. Seeds a manager account (`manager@suit.com` / `Manager123!`, role `manager`) directly into the DB
3. Registers all routes on a fresh Gin engine in test mode

Because the DB is shared across tests in the same process, each test uses unique identifiers (unit numbers, emails) to avoid unique constraint collisions.

---

## Helper functions

| Helper | What it does |
|---|---|
| `setupTestRouter()` | Sets up the in-memory DB, seeds manager, registers all routes |
| `registerUser(r, body)` | POSTs to `/api/register`, returns the recorder |
| `loginUser(r, body)` | POSTs to `/api/login`, returns the recorder (with cookies) |
| `getCookie(w, name)` | Extracts a named cookie from a response recorder |
| `attachCookies(req, w)` | Copies all cookies from a login response onto a new request |
| `getCSRFToken(w)` | Reads the `csrf_token` cookie value from a login response |
| `boilerplate(t, input, method, api, r)` | Registers+logs in a test employee, sends an authenticated request, asserts `200 OK`, returns the parsed JSON response |

---

## Notes tests

### `TestGetNotes`
**File:** `CRUD_test.go:565`

**Setup:** Creates a customer and seeds a note directly in the DB with `AuthorID: 1`.

**What it does:** Calls `GET /api/customers/1/notes` via `boilerplate`.

**Assertions:**
- Response is `200 OK`
- `notes` array in the response is non-empty
- First note has a `Content` field

---

### `TestCreateNote`
**File:** `CRUD_test.go:539`

**Setup:** Creates a customer directly in the DB.

**What it does:** Calls `POST /api/customers/1/notes` with body `{ "content": "Customer called about late payment" }`.

**Assertions:**
- Response is `200 OK`
- Response contains a `note` object
- `note.Content` matches the value sent

**Key design decision:** `AuthorID` is not sent in the request body — the test verifies the handler sets it from the session.

---

### `TestDeleteNote`
**File:** `CRUD_test.go:408`

**Setup:**
1. Creates a customer in the DB
2. Registers and logs in a real employee (`note_author@test.com`)
3. Looks up that employee's actual DB ID via `database.DB.Where(...).First(&author)`
4. Seeds a note with `AuthorID` set to that employee's real ID

**What it does:** Sends `DELETE /api/customers/:id/notes/:nid` using the author's session. Both IDs are dynamic (`fmt.Sprintf`) — not hardcoded — because the shared DB accumulates IDs across tests.

**Assertions:**
- Response is `200 OK`

---

### `TestDeleteNote_Forbidden`
**File:** `CRUD_test.go:454`

**Setup:**
1. Creates a customer in the DB
2. Seeds a note with `AuthorID: 999` (a non-existent employee, meaning no currently logged-in user is the author)
3. Registers and logs in a regular employee (`employee@test.com`)

**What it does:** The employee attempts to delete a note they did not write. Uses dynamic URL with actual customer and note IDs.

**Assertions:**
- Response is `403 Forbidden`

---

### `TestDeleteNote_Manager`
**File:** `CRUD_test.go:499`

**Setup:**
1. Creates a customer in the DB
2. Seeds a note with `AuthorID: 999` (written by someone else)
3. Logs in as the pre-seeded manager (`manager@suit.com`)

**What it does:** The manager attempts to delete a note they did not write. Uses dynamic URL.

**Assertions:**
- Response is `200 OK` — manager override works

---

## Insurance tests

### `TestGetInsurance`
**File:** `CRUD_test.go:599`

**Setup:**
1. Creates a unit with unit number `INS-TEST-001` directly in the DB
2. Seeds an insurance record linked to that unit directly in the DB

**What it does:** Calls `GET /api/units/INS-TEST-001/insurance` via `boilerplate`.

**Assertions:**
- Response is `200 OK`
- Response contains an `insurance` object
- `ProviderName` and `PolicyNumber` fields are present

**Why `INS-TEST-001`:** Unique unit number prevents unique constraint conflicts with other tests that also create units.

---

### `TestCreateInsurance`
**File:** `CRUD_test.go:631`

**Setup:** Creates a unit with unit number `INS-CREATE-001`. No insurance record exists yet.

**What it does:** Calls `POST /api/units/INS-CREATE-001/insurance` with full insurance payload:
```json
{
  "provider_name": "SafeGuard Insurance",
  "policy_number": "POL-CREATE-001",
  "coverage_limit": 5000.00,
  "expiry_date": "2027-01-01T00:00:00Z"
}
```

**Assertions:**
- Response is `200 OK`
- Response contains an `insurance` object with `ProviderName` and `PolicyNumber`

---

### `TestUpdateInsurance`
**File:** `CRUD_test.go:662`

**Setup:**
1. Creates a unit with unit number `INS-UPDATE-001`
2. Seeds an existing insurance record (`Old Provider`, `OLD-POL-001`, coverage `1000.00`) directly in the DB

**What it does:** Calls `POST /api/units/INS-UPDATE-001/insurance` with updated values (`New Provider`, `NEW-POL-001`, coverage `9000.00`). This is the same endpoint as create — the upsert path.

**Assertions:**
- Response is `200 OK`
- `insurance.ProviderName` in the response equals `"New Provider"` — confirms the existing record was updated, not a new one created

**What this test specifically proves:** Calling `POST` on a unit that already has insurance updates it in place rather than creating a duplicate.

---

## Test isolation notes

- **Shared in-memory DB:** The `cache=shared` SQLite URL means all tests in the same process share one DB. IDs auto-increment across tests.
- **Dynamic IDs:** All delete tests use `fmt.Sprintf("/api/customers/%d/notes/%d", customer.ID, note.ID)` instead of hardcoded paths like `/notes/1`. This prevents failures when earlier tests have already consumed lower IDs.
- **Unique unit numbers:** Each insurance test uses a distinct unit number (`INS-TEST-001`, `INS-CREATE-001`, `INS-UPDATE-001`) to avoid unique constraint errors from other tests creating the same unit.
- **Manager seed:** The manager is seeded once in `setupTestRouter()`. If a test tries to re-seed the same email, GORM logs a unique constraint warning but the existing record is used — tests are not affected.
