
# 🎨 SUIT Frontend

Angular-based frontend for **Storage-Unit-Integrated-Tools (SUIT)**.

---

## 🛠 Tech Stack

| Tool            | Version            |
| --------------- | ------------------ |
| **Angular**     | 21.x               |
| **Angular CLI** | 21.x               |
| **TypeScript**  | 5.x                |
| **Node.js**     | **24.x (via nvm)** |
| **npm**         | 11.x               |

> ⚠️ Angular does **not** support odd Node versions (e.g., 25).
> **Node 24 is required** for this project.

---

## 📦 Prerequisites

* **nvm** (Node Version Manager)
* **Node.js 24**
* **Angular CLI**

Install Angular CLI:

```bash
npm install -g @angular/cli
```

---

## 🚀 Setup & Run

### 1️⃣ Clone the repo

```bash
git clone https://github.com/LRWFromFH/Storage-Unit-Integrated-Tools---SUIT.git
cd Storage-Unit-Integrated-Tools---SUIT/frontend
```

### 2️⃣ Use the correct Node version

```bash
nvm use 24
```

Verify:

```bash
node -v
ng version
```

---

### 3️⃣ Install dependencies

```bash
npm install
```

---

### 4️⃣ Run the frontend

```bash
ng serve
```

Open:

```
http://localhost:4200
```

---

## 🔧 Common Commands

| Command    | Description            |
| ---------- | ---------------------- |
| `ng serve` | Run dev server         |
| `ng build` | Build production files |
| `ng test`  | Run tests              |
