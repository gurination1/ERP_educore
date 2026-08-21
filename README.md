# EduCore — College Management ERP

A full-stack college/ERP system built for **EduCore**: student admissions, fee collection & receipts, scholarships, a drag-free dynamic form builder, campus notices, and admin reporting — all behind role-based auth.

Built with **React 19 + TypeScript** on the front end and an **Express + TypeScript** API on the back, with a database layer that talks to **MariaDB in production** and transparently falls back to a **file-persisted SQLite store** for local development — so it runs with zero external setup.

> This README is written to be skimmable by both engineers and non-engineers evaluating the project. For a deeper technical breakdown, see [architecture.md](./architecture.md).

---

## Why this project is interesting

- **Two-tier persistence with automatic failover** — the app tries to connect to a MariaDB server on boot; if none is reachable, it transparently switches to a SQLite file on disk with the exact same query surface, so a developer can `npm install && npm run dev` with no database installed at all.
- **Role-based access control** across three roles (`student`, `admin`, `staff`) enforced with JWT + middleware, not just hidden UI.
- **A real admissions → fees → scholarships workflow**, not just CRUD screens: multi-step admission forms, fee ledgers with partial/overdue tracking, receipt generation, and a scholarship application/review pipeline.
- **A dynamic form builder** — admins can define arbitrary form schemas (text, select, radio, checkbox, etc.) at runtime and collect structured submissions, without touching code.
- **Security-conscious defaults**: `helmet` security headers, rate limiting on auth endpoints, `bcrypt` password hashing, and Zod schema validation on inputs.

---

## Feature tour

| Area | What it does |
|---|---|
| **Auth** | Username/email + password login, JWT sessions, forgot/reset password flow, role-aware redirects |
| **Student Dashboard** | Personal profile, attendance %, fee status, notices |
| **Admin Dashboard** | Institution-wide KPIs, fee collection trends, defaulter tracking |
| **Admissions** | Draft & submit multi-step admission applications; admin review/approve/reject |
| **Fee Ledger** | Per-student fee heads (tuition, hostel, exam, library, etc.), payments, auto-generated receipts, PDF-style receipt view |
| **Scholarships** | Publish scholarship schemes with eligibility criteria, students apply with documents, admins review and decide |
| **Dynamic Form Builder** | Admins design custom forms (hostel allotment, internship NOC, etc.); students fill and submit; admins view responses |
| **Notices** | Pinned campus-wide announcements |
| **Reports** | CSV export of student data, admissions-by-course breakdowns |

---

## Tech stack

**Frontend**
- React 19 + TypeScript, React Router 7
- Vite 6 build tooling, Tailwind CSS 4
- `lucide-react` icons, `motion` for animation

**Backend**
- Node.js + Express 4 (TypeScript, run via `tsx`)
- JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`)
- Input validation with `zod`
- `helmet` for HTTP security headers, `express-rate-limit` for brute-force protection
- File uploads via `multer` (scholarship documents, avatars)

**Data layer**
- **MariaDB / MySQL** (`mysql2`) as the primary production database
- **SQLite** (`sql.js`, file-persisted) as an automatic local-dev fallback — see [architecture.md](./architecture.md#database-strategy) for how the switch works

---

## Getting started

**Prerequisites:** Node.js 18+ (no database installation required for local dev).

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template and fill in secrets
cp .env.example .env

# 3. Start the dev server (Express API + Vite, same process)
npm run dev
```

The app serves both the API and the React frontend from a single Express process (`http://localhost:3000` by default). On first boot it will attempt a MariaDB connection using the `DB_*` variables in `.env`; if that fails, it automatically creates and uses a local SQLite file at `database/educore.sqlite`, seeded with demo data (sample students, courses, fee records, scholarships, notices).

### Demo logins (seeded data)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | `aryan` | `student123` |
| Staff | `staff01` | `staff123` |

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the app in development mode (Vite middleware + Express API) |
| `npm run build` | Build the frontend and bundle the server for production |
| `npm start` | Run the production build (`dist/server.cjs`) |
| `npm run preview` | Preview the built frontend with Vite |
| `npm run lint` | Type-check the project with `tsc --noEmit` |
| `npm run clean` | Remove build output |

### Environment variables

See `.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signing secret for auth tokens (required — server refuses to start without it) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MariaDB connection details (optional — falls back to SQLite if unreachable) |
| `PORT` | Port for the Express server (defaults to `3000`) |

---

## Project layout

```
├── src/                  React frontend (views, components, API client)
├── server/               Express API (routes, middleware, db layer)
│   ├── routes/           One router per domain (auth, students, fees, admissions, ...)
│   ├── middleware/       JWT auth, error handling, file upload
│   └── db.ts             Dual-mode data layer (MariaDB ⇄ SQLite)
├── database/
│   ├── schema.sql        Reference MariaDB schema
│   └── seed.sql          Reference seed data
├── server.ts             App entrypoint — wires Express + Vite together
└── architecture.md        Deeper technical write-up
```

For request flow, data model, and design rationale, see **[architecture.md](./architecture.md)**.
