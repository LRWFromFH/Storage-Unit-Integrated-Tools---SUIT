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

### Initial Seeding (Development)
Upon initialization, the database is automatically populated to facilitate testing:
* **144** Basic Test Customers
* **120** Storage Units
* **Default Manager Account:** If the database is empty, a seed account is created:
    * *Email:* `manager@suit.com` | *Password:* `Manager123!`

### Validation
* **Executable Test Suites:** Added for all CRUD routes to validate response codes and data integrity.
* **Manual Testing:** All routes have been verified to ensure the middleware correctly blocks unauthorized access.

---

## 🚀 Upcoming Scope
The roadmap for the next sprint includes:
* Unit Reservation logic.
* Creating a Ledger system.
* Billing and Invoice implementation

---

## Backend Video:

https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQDh8yvDO9pHRovU9Y2c8ml1AVXJrUPSE9hiy8zX_oYYiM0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=wzcQ6i

CRUD unit test sample:
https://uflorida-my.sharepoint.com/:v:/g/personal/alexander_martin_ufl_edu/IQAXJuNDHHCbSq6RvMPk7HEnAdg-o6SI7D2hTqRGs1RtH_Q?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=teWJNj

---
