# Sprint 1 — Storage Unit Integrated Tools (SUIT)

   
**Repository:** [LRWFromFH/Storage-Unit-Integrated-Tools---SUIT](https://github.com/LRWFromFH/Storage-Unit-Integrated-Tools---SUIT/issues)  
**Team Members:** 
- Sumanthra Yerrabelly | Backend
- Manasa Kallam | Frontend
- Satvik LNU | Frontend
- Alexander Martin | Backend


---

## User Stories

### US-01 · Automated Report Generation & Dashboard Notifications
> *As a manager, I have a lot of paperwork for the store that must be saved for the monthly meeting and performance review. Some reports are not available until certain times in the day due to timezone differences between the East Coast and the West Coast HQ. As such, I sometimes forget to save and print certain reports.*

**Acceptance Criteria:**
- Reports are automatically generated, dated, and saved to a specified directory.
- A dashboard notification reminds management about printing daily paperwork.
- Notifications can be dismissed and/or snoozed.

---

### US-02 · Unit Availability & Reservations
> *As a Customer Service Representative, I sometimes create reservations on units for customers. As such, I need access to the most up-to-date number of units and types available.*

**Acceptance Criteria:**
- Customers can have unit type(s) associated with a future transaction.
- Availability report includes reserved units.
- Reservation auto-populates move-in fields with a smaller, necessary set of information.
- Reservation does **not** block remaining units from being moved in.
- If units become unavailable, a report is triggered for the manager.
- Reservation is only valid until a time specified by the customer; duration is set by management in settings.

---

### US-03 · Account Creation
> *As an employee in a management position, I want to register my team so that all employees can use the storage system to move in customers.*

**Acceptance Criteria:**
- Managers and Assistant Managers can create accounts for other employees.
- Lower-level employees cannot create accounts.

---

### US-04 · Role Assignment & Permission Management
> *As a manager, I want to be able to change employee roles so that my team has the correct level of system access.*

**Acceptance Criteria:**
- Management positions can change roles and/or permissions for lower-level employees as needed.
- Lower-level employees cannot change the role and/or permissions of higher-level employees.

---

### US-05 · Visual Sitemap on Unit Assignment Page
> *As a Customer Service Representative, I need to dynamically pick a storage room for the customer. Having access to a sitemap showing available units on the move-in page would greatly speed up the process.*

**Acceptance Criteria:**
- Visual sitemap with highlighted available units displayed on the unit assignment page.

---

### US-06 · Quick Task & Form Access
> *As an employee who opens and closes the store, I want quick access to forms and the ability to send to printer, so that I can print and file my daily status forms.*

**Acceptance Criteria (choose one path):**

- **Form Access:** Create a user-specified list of quick links to forms.
- **Task Automation:** User-specified task system for automatically generating and printing paperwork.

---

### US-07 · Edit Reserved Unit Type
> *As a Customer Service Representative, I create reservations on storage units for customers to rent a unit in the future. Sometimes the customer isn't sure what type of unit they will need and I need to change the unit size on the reservation.*

**Acceptance Criteria:**
- Reservations allow unit type selection to be adjusted after creation.

---

### US-08 · Ongoing Move-In Records
> *As a Customer Service Representative, I sometimes need to access an ongoing Move-In from another machine as business needs shift which counter is in use at a given time. As such, I should be able to access unfinished Move-In records to avoid restarting the process.*

**Acceptance Criteria:**
- A temporary log of in-progress move-in records is maintained until:
  - Cancelled by the user.
  - Timed out — no changes within X timeframe (timeframe set by management).
  - Completed successfully.

---

### US-09 · Cancel & Recover Reservations
> *As a Customer Service Representative, I have customers whose plans can change and sometimes need to cancel storage reservations. As such, I need an easy way to cancel and recover cancelled reservations.*

**Acceptance Criteria:**
- Reservations can be easily cancelled.
- Cancelled reservations can be recovered.

---

### US-10 · Dashboard Stats Table
> *As a manager, I want a quick-glance statistics table on the dashboard so that I can monitor store performance without running a full report.*

**Acceptance Criteria:**
- Dashboard displays a summary stats table (occupancy, revenue, reservations, etc.).
- Data refreshes automatically.

---

### US-11 · Search Capability
> *As any system user, I want a quick search function so that I can locate customers, units, or records without navigating through multiple menus.*

**Acceptance Criteria:**
- Global search bar accessible from any page.
- Returns relevant results across customers, units, and reservations.

---

### US-12 · Lockout Form Discrepancies
> *As a manager, I need a way to log and track lockout form discrepancies so that audit records remain accurate and accountable.*

**Acceptance Criteria:**
- System flags and records discrepancies in lockout forms.
- Discrepancy log is accessible to management.

---

## Issues Planned

| No. | Title |
|-----|-------|
| 1 | Lockout Form Discrepancies |
| 2 | Ongoing Move-In Records |
| 3 | Cancel/Recover Reservation |
| 4 | Edit Reserved Unit Type |
| 5 | Map on Unit Assignment |
| 6 | Quick Tasks |
| 7 | Search Quick Capability |
| 8 | Dashboard Stats Table |
| 9 | Role Assignment |
| 10 | Account Creation |

---

##  Successfully Completed

| No. | Title | Type |
|-----|-------|------|
| 1 | Initialise Angular Project | Frontend |
| 2 | Implement Basic Angular Routing | Frontend |
| 4 | Implement HTTP Server in Go Backend | Backend |
| 5 | Implement Login and Register Pages | Frontend |
| 6 | Integrate Backend Authentication | Frontend |

**Completion Notes:**  
Sprint 1 focused on establishing the core technical foundation of the project. The team successfully scaffolded the Angular frontend, set up basic routing, and stood up the Go HTTP backend. From there, Login and Register pages were implemented and fully connected to backend authentication — giving the project a working end-to-end auth flow by the end of the sprint.

---

##  Not Completed & Why

- **Lockout Form Discrepancies** — Deprioritised; requires further clarification from stakeholders on what constitutes a discrepancy and how it should be flagged. Moved to Sprint 2 backlog.
- **Ongoing Move-In Records** — Scope was larger than estimated. The temporary log system requires management to define the timeout duration before implementation can be finalised. Carried to Sprint 2.
- **Cancel/Recover Reservation** — Dependent on the reservation system being more fully built out. Recovery logic requires a soft-delete pattern that wasn't yet in place. Carried to Sprint 2.
- **Edit Reserved Unit Type** — Started but not merged; the UI for changing unit type mid-reservation needs additional validation logic. In progress for Sprint 2.
- **Map on Unit Assignment** — Visual sitemap requires asset and layout data from the client that has not yet been provided. Blocked pending client input.
- **Quick Tasks** — Approach not finalised; team is deciding between form quick-links vs. full task automation. Decision to be made at Sprint 2 kickoff.
- **Search Quick Capability** — Deprioritised in favour of foundational features. Scheduled for Sprint 2.

---

## Sprint Retrospective Notes

**What went well:**
- Core infrastructure was delivered end-to-end — Angular project, routing, Go backend, and full authentication flow were all completed within the sprint.
- Clear task ownership; frontend and backend work progressed in parallel without blocking each other.
- Authentication integration (#31) closed the loop on a critical path item early.

**What to improve:**
- Several user story issues remain open due to missing client data, unresolved design decisions, or underestimated complexity — these need to be scoped and clarified *before* sprint planning begins.
- Estimation needs refinement for features like ongoing move-in records and the full reservation flow.

**Carry-forward to Sprint 2:**  
Issues #13, #14, #15, #16, #17, #18, #19, #20, #21, #22 — plus beginning work on US-01 (automated reports) and US-02 (full reservation flow).

---
## Frontend Team Video
(https://uflorida-my.sharepoint.com/:v:/g/personal/manasa_kallam_ufl_edu/IQA9Yo6Ho4mOTLIqKsgm2dyMARiu3rI7e_KsoYkTRwl-LcI?e=PHy9m6&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D)
## Backend Team Video
https://1drv.ms/v/c/a796cc3e63e12a01/IQCdKBb1i8f3RIKEWDrENMUvAaTVGH_9WmIbUIeLGktfwEw?e=iKVpsg
