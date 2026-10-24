# EduCore ERP • Complete Master Architecture & End-to-End System Blueprint
**Single Source of Truth based on Mentor Karanvir Sir Lectures & Forensic Recordings**

---

## 1. Architectural Philosophy & Core Axioms
1. **Zero Popups / Zero Modal Overlays**:
   All workflows (onboarding, master tables, admissions, transfers, batch promotion, hostel allotment, fee collection) operate as inline canvas cards, expandable viewports, or segmented master tabs directly embedded on the page canvas.
2. **Canonical 11-12 Digit Pure-Digit Student UID (Karanvir Sir Core Architecture)**:
   - **Student UID Formula**: `[Server: 1 or 01]-[Client: 02]-[Session: 02]-[Course: 02]-[Student: 0004]`
     - **Digit 1 (or 1-2)**: Server Node (e.g. `1` = Primary Production Server Node)
     - **Digits 2-3**: Client Number / Campus Code (e.g. `01` = Bathinda Main, `02` = Faridkot Regional)
     - **Digits 4-5**: Session ID (e.g. `26` for 2026 Intake, `25` for 2025 Current Session)
     - **Digits 6-7**: Course ID (e.g. `01` = B.Tech CSE, `02` = B.Tech ME, `05` = MBA, `07` = B.Sc Agri)
     - **Digits 8-11**: Student Sequence Number (e.g. `0001`, `0002` ... `9999`)
     - **Canonical Representation**: Pure digits `10126010001` or segmented `1-01-26-01-0001`.
   - **Employee ID Formula**: `[Type 4]-[Seq 2]-[Client 2]-[State 2]-[Inst 2]` (e.g. `2001-14-01-03-01` Teaching Faculty, `4001-01-01-03-01` Administrator, `9001-01-01-03-01` Super Admin).
3. **3D Coin-Flip Login Architecture (Karanvir Sir Lecture 1 & Seg 000)**:
   - 3D Coin-flip perspective (`[perspective:1400px]`, `transform-style: preserve-3d`).
   - **Front Face**: Single consolidated identifier input ("Registered UID / EMP ID"), password toggle, fast 1-click role logins with canonical 12-digit student UID (`1-01-26-01-0001`).
   - **Back Face 1 (Forgot Password - Orange Theme)**: Vibrant orange design tokens (`border-[#ea580c]`, orange background gradients, orange action buttons). Dispatches credentials via OTP channel (SMS/WhatsApp/Email) and flips back with alert: *"Please check your SMS / WhatsApp / Email for your password."*
   - **Back Face 2 (Contact Admin - Collegiate Blue Theme)**: Deep blue design tokens (`border-[#00236f]`, blue background gradients, blue action buttons). Collects UID/EMP ID, Dropdown "Regarding" (Regarding Username, Regarding Password, Regarding Others), concern textarea, and auto-generates support ticket `#TKT-XXXXXX` routed to campus administrative desk.
4. **Master Table Governance (Seg 006 & Recording 160)**:
   Every categorical entity (GST States, Departments, Degrees, Batches, Designations, Employee Statuses, Student Admission Statuses, Maintenance Check Types) lives in dynamic database Master Tables. Zero hardcoded lists.
   Master records referenced in active transactions cannot be hard-deleted (Safety Gate).
5. **Database Seeding & Migration Engine (Seg 006 & Recording 162)**:
   - **Master DB (Pristine Production)**: Clean empty schema with statutory master tables only for live client go-live.
   - **Sample DB (Evaluation Sandbox)**: Pre-populated with demo scholars (12-digit UIDs), leads, fee structures, and contra ledgers for client trial/evaluation.
   - **Relational Migrations Catalog (`schema_migrations`)**: Immutable version-tracked migrations ledger with cryptographic checksums and physical table record health monitoring.
6. **Financial Invariance & Contra Ledger (Seg 005 & Recording 161)**:
   Zero deletion policy for financial ledgers. Every modification, discount, demotion adjustment, or reversal generates an immutable balancing contra-entry.

---

## 2. End-to-End Connection & Role Interaction Map

```mermaid
flowchart TD
    SA[Super Admin Cockpit] -->|Onboards Tenant + Seeds Masters| TenantDB[(Client Tenant DB)]
    SA -->|One-Click Impersonate 'Open'| AdminDesk[Institutional Admin Operations]
    
    TenantDB --> MasterTables[Master Architecture: States, Depts, Degrees, Statuses]
    
    AdminDesk -->|Configures Rules & Approvals| Academics[Academics: Courses & Batches]
    AdminDesk -->|Monitors Overall Census & FSR| HRMS[Faculty HRMS & Staff Dossiers]
    AdminDesk -->|Tracks Dues & Realized Inflow| Accounts[Accounts, Ledgers & Partners]
    AdminDesk -->|Oversees Residence & Fleet| Hostel[Hostel, Mess & Transport]
    
    Admissions[Admissions CRM Desk] -->|Enquiry + Prob. + Logs| PreAdmission[Candidate Inquiry & Verification]
    PreAdmission -->|Collects Registration Fee| Accounts
    Accounts -->|Generates Receipt + Validates| ApprovalGate{Admin / Dean Approval?}
    ApprovalGate -->|Authorized| StudentReg[Generate Canonical UID -> Move to Active Scholar]
    StudentReg --> Academics
    StudentReg -.->|Optional Opt-In| Hostel
    
    StudentPortal[Scholar Portal] -->|Inspects Timetable & Marks| Academics
    StudentPortal -->|Downloads Fee Receipts| Accounts
    StudentPortal -->|Views Allotted Bed & Mess NOC| Hostel
    
    HRMS -->|Staff Allocation & Handovers| Academics
    Accounts -->|Vendor & Rent Contracts| Hostel
```

---

## 3. Role-by-Role Functional Specifications

### A. Super Admin (Universal Provost & Multi-Tenant Cockpit)
- **Tenants & Colleges Directory**:
  - Live list of client institutions with Client ID, Subdomain (`*.gurudotcom.erp`), Schema Name, Status (`Active` / `Inactive`).
  - **"Open" Button**: One-click direct impersonation without password into the client college admin console. Stores `educore_jwt_token` and `educore_user_data` cleanly.
  - **Active Toggle**: Instantly activate or suspend tenant access.
  - **Reset Admin Password**: Inline password reset with OTP simulation.
- **Inline College Onboarding & Subscriptions Suite**:
  - Section 1: Institutional Identity (Full name, short code, entity category, city, subdomain, and **Client Number** allocated for UID architecture).
  - Section 2: Administrative Credentials (Principal/Registrar name, phone, official email, initial password).
  - Section 3: **Subscription Plan & Commercial Quota Page**:
    - Subscription Tier: Starter (₹1.5L/yr, 500 scholars), Professional (₹4.5L/yr, 2,500 scholars), Enterprise Provost (₹12L/yr, 10,000 scholars).
    - Billing Cycle: Annual / Multi-Year.
    - Capacity Quotas: Maximum students & maximum faculty limits.
    - Core ERP Modules Checklist: Admissions CRM, CBCS Academics, Tuition Accounts & Contra Ledger, Faculty HRMS & Service Books, Residence & Mess, Examination & Hall Tickets, Corporate Placements, Cloud Telephony dialer.
  - Section 4: **Database Seeding Strategy**:
    - **Master DB (Pristine Production)**: Clean empty schema with statutory master tables only for live client go-live.
    - **Sample DB (Evaluation Sandbox)**: Pre-populated with demo scholars (12-digit UIDs), leads, fee structures, and contra ledgers for client trial/evaluation.
  - Section 5: **Direct Master Tables Configuration** (GST State code selection with inline state creation, Departments selection, Degrees selection). Automatically seeds master tables into new tenant database schema.
- **Database Migrations Engine (`schema_migrations`)**:
  - Relational migration history ledger showing 6 applied schema revisions (`001_core_relational_schema` through `006_dual_db_sample_and_master_catalogs`).
  - Cryptographic sha256 checksums, execution timestamps, and schema version (`2026.06.15-PRD`).
  - Physical tables record count & health metrics (`tenants`, `students`, `users`, `courses`, `sessions`, `fee_heads`, `audit_logs`).
  - Action: "Verify & Run Migrations" (`POST /api/tenants/run-migrations`) to execute relational integrity audit.
- **Cluster Telemetry & Logs**:
  - Database pool status (PostgreSQL / SQLite).
  - Cryptographic audit trail with forensic event log viewer.

### B. Header & Global Navigation
- **Campus Selector**:
  - Super Admin: Displays "Universal Platform Management" with tenant selector dropdown.
  - College Admin / Staff: Multi-campus context switcher:
    - `Campus 01 - Bathinda (Main)`
    - `Campus 02 - Faridkot (Regional)`
    - `All Campuses (Consolidated)`
  - Bound globally to filter all academic, student, staff, fee, and hostel data.
  - Students: Displays fixed assigned campus badge (no switching).
- **Academic Term Selector**: Prominent display with current session (`2025-2026 Odd Sem`) and previous terms.
- **Canonical UID Pill**: Quick 1-click copy with toast alert.
- **User Profile Dropdown**: Photo, Name, Role badge, Password Reset, and Logout.

### C. College Admin (Operations Console)
- **4 Core Executive Metric Cards**:
  1. *Total Staff*: Breakdown: `[Admin] + [Teaching] + [Non-Teaching] = Total Staff`.
  2. *Active Scholars*: Total active students with seat fill rate and capacity. Clicking opens inline department topology drilldown table with percentages and totals at the top.
  3. *Faculty-Student Ratio (FSR)*: AICTE/UGC compliance ratio (`1:18.4`).
  4. *Revenue Forecast*: Projected pending fee dues for the semester.
- **Executive Governance & Actions**:
  - Student progression approval reviews.
  - Staff exit NOC and clearance sanctioning.
  - Combined class timetable audit.
  - 75% attendance detained warning list.
- **Live Support Tickets Queue**:
  - Direct intake of tickets generated from Login Page 3D Flip Card ("Contact Admin").
  - Ticket ID, submitter UID, topic, concern, and status toggle (`Open`, `In Progress`, `Resolved`).

### D. Admissions CRM (Counselors & Admissions Head)
- **Enquiry Management Pipeline**:
  - Candidate basic info form (Name, Father's Name, Phone, Email, City).
  - Target Course selection with auto-displayed fee and duration.
  - Counselor Call Tracking Tree:
    - Chronological log of call notes.
    - Admission Probability Score (0–100%).
    - Follow-up / Next Alert Date.
  - Direct Registration Fee Collection: routes candidate to payment, generates receipt, checks approval, and converts enquiry to Enrolled Scholar with generated UID.
- **Dynamic Bulk CSV / Excel Lead Uploader**:
  - Upload raw CSV without strict predefined headers.
  - Dropdown column mapper: Map CSV columns (e.g. "Candidate Name", "Mobile") to system fields.
  - Status Preview: `Fresh`, `Probable Duplicate`, `Wrong Data`.
  - Export bad/duplicate rows to downloadable CSV.
- **Orphaned & Stale Leads Exception View**:
  - Orphaned leads (assigned to deactivated or resigned counselors).
  - Stale leads (>5 days without follow-up activity).
  - 1-click counselor reassignment.

### E. Academics, Curriculum & Batch Operations
- **Curriculum Architecture**:
  - Courses: Full name, short code, duration, academic system (Semester vs Annual).
  - Batches: Batch Name convention: `[Course]-[Semester]-[Session]` (e.g. `BCA-Sem1-2025-26`). Auto-generated Batch ID, Start/End Year, Fee Due Date, Attendance Lock Date.
  - **Statutory Batch Approval Gate**: New batches initialize in `pending_approval` until Academic Dean / Council approves.
- **Batch Promotion & Demotion Engine**:
  - Bulk Promote: Promotes cohort to next semester with attendance cutoff validation ($75\%$).
  - Demote Student Wizard:
    - History Option A: Full academic timeline preserved.
    - History Option B: History restarted from demoted semester.
    - Ledger Adjustment: Null & Void skipped term fees or carry forward credit.
- **Timetable Scheduling**:
  - Conflict-free timetable builder with automatic room and teacher double-booking checks.
  - Combined class (CC) support.
- **Subjects & Sections**:
  - Compulsory vs Elective vs Supplementary subjects.
  - Section transfers and faculty teaching handovers.

### F. Faculty HRMS & Staff Management
- **Quick Onboarding**: Instant Employee ID generation from minimal fields (Name, Phone, Department, Designation).
- **Comprehensive Dossier**:
  - Bank Accounts (with primary default flag).
  - Emergency contact details.
  - Education and previous experience.
  - Document attachments (Aadhaar, PAN, Degree certificates).
- **Software & Organization Journey (Recording 160)**:
  - Immutable audit trail of every status and designation change:
    - Promotion
    - Demotion
    - Additional Role
    - Role Switch
    - Re-joining
  - Actor UID, timestamp, and previous vs new designation.
- **Employee Statuses (Master Table)**:
  - `Active`
  - `Resigned`
  - `Terminated`
  - `Absent on Leave (AOL)`
- **Security & RBAC**:
  - Force password change on first login.
  - Role rights matrix for Teaching vs Non-Teaching staff.

### G. Accounts, Tuition & Ledger Management
- **Corporate & Vendor Partners**:
  - Partner Firm Name and Entity Type (Sole Proprietor, Partnership, LLP, Pvt Ltd).
  - Multiple contact persons (with 1 default).
  - Multiple bank accounts (with 1 default).
  - Tax details: PAN, GSTIN.
- **Tuition Fee Matrix**:
  - Configurable fee heads: Tuition Fee, University Fee, Other Charges.
  - Category integration (General, SC/ST, Merit scholarship).
- **Payment Counter & Receipts**:
  - Instant receipt generation with counter receipt number, timestamp, and mode.
  - Printable fee slip.
- **Contra-Ledger & Zero Deletion**:
  - Every discount, fee change, or reversal creates an offsetting credit/debit record.
- **Defaulters Register**: Filtered by campus and department with fine calculations.

### H. Hostel & Residence Management
- **Building Infrastructure**:
  - Building Name (e.g. Taj Mahal, Stella, Block A).
  - Ownership: `College Owned (In-Campus)` vs `College Owned (Off-Campus)` vs `Vendor / Rented (Off-Campus)`.
  - For Vendor buildings: Dropdown linking to Vendor Partners in Accounts.
  - Total Floors, Total Rooms, GPS coordinates / address.
- **Room Topology**:
  - Room Number and Custom Name (e.g. Guru Mahal).
  - Capacity / Sharing (1, 2, 3, 4 beds).
  - Amenities: AC vs Non-AC, Attached Washroom, Window, Almirah.
  - Room Fee per semester.
  - **Deletion Safety Gate**: Cannot delete room with active occupants.
- **Resident Scholars & Allotments**:
  - Dynamic bed allocation (Bed 1, Bed 2, Bed 3). Overbooking strictly rejected.
  - Filter for unassigned hostel applicants.
  - Room transfers with fee differential calculation.
- **Mess Management & NOC Clearance**:
  - Decoupled bi-monthly mess billing cycle.
  - Mess Dues ledger.
  - **Mess No-Dues Certificate (NOC)** generator for exiting scholars.
- **Building Maintenance Engine**:
  - Maintenance types from Master Table (White Wash, Electrical, Security, Hygiene).
  - Last check date, inspection frequency (e.g. 90 days, 360 days).
  - Overdue alerts and maintenance logs.

### I. Transport Management
- **Fleet Roster**: Bus Number, Capacity (seats), AC/Non-AC, Driver details, Ownership (College vs Vendor).
- **Route Assignment**: Student pickup route mapping and transport fee calculation.

### J. Student Portal
- **Scholar Overview**: Active enrolled course, batch, semester, and attendance percentage.
- **Attendance & Classes**: Date-range filtered attendance logs.
- **Tuition & Dues**: Fee ledger summary with online payment simulation and printable receipts.
- **Admit Card & Results**: CBCS semester marksheet, university result gazette, SGPA/CGPA.
- **Grievances & Support**: Submit issue ticket with status tracking.

### K. User Management & Dynamic Role Rights Matrix (Seg 006 & Recording 161)
- **10 Canonical Institutional Roles**:
  1. `admin` (Institutional Provost & Registrar Governance)
  2. `super_admin` (Universal Platform Orchestrator & Multi-Tenant Host)
  3. `staff` (Academic Faculty & Teaching Professor)
  4. `hod` (Department Head & Academic Ordinance Overseer)
  5. `student` (Undergraduate / Postgraduate Enrolled Scholar)
  6. `accounts` (Bursar, Fee Collections & Ledger Cashier)
  7. `counselor` (Admissions CRM, Walk-in Inquiries & Call Radar)
  8. `hostel` (Warden, Residence Buildings, Bed Topology & Mess Dues)
  9. `hr` (Personnel Officer, Staff Lifecycle, Payroll & Exit Clearances)
  10. `partner` (Corporate Recruiter & Placement Agency)
- **Interactive Role Badge Action (Seg 006:180)**:
  - Clicking any user's role badge in the roster opens an inline, zero-popup **Role Rights & Permissions Matrix Canvas** (`activeRoleMatrixUser`).
  - **10 Fine-Grained Discretionary Privileges**:
    - `fees_collect`: Fee Collection & Counter Receipt Issuance
    - `admissions_crm`: Admissions CRM & Walk-In Prospect Management
    - `student_manage`: Student Registry & Academic Progression Actions
    - `academics_curriculum`: Curriculum, Syllabus & Timetable Management
    - `exam_clearance`: University Examination & Admit Card Gate Clearance
    - `faculty_hrms`: Staff Roster, Additional Roles & Multi-Duty Allocation
    - `hostel_allot`: Residence Buildings, Bed Allocation & Mess Clearance
    - `doc_compliance`: Compliance Dossiers, Document Attestation & Verification
    - `mis_reports`: Executive Institutional MIS & Financial Analytics
    - `master_arch`: Master Tables Governance (States, Depts, Degrees)
  - **Auto-Apply & Save Rights Globally**: Commits permissions immediately to user state and institutional audit logs.
  - **Revoke All Discretionary Rights (Seg 006:63)**: Strips all discretionary permissions in one click, falling back strictly to canonical base role.
  - **Software Journey Timeline (Rec 160)**: Visual timeline of state transitions (User Added -> Admin Promotion -> Rights Assignment) with timestamps, actor UIDs, and forensic device logging.

### L. Corporate Placement & Partner Portal (Recording 161 Specifications)
- **Direct Accounts Menu Access**: Accessible under Account / Tuition & Ledgers ribbon (`partner-portal`).
- **Partner Classification**: Sole Proprietorship, Partnership Firm, Private Limited, Public Corporation.
- **Multi-Contact Matrix**:
  - Support for multiple contact persons per partner organization.
  - Strict 1-default flag requirement (`is_default: true`).
- **Multi-Bank Ledger Matrix**:
  - Multiple bank accounts per corporate partner.
  - Strict 1-default disbursement account.
- **Taxation & Compliance**: PAN Number, GSTIN identification.
- **Dynamic Bulk Data Import Engine**:
  - Format-agnostic CSV / Excel ingestion.
  - Left column: System database fields; Right column: Dynamic dropdown matching CSV headers.
  - 3-Tier Record Categorization:
    1. *Fresh*: Clean data, zero conflicts -> Eligible for 1-click import.
    2. *Probable Duplicate*: Partial match on mobile/Aadhaar -> Flagged and excluded from direct write.
    3. *Wrong Data*: Incomplete digits or invalid format -> Tagged for separate Excel error export.

### M. Zero-Popup Inline Canvas Architecture Guarantee
- **Mentor Directive**: *"Pop-up pop-up pop-up khatam karo, yahan pe ek page aa jayega, thik hai?"* (Karanvir Sir Seg 003:364).
- **100% Zero-Popup Compliance**:
  - Zero modal overlays (`fixed inset-0 bg-black/50`) across all 10 roles.
  - Every modal converted to inline, expandable card viewports with seamless DOM flow and responsive container layouts.
- **100% Scalable SVG Icons**:
  - Zero raw Unicode replacement symbols (`✓`, `✕`, `→`, `←`, `[!]`, `⚠️`, `▼`).
  - Standardized on Lucide-React SVG icons across all 30+ enterprise components.

---

## 4. Verification & Testing Matrix
1. Multi-tenant database initialization & replication.
2. Super Admin one-click impersonation into tenant principal console.
3. Campus context filter consistency across Academics, Students, Fees, and Hostel.
4. Lead conversion pipeline: Enquiry -> Registration Payment -> Approval -> Student UID.
5. Batch lifecycle: Deploy -> Pending Approval -> Dean Sanction -> Active.
6. Demotion ledger recalculation with contra-entries.
7. Hostel room capacity enforcement and Mess NOC generation.
8. Zero floating popups across all 10 roles.
9. Interactive role badges & rights matrix toggle test across 10 roles.
10. Partner portal multi-bank and multi-contact default flag enforcement.
11. Clean build verification with `npm run build` and zero compilation errors.
