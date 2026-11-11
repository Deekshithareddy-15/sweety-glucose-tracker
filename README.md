# Sweety – Blood Glucose Tracker

A full-stack, healthcare-focused Blood Glucose Tracking application built for the **Kenpath Junior Full Stack Developer** position take-home assignment.

Sweety enables users to log, monitor, and analyze daily blood glucose levels across four clinically standard daily slots, complete with robust PostgreSQL constraints, JWT-based security, isolated user datasets, and instant statistical reporting.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technology Stack](#technology-stack)
4. [Architecture & System Design](#architecture--system-design)
5. [Folder Structure](#folder-structure)
6. [Prerequisites](#prerequisites)
7. [PostgreSQL Installation & Database Setup](#postgresql-installation--database-setup)
8. [Backend Setup & Environment Variables](#backend-setup--environment-variables)
9. [Frontend Setup & Environment Variables](#frontend-setup--environment-variables)
10. [Running the Application](#running-the-application)
11. [Database Seeding & Demo Account](#database-seeding--demo-account)
12. [Running Backend Tests](#running-backend-tests)
13. [API Endpoint Reference](#api-endpoint-reference)
14. [Business & Validation Rules](#business--validation-rules)
15. [Screenshots & UI Walkthrough](#screenshots--ui-walkthrough)
16. [Demo Recording Script (2–3 Minutes)](#demo-recording-script-23-minutes)
17. [Assumptions](#assumptions)
18. [Known Limitations](#known-limitations)
19. [Future Improvements](#future-improvements)

---

## Project Overview

Managing diabetes and monitoring glycemic control requires tracking blood sugar at key metabolic moments during the day. **Sweety** provides an intuitive, accessible, and responsive platform where individuals can:
- Record their blood glucose in **mg/dl** for exactly four daily measurement slots.
- Prevent duplicate entries and enforce sensible limits (max 4 per day, whole numbers between 40–600 mg/dl, no future dates).
- Instantly review statistics (Highest, Lowest, Average, Total count) across three vital analytical windows:
  1. **Daily Report**: Granular slot breakdown and metrics for any selected date.
  2. **Month-to-Date (MTD) Report**: Cumulative metrics from the 1st of the month through the selected date.
  3. **Monthly Report (Previous Month)**: Complete retrospective calendar-month analytics (e.g. for October 15, analyzes September 1–30; handles year boundaries such as January 15 analyzing December 1–31).
- Maintain complete data privacy: each user's records are strictly isolated.

---

## Core Features

### 1. Secure Authentication & User Isolation
- Signup with full name, email, and password.
- Case-insensitive email normalization and uniqueness enforcement.
- Passwords hashed with **bcrypt** (10 salt rounds).
- Password hashes are **never returned** in any API response.
- Stateless authentication using **JSON Web Tokens (JWT)**.
- Automatic session hydration and persistent login via local storage.
- Strict multi-tenant user isolation: users cannot view, edit, or delete any other user's readings or reports.

### 2. PostgreSQL Relational Integrity
- Persistent relational database utilizing `pg` (node-postgres) with parameterized queries (`$1`, `$2`, etc.) to eliminate SQL injection risks.
- Database CHECK constraints:
  - `CHECK (value >= 40 AND value <= 600)`
  - `CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'))`
- Database UNIQUE constraint: `UNIQUE (user_id, reading_date, slot)` preventing race conditions.
- Foreign key `readings.user_id REFERENCES users(id) ON DELETE CASCADE`.
- Date type parsing override (`types.setTypeParser(1082, ...)`) preventing JavaScript Date UTC timezone day-shifts.

### 3. Glucose Reading CRUD & Clinical Slot Tracking
- Full CRUD operations:
  - `POST /api/readings`: Add a reading with strict validation.
  - `GET /api/readings`: Fetch all readings or filter by `?date=YYYY-MM-DD` and paginate with `?page=1&limit=20`.
  - `GET /api/readings/:id`: Retrieve single reading details.
  - `PUT /api/readings/:id`: Edit date, slot, or value while preserving unique slot rules.
  - `DELETE /api/readings/:id`: Delete a reading with client-side confirmation.
- The four exact supported slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`

### 4. Comprehensive Analytics & Reports
- **Daily Report**: Aggregates `MAX`, `MIN`, `ROUND(AVG, 1)`, and `COUNT` for the selected day, plus the chronological slot readings.
- **Month-to-Date (MTD)**: Aggregates measurements from the 1st of the selected month to the selected date inclusive.
- **Monthly (Previous Calendar Month)**: Aggregates the entire previous calendar month (e.g., September for October; December of the previous year for January).
- Returns clean `null` values for unavailable metrics instead of misleading `0` values.
- Friendly empty states when no data is recorded.

### 5. Polished Healthcare Frontend
- Soft pastel palette (pastel pink, lavender, mint, and white).
- Modern typography, rounded cards (`rounded-3xl`), and subtle elevation.
- Dashboard with welcome greeting, quick slot action cards, daily progress indicator (`X of 4 logged`), and interactive trend graph.
- Accessible contrast and responsive layout on mobile, tablet, and desktop.
- Modal forms with inline error messaging and double-submission protection.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + Vite | Single Page Application with fast HMR |
| **Routing** | React Router v6 | Client-side routing with `ProtectedRoute` guards |
| **Styling** | Tailwind CSS v3 | Custom pastel palette, responsive utility classes |
| **Icons** | Lucide React | Clean, modern healthcare iconography |
| **Charts** | Recharts | Responsive SVG trend line visualization |
| **HTTP Client** | Axios | Configured with request/response interceptors for JWT |
| **Backend** | Node.js + Express | RESTful API with modular controllers and routers |
| **Database** | PostgreSQL 16 | Relational storage with constraints and indexes |
| **DB Driver** | `pg` (node-postgres) | Connection pool with parameterized SQL queries |
| **Security** | `bcrypt` & `jsonwebtoken` | 10 salt rounds and signed HS256 tokens |
| **Testing** | Jest + Supertest | Automated integration tests against dedicated test database |

---

## Architecture & System Design

```
                     ┌───────────────────────────────────┐
                     │          React + Vite             │
                     │  (Tailwind CSS, Axios, Recharts)  │
                     └─────────────────┬─────────────────┘
                                       │ HTTP / JSON
                                       │ (Bearer JWT)
                                       ▼
                     ┌───────────────────────────────────┐
                     │          Express Server           │
                     │  ├── Auth Middleware              │
                     │  ├── Error Handler Middleware     │
                     │  └── Controllers                  │
                     └─────────────────┬─────────────────┘
                                       │ Parameterized SQL
                                       │ ($1, $2, ...)
                                       ▼
                     ┌───────────────────────────────────┐
                     │        PostgreSQL Database        │
                     │  ├── users (id, email, hash)      │
                     │  └── readings (slots, CHECKs)     │
                     └───────────────────────────────────┘
```

---

## Folder Structure

```
sweety-glucose-tracker/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeleteConfirmModal.jsx
│   │   │   ├── GlucoseTrendChart.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ReadingModal.jsx
│   │   │   ├── SlotCard.jsx
│   │   │   └── StatCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── readingService.js
│   │   │   └── reportService.js
│   │   ├── utils/
│   │   │   └── date.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── server/
│   ├── db/
│   │   ├── migrate.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── readingController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── readingRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── utils/
│   │   │   ├── dateHelper.js
│   │   │   ├── jwt.js
│   │   │   └── validation.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── helpers/
│   │   │   └── dbHelper.js
│   │   ├── auth.test.js
│   │   ├── integration.test.js
│   │   ├── reading.test.js
│   │   └── report.test.js
│   ├── package.json
│   └── .env.example
├── screenshots/
│   └── README.md
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

Before running the application, make sure you have installed:
1. **Node.js**: v18.0.0 or later (tested on v24.16.0).
2. **npm**: v9.0.0 or later (tested on v11.6.2).
3. **PostgreSQL**: v14, 15, or 16 installed and running.

---

## PostgreSQL Installation & Database Setup

### 1. Install PostgreSQL
- **Windows**: Download and run the installer from [PostgreSQL Official Downloads](https://www.postgresql.org/download/windows/).
- **macOS**: `brew install postgresql@16 && brew services start postgresql@16`
- **Linux (Ubuntu/Debian)**: `sudo apt update && sudo apt install postgresql postgresql-contrib`

### 2. Create the Databases
Open your terminal or `psql` command prompt and create the development and testing databases:

```sql
CREATE DATABASE sweety_db;
CREATE DATABASE sweety_test_db;
```

*(On command line with psql:)*
```bash
psql -U postgres -c "CREATE DATABASE sweety_db;"
psql -U postgres -c "CREATE DATABASE sweety_test_db;"
```

### 3. Run Schema Migrations
The database schema includes tables, check constraints, foreign keys, and indexes. Run the migration script:

```bash
cd server
npm run migrate
```

---

## Backend Setup & Environment Variables

Navigate to the `server` directory:

```bash
cd server
npm install
```

Create a `.env` file in `server/.env` based on `server/.env.example` (use your PostgreSQL port, typically `5432` or `5433`):

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=sweety_db

# Or use connection string:
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5433/sweety_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

Create a `.env.test` file in `server/.env.test` for running automated tests:

```env
PORT=5001
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=sweety_test_db
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5433/sweety_test_db
JWT_SECRET=test_jwt_secret_key
JWT_EXPIRES_IN=1d
```

---

## Frontend Setup & Environment Variables

Navigate to the `client` directory:

```bash
cd client
npm install
```

Create a `.env` file in `client/.env` based on `client/.env.example`:

```env
VITE_API_URL=/api
```

*(Vite's development proxy redirects `/api` to `http://localhost:5000` automatically).*

---

## Running the Application

You can start the backend and frontend either individually or using root scripts:

### Option A: From Root Directory
In one terminal, start the backend:
```bash
npm run server:dev
```

In a second terminal, start the frontend:
```bash
npm run client
```

### Option B: From Individual Folders
**Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Frontend:**
```bash
cd client
npm run dev
# Frontend opens on http://localhost:3000
```

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## Database Seeding & Demo Account

To populate the database with realistic sample readings across the current and previous month:

```bash
cd server
npm run seed
```

### Demo Login Credentials
- **Email:** `demo@sweety.local`
- **Password:** `Demo@12345`

> **Note:** Demo credentials are provided strictly for local evaluation and automated testing.

The seed script is **fully idempotent** and safe to rerun multiple times without duplicating data or breaking constraints.

---

## Running Backend Tests

The project includes an extensive suite of **40 automated Jest + Supertest tests** covering authentication, CRUD validation, date boundaries, user isolation, and full integration workflows.

To run the tests:

```bash
cd server
npm test
```

### Test Coverage Highlights
- ✅ **Authentication (`tests/auth.test.js`)**: 13 tests verifying signup, email normalization, password hashing, invalid credentials, duplicate prevention, and JWT expiration.
- ✅ **Glucose Reading CRUD (`tests/reading.test.js`)**: 20 tests verifying 40–600 mg/dl bounds, integer checks, future date rejection, duplicate slot rejection with exact messages, 4-reading daily limit, user isolation, and pagination.
- ✅ **Reports & Analytics (`tests/report.test.js`)**: 6 tests verifying Daily, Month-to-date, Previous month calculations, empty states (null aggregates), and January-to-December year boundary transitions.
- ✅ **Integration (`tests/integration.test.js`)**: 1 end-to-end test exercising the complete user journey from signup to reporting, editing, and deleting.

---

## API Endpoint Reference

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer Token) |

### Glucose Reading Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/readings` | Create a glucose reading | Yes |
| `GET` | `/api/readings` | List readings (supports `?date=` & `?page=&limit=`) | Yes |
| `GET` | `/api/readings/:id` | Get reading by ID | Yes |
| `PUT` | `/api/readings/:id` | Update reading date, slot, or value | Yes |
| `DELETE` | `/api/readings/:id` | Delete a reading | Yes |

### Analytics & Report Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Daily highest, lowest, average, count & slots | Yes |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | 1st of month through selected date inclusive | Yes |
| `GET` | `/api/reports/monthly?date=YYYY-MM-DD` | Entire previous calendar month statistics | Yes |

---

## Business & Validation Rules

| Rule | Validation Check | Exact Error Response |
|---|---|---|
| **Missing Value** | `value === undefined \|\| value === ''` | `"Please enter a glucose value."` |
| **Invalid Value** | Not an integer or `< 40` or `> 600` | `"Value must be a whole number between 40 and 600 mg/dl."` |
| **Duplicate Slot** | Same slot already logged on that date | `"You already have an {slot} reading for this date."` |
| **Daily Limit** | Already 4 readings on that calendar date | `"You can add only 4 readings per day."` |
| **Future Date** | `reading_date > today` | `"Date cannot be in the future."` |
| **Allowed Slots** | Must match one of 4 allowed slot strings | `"Slot must be one of: Morning (fasting), After breakfast, After lunch, After dinner."` |
| **Invalid Date** | Not matching `YYYY-MM-DD` or invalid day | `"Reading date must be in YYYY-MM-DD format."` |
| **Editing Protection** | Cannot edit readings belonging to others | `404 "Reading not found."` |
| **Deletion Confirmation**| Frontend modal requires explicit confirmation | Prevents accidental data loss |

---

## Screenshots & UI Walkthrough

All screenshots are captured directly from the live application and saved in the `screenshots/` directory:

| Filename | Description | Preview |
|---|---|---|
| **`01_Login.png`** | Login screen with pastel aesthetic, credentials form, and "Fill Demo Credentials" action. | ![Login](screenshots/01_Login.png) |
| **`02_Signup.png`** | Registration page with Full Name, Email, Password, and inline validations. | ![Signup](screenshots/02_Signup.png) |
| **`03_Dashboard.png`** | Main healthcare dashboard with user greeting, date selector, 4 slot cards, target counter, and statistics. | ![Dashboard](screenshots/03_Dashboard.png) |
| **`04_Add_Reading.png`** | Log Blood Glucose modal with slot picker, numeric glucose input, and date picker restricted to today or earlier. | ![Add Reading](screenshots/04_Add_Reading.png) |
| **`05_Validation.png`** | Inline validation alert preventing duplicate slot readings (*"You already have an Morning (fasting) reading for this date"*). | ![Validation](screenshots/05_Validation.png) |
| **`06_Reading_History.png`** | Historical reading log with date filter, pagination controls, and chronological records. | ![Reading History](screenshots/06_Reading_History.png) |
| **`07_Edit_Delete.png`** | Delete confirmation dialog preventing accidental data removal. | ![Delete Confirmation](screenshots/07_Edit_Delete.png) |
| **`08_Daily_Report.png`** | Daily Report tab showing Highest, Lowest, Average (rounded to 1 decimal), and slot breakdown for selected date. | ![Daily Report](screenshots/08_Daily_Report.png) |
| **`09_Monthly_Report.png`** | Previous Month Report tab showing prior calendar month progression with Recharts trend visual. | ![Monthly Report](screenshots/09_Monthly_Report.png) |

---

## Demo Recording Script (2–3 Minutes)

**0:00 – 0:30 | Introduction & Tech Stack**
> "Hello! This is Sweety, a full-stack Blood Glucose Tracker built with React, Vite, Tailwind CSS, Express, and PostgreSQL for the Kenpath developer assignment. I'll walk you through the authentication, daily slot logging, validation safeguards, and analytical reports."

**0:30 – 1:00 | Sign In & Dashboard Overview**
> "Let's log in using our seeded demo account: `demo@sweety.local`. Upon signing in, we arrive at the Dashboard. The greeting displays the patient's name, today's date picker, a progress meter showing how many of the 4 daily slots have been logged, and top-level daily statistics."

**1:00 – 1:45 | Logging a Reading & Validations**
> "Let's log an afternoon reading. Notice the date input prevents future dates. If I try to enter a decimal like `105.5` or a value outside 40 to 600, it immediately warns us: 'Value must be a whole number between 40 and 600 mg/dl.' Let's enter `118 mg/dl` for After lunch. Upon saving, the slot card updates and the daily average recalculates automatically. If we attempt to log another reading for the same slot, the system rejects it: 'You already have an After lunch reading for this date.'"

**1:45 – 2:20 | Reading History & User Isolation**
> "Under Reading History, all recorded measurements are listed in reverse chronological order with date filters and pagination. We can edit or delete an entry with an explicit confirmation dialog. All database queries are scoped to the authenticated user's ID, ensuring strict data isolation."

**2:20 – 3:00 | Reports & Summary**
> "Finally, let's explore Reports. We have three dedicated analytics sections: Daily, Month-to-Date, and Previous Month. For our selected date, the Previous Month tab automatically aggregates the complete prior calendar month with peak, trough, and average rounded to one decimal place, along with an interactive Recharts trend visual. Thank you!"

---

## Assumptions

1. **Date Format & Timezones**: All dates are handled in ISO `YYYY-MM-DD` calendar format. To avoid timezone shift issues (such as UTC midnight shifting backward in IST or EST), node-postgres OID 1082 is configured to return raw `YYYY-MM-DD` strings, ensuring the calendar date recorded by the user is preserved across all systems.
2. **Measurement Units**: All glucose readings are standard `mg/dl` integers between 40 and 600.
3. **Previous Month Logic**: As specified in the requirements, the "Monthly" report strictly aggregates the **entire calendar month preceding** the selected date's month (e.g. October 15 -> September 1–30; January 10 -> December 1–31 of the previous year).
4. **Clinical Interpretation**: Per prompt instructions, Sweety strictly provides descriptive statistics (Highest, Lowest, Average, Count) without attempting unauthorized medical diagnoses or insulin dosage advice.

---

## Known Limitations

1. **Single Unit System**: The application currently assumes `mg/dl`. In regions such as the UK or Canada, `mmol/L` is commonly used; future versions can offer a toggle.
2. **Session Storage**: JWT tokens are currently stored in `localStorage` for simplicity. In high-compliance enterprise healthcare settings, `httpOnly` secure cookies with CSRF tokens would be preferred.

---

## Future Improvements

With additional time, the following enhancements would be valuable:
1. **HbA1c Estimation**: Calculate estimated average glucose (eAG) and projected HbA1c based on 90-day averages.
2. **CSV / PDF Export**: Export report summaries and raw readings for endocrinologist consultations.
3. **PWA / Offline Support**: Service worker caching and indexedDB sync for offline recording in clinic waiting rooms.
4. **Dark Mode**: Soft low-light pastel theme for nighttime logging.
