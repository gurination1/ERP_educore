# EduCore Collegiate ERP - Agent Operational Guidelines & Protocols

## 🏛️ 1. Mandatory Obsidian First-and-Last Protocol

Whenever any agent touches, maintains, or upgrades this codebase:

- **STEP 0 (Default Entrypoint / First Action)**:
  Before editing or reading large source files, the agent **MUST** query the Obsidian Knowledge Vault first:
  ```bash
  python3 scripts/agent_vault_nav.py list
  python3 scripts/agent_vault_nav.py query "<feature or domain>"
  ```
  This immediately loads schemas, routes, topology levels, and business rules without consuming massive context window tokens.

- **STEP FINAL (Post-Update Synchronization / Last Action)**:
  At the end of every update, feature implementation, or bugfix, the agent **MUST** run the vault synchronizer:
  ```bash
  python3 scripts/agent_vault_nav.py sync
  ```
  This verifies that all 13 Obsidian architecture notes, the visual graph (`vault/EduCore_System_Architecture.canvas`), PostgreSQL 18.6 table schemas, and API routes remain 100% aligned.

---

## 🗄️ 2. PostgreSQL 18.6 Native Engine Rule

- Exclusively PostgreSQL 18.6 (`educore` database on port 5432).
- Zero fallback to SQLite or MariaDB.
- All DDL and migrations must be executed against native PostgreSQL connection pool (`server/db.ts`).

---

## 📋 3. Senior Mentor Karanvir Sir - Lecture 3 Architectural Specifications

Every feature in this ERP must strictly conform to the 13 gold-standard rules outlined in Lecture 3:

1. **Multi-Tenant SaaS Provisioning**:
   - Super Admin adds clients / institutions (colleges, schools, departments).
   - One-Click Impersonation: "Open" button in Super Admin panel bypasses standard login window and launches the institution's admin session directly.
   - Functional toggle: Non-functional institutions cannot be impersonated or accessed.
   - Database replication from master dump upon "Go in Production".
   - Unique client code (City + State + Entity code, e.g., 9291) generates FTP, IDs, and subdomain mappings.

2. **5-Level Academic Topology**:
   - Level 1: Entity (College / School, e.g., School of Humanities, School of Pharmacy, School of Law).
   - Level 2: Department (e.g., Department of History; if absent, defaults to School name).
   - Level 3: Course (BA, B.Com, B.Pharm, MA History).
   - Level 4: Batch / Session (e.g., 2026-2029 for 3-year degree; Semester vs Annual system).
   - Level 5: Section (A, B, C...) with non-destructive student section transfers.

3. **Curriculum Formula & 3 Evaluation Flags**:
   - Subject code formula: `[NAME]_[COURSE]_[TERM]` (e.g., `DBMS_CSE_04`).
   - 3 mandatory evaluation checkboxes on every subject:
     1. `take_exam` (True = marks enter gradebook; False = non-evaluative)
     2. `show_in_report_card` (True = appears on marksheet; False = internal audit)
     3. `take_attendance` (True = credit attendance required; False = uncounted)
   - Free Period (`FC`): `take_attendance = false`, `take_exam = false`, `show_in_report_card = false`. Counts as present in cumulative attendance calculations.
   - Faculty subject allocations must record handover validity dates (`valid_from`, `valid_until`).

4. **Timetable & Combined Classes (`CC`)**:
   - Multi-batch slots sharing a teacher and room are marked as Combined Class (`CC`).
   - Parallel Elective Splitting: A single period split into multiple parallel groups (CC1, CC2, CC3, CC4), where CC4 is Free Period (`FC`).
   - Real-time teacher slot collision detector flags overlapping non-combined periods.

5. **Attendance Governance & Anti-Fraud Lock**:
   - Institutional backdated lock threshold (configurable to 10, 20, or 30 days). Teachers cannot mutate attendance older than this window without admin override.
   - 75% attendance cutoff gate for examination hall ticket issuance.

6. **Student Progression Lifecycle**:
   - 5 explicit student statuses: `active`, `promoted`, `demoted`, `struck_off`, `deactivated`.
   - On demotion, historical academic marks and attendance remain immutable in audit logs while student repeats the term cleanly.

7. **Dynamic Payment Gateways (Live vs Test Mode)**:
   - Separate accounts per entity: Pharmacy School and Law School cannot share the same gateway account.
   - "Payment Mode": `live` vs `test` (sandbox).
   - Sandbox Protection: When in `test` mode, payment button **MUST NOT** be visible or enabled for standard students; only accessible to `test_allowed_uids`.
   - Gateway credentials and API keys are dynamic and runtime-fetched.

8. **HRMS Staff Module & Additional Roles**:
   - 3 staff categories: `Teaching`, `Non-Teaching`, `Administration`.
   - Dedicated "Additional Role" tab: Multi-role allocation across schools, departments, and designations.
   - Highest qualification marked as `Last` (highest). Resume upload mandatory.
   - Multi-bank accounts per staff with default account flag (`is_default`).

9. **HRMS Payroll & Security Deductions**:
   - Salary structure: Basic, HRA, Allowance, Gross, TDS %, Net Salary.
   - Dynamic PF / ESI / Voluntary PF toggles per employee profile.
   - Security Deduction: Total security amount, start/end months, monthly breakup schedule. Monthly deduction is automatically locked once salary is disbursed.

10. **Online 5-Point Exit NOC & Security Release**:
    - Online 5-point departmental clearance: Library, Accounts, Department/Lab, IT, HR.
    - Security deposit refund release button is locked until all 5 NOCs are approved.
    - Release records transaction reference, payment mode, and document upload.

11. **Field-Level RBAC Permissions Matrix**:
    - Granular checkbox matrix for Student and Staff fields.
    - Admin has full view/edit.
    - Strict dependency: If `can_view` is False, `can_edit` is programmatically forced False and disabled.

12. **Multi-Level Academic Workload Reporting**:
    - Generates reports for: Total combined classes, total subjects, total teachers, subjects assigned to each teacher.
    - Multi-level drilldown: School, Department, Course, Class.

---

## 🔒 4. Critical Persistence Rule

- **DO NOT** delete, clear, or run `rm -rf` on `auth_info_guri` under any circumstances.
