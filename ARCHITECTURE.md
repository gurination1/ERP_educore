# Architecture

This document explains how EduCore is put together: the request lifecycle, the data layer's dual-database strategy, the domain model, and the reasoning behind the key design decisions. It's meant for engineers evaluating the codebase, and for future contributors ramping up.

---

## 1. High-level shape

EduCore is a **monolithic full-stack TypeScript app**: one Express server both serves the API and hosts the Vite dev server (or static build) for the React frontend. There is no separate backend deployment or API gateway — everything runs in a single Node process.

```
┌─────────────────────────────────────────────────────────────┐
│                        server.ts (entry)                     │
│                                                                │
│  1. Initialize DB layer (MariaDB → SQLite fallback)           │
│  2. helmet() security headers                                 │
│  3. express.json() / urlencoded() body parsing                │
│  4. Static /uploads route (multer-saved files)                │
│  5. GET /api/health                                            │
│  6. Mount routers: /api/auth, /api/students, /api/admissions, │
│     /api/fees, /api/scholarships, /api/forms, /api/reports,   │
│     /api/notices                                              │
│  7. errorHandler middleware (centralized JSON error format)   │
│  8. Vite middleware (dev) OR static dist/ + SPA fallback (prod)│
└─────────────────────────────────────────────────────────────┘
```

Request flow for a typical authenticated call:

```
Browser (React) → src/api/client.ts (fetch wrapper, attaches JWT)
                → Express router (server/routes/*.ts)
                → authenticateToken middleware (verifies JWT, loads user)
                → requireRole(...) middleware (if the endpoint is role-gated)
                → route handler → db.ts (data layer)
                → JSON response
```

---

## 2. Frontend

- **React 19 + React Router 7**, single-page app. `src/App.tsx` owns top-level routing and session state (current user, JWT), and renders an `AuthenticatedLayout` (sidebar + header) around role-specific views once logged in.
- **View components** (`src/components/*View.tsx`) each own one screen: `StudentDashboardView`, `AdminDashboardView`, `ManageStudentsView`, `FeeLedgerView`, `ScholarshipsView`, `DynamicFormBuilderView`, `AdmissionFormView`, plus modal components for receipts, payments, password reset, and email reminders.
- **`src/api/client.ts`** is a thin `fetch` wrapper: it stores the JWT and user object in `localStorage`, attaches `Authorization: Bearer <token>` to every request, and normalizes responses to `{ success, data?, error? }`.
- **Styling** via Tailwind CSS 4 (Vite plugin, no separate config build step).
- **Build tool**: Vite 6. In dev, Vite runs in *middleware mode* inside the same Express process as the API (see `server.ts`), so there's one dev server for both. In production, `vite build` emits static assets that Express serves directly, with a catch-all route for client-side routing.

---

## 3. Backend

### Routing

Each domain has its own Express router under `server/routes/`, mounted in `server.ts`:

| Router | Base path | Responsibilities |
|---|---|---|
| `authRoutes` | `/api/auth` | Login, current-user (`/me`), forgot/reset password |
| `studentRoutes` | `/api/students` | List/search students (admin/staff), per-student dashboard, email reminders |
| `admissionRoutes` | `/api/admissions` | Draft & submit admission applications, admin review + status updates |
| `feeRoutes` | `/api/fees` | Fee heads, KPIs, collection trend, defaulters list, per-student ledger, payment collection, receipt lookup |
| `scholarshipRoutes` | `/api/scholarships` | Schemes CRUD, student applications (with document upload), admin review |
| `formRoutes` | `/api/forms` | Dynamic form CRUD, submission, and submission listing |
| `noticeRoutes` | `/api/notices` | Campus notice board (list, admin-created) |
| `reportRoutes` | `/api/reports` | CSV student export, admissions-by-course aggregation |

### Auth & authorization (`server/middleware/auth.ts`)

- **Login** (`authRoutes.post('/login')`) validates credentials with `zod`, verifies the password against a `bcrypt` hash, and issues a **JWT** (`generateToken`) containing `id`, `username`, `email`, `role`, `full_name`, valid for 7 days.
- **`authenticateToken`** middleware verifies the JWT signature, re-fetches the user from the data layer to confirm the account still exists and is active, and attaches a trimmed `req.user` object.
- **`requireRole(...roles)`** is a second middleware layer that gates specific routes to `admin`, `staff`, and/or `student` — used throughout the route files (e.g., only `admin`/`staff` can list all students or view fee KPIs; only `admin` can review scholarship applications or publish notices).
- Auth endpoints are additionally protected by `express-rate-limit` (10 requests / 15 minutes) to blunt brute-force attempts.
- `JWT_SECRET` is required at boot — the process exits immediately if it's missing, rather than running with an insecure default.

### Validation & error handling

- Request bodies for sensitive/complex inputs (login, password reset, etc.) are validated with **Zod** schemas before touching the database.
- `server/middleware/errorHandler.ts` centralizes error responses into a consistent JSON shape rather than leaking stack traces or inconsistent formats.
- File uploads (scholarship supporting documents) go through `server/middleware/upload.ts` (Multer), landing in a local `/uploads` directory that Express serves statically.

---

## 4. Database strategy

This is the most distinctive part of the backend. `server/db.ts` defines a single `DatabaseStore` class that exposes one async API (`getStudents()`, `createPayment()`, `getDynamicForms()`, etc.) to the rest of the app — but underneath, it can be backed by **either MariaDB or SQLite**, decided automatically at startup.

### Startup sequence (`db.initialize()`)

1. **Attempt MariaDB.** Using `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` from the environment, it opens a connection, runs `CREATE DATABASE IF NOT EXISTS`, and opens a pooled connection (`mysql2/promise`, `connectionLimit: 10`). If this succeeds, it creates tables if needed and seeds default data if the `users` table is empty, then sets `mode = 'mariadb'`.
2. **Fall back to SQLite.** If any step above throws (no server reachable, bad credentials, timeout — a 3-second `connectTimeout` keeps this fast), it catches the error, logs a warning, and switches to `mode = 'sqlite'`. It then either loads an existing `database/educore.sqlite` file (via `sql.js`, a WASM SQLite build) into memory, or creates a fresh one with the same schema and seeds it with demo data.

### How reads/writes work per mode

Every data-access method on `DatabaseStore` (e.g. `getStudents`, `createPayment`, `updateScholarshipApplication`) branches on `this.mode`:

- **MariaDB mode** — runs parameterized SQL directly against the connection pool on every call. This is the source of truth; no separate caching layer.
- **SQLite mode** — keeps the full dataset as **in-memory arrays** on the `DatabaseStore` instance (`this.students`, `this.payments`, etc.) for fast reads, and calls `this.save()` after every write, which serializes all tables back into the `.sqlite` file on disk (via `sql.js`'s `export()` + `fs.writeFileSync`). This gives local development a real, restart-persistent database with zero setup, at the cost of holding the whole dataset in memory (fine at this scale; not intended for large production datasets).

This means the exact same route handlers and business logic run unmodified against either database — the branching is fully contained inside `db.ts`, so the rest of the app never needs to know which engine is active. `GET /api/health` reports the active engine and storage location, which is useful for debugging deployments.

### Schema

`database/schema.sql` documents the canonical **MariaDB** schema (used as the reference/production DDL); `database/seed.sql` documents reference seed data. The SQLite fallback creates an equivalent structure programmatically in `db.ts` at runtime, so the two stay in sync by design rather than via migrations.

### Core entities

| Table | Purpose |
|---|---|
| `users` | Auth accounts (student/admin/staff), password hash, role |
| `sessions` | Academic years/terms |
| `courses` | Programs offered (code, department, duration, base tuition) |
| `students` | Student profiles, linked to a `user`, `course`, and `session`; tracks admission status, fee status, attendance |
| `fee_heads` | Categories of fees (tuition, hostel, exam, library, development) |
| `student_fees` | Per-student, per-semester fee line items (amount, discount, paid, due, status) |
| `payments` | Payment transactions against a `student_fee`, with receipt number and mode |
| `schemes` | Scholarship programs (eligibility, award amount, deadline) |
| `scholarship_applications` | Student applications against a `scheme`, with review status |
| `dynamic_forms` / `form_submissions` | Admin-defined form schemas (JSON) and the responses submitted against them |
| `notices` | Campus announcements |

Relationships are id-based (no ORM): `students.course_id → courses.id`, `students.session_id → sessions.id`, `student_fees.student_id → students.id`, `payments.student_fee_id → student_fees.id`, `scholarship_applications.scheme_id → schemes.id`, etc.

---

## 5. Security notes

- Passwords are hashed with `bcryptjs` (cost factor 10) — never stored or compared in plaintext.
- Auth uses stateless JWTs, re-validated against live user records on every request (so deactivating a user immediately revokes access without needing a token blacklist).
- `helmet` sets standard security headers on every response.
- Auth endpoints are rate-limited to reduce brute-force risk.
- Environment secrets (`JWT_SECRET`, DB credentials) are never committed — see `.gitignore` and `.env.example`.

---

## 6. Notable design trade-offs

- **In-memory SQLite arrays** make local dev instant and dependency-free, but aren't meant to scale past demo/dev data volumes — production deployments should point at a real MariaDB instance via the `DB_*` env vars.
- **No ORM/migration tool** — the schema is hand-maintained in `schema.sql` and mirrored in `db.ts`'s table-creation code. This keeps the data layer dependency-light and easy to read end-to-end, at the cost of manual schema-sync discipline as the app grows.
- **Single-process deployment** (API + frontend together) simplifies hosting for a project of this scope, at the cost of being unable to scale the API and static asset serving independently.
