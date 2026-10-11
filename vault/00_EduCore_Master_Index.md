---
title: "EduCore ERP - Master Architecture Index"
category: "Overview"
tags: ["#moc", "#overview", "#architecture", "#educore"]
summary: "Root Map of Content (MOC) connecting all domains, database schemas, workflows, and Lecture 3 requirements."
---

# 🏛️ EduCore ERP - Knowledge Vault Index

Welcome to the **EduCore Collegiate ERP Knowledge Graph**. This vault serves as the single source of truth for the multi-tenant architecture, PostgreSQL database schema, academic topology, HRMS payroll, and security compliance as directed by Senior Mentor **Karanvir Sir**.

```dataview
TABLE category, tags, summary
FROM #architecture OR #academics OR #hrms OR #finance OR #database
SORT file.name ASC
```

---

## 🗺️ Master Domain Maps (MOCs)

### 1. SaaS Platform & Database Core
- [[01_Multi_Tenant_Provisioning]] - Multi-tenant SaaS client lifecycle, database replication, subdomains, and One-Click Direct Impersonation ("Open" button).
- [[11_PostgreSQL_Cluster_Architecture]] - 100% Native PostgreSQL database engine, multi-tenant schemas, 5 isolated database domains, and migratable DDL.
- [[10_Field_Level_RBAC_Permissions]] - Granular field-level view/edit access control matrix with hierarchical dependency rules.

### 2. Academic Topology & Curriculum (5 Levels)
- [[02_Academic_Topology_5_Levels]] - Level 1 (Entity Type), Level 2 (Department), Level 3 (Course), Level 4 (Batch: Semester vs Annual), Level 5 (Section & Non-destructive transfers).
- [[03_Curriculum_and_Subject_Matrix]] - Formula `[NAME]_[COURSE]_[TERM]`, evaluation checkboxes (`take_exam`, `show_in_report_card`, `take_attendance`), and faculty handover validity dates.
- [[04_Timetable_Combined_Classes_and_Free_Period]] - Faculty scheduling conflict detector, Combined Classes (`CC`), parallel elective splitting (CC1..CC4), and Free Period (`FC`) present calculation.
- [[05_Attendance_Governance_and_Anti_Fraud_Lock]] - Institutional anti-fraud backdated attendance lock (10, 20, 30 days) and examination eligibility gating (75% cutoff).
- [[06_Student_Progression_Lifecycle]] - Student states (`active`, `promoted`, `demoted`, `struck_off`, `deactivated`), promotion ordinance rules, and fee ledger preservation.

### 3. HRMS, Payroll & Institutional Clearance
- [[07_HRMS_Payroll_and_Security_Deductions]] - Staff compensation (Basic, HRA, Net, TDS), statutory PF/ESI/Voluntary PF toggles, monthly security deduction schedule with target auto-locking.
- [[08_Online_Exit_NOC_System]] - 5-Point departmental clearance checklist (Library, Accounts, Department/Lab, IT, HR) unlocking the online Security Deposit refund button.

### 4. Finance & Payment Gateways
- [[09_Dynamic_Payment_Gateways_Live_Test]] - Multi-current account gateway routing (Pharmacy vs Law), Live vs Test Sandbox mode, and student payment protection during testing.

### 5. Primary Lecture Verification
- [[12_Master_Verbatim_Lecture_3_Transcript]] - Complete, verbatim, end-to-end transcript and technical breakdown of Karanvir Sir's 65-minute lecture.\n

---
---
---
---
---
---
### ⚡ Vault Synchronization & Codebase Telemetry
- **Last Verified Sync**: `2026-10-11 23:53:36`
- **Obsidian Architecture Notes**: `13` markdown notes (100% YAML frontmatter validated)
- **Visual Architecture Graph**: `9` Canvas nodes, `8` edges (`EduCore_System_Architecture.canvas`)
- **Database Catalog**: `57` PostgreSQL tables verified in `server/db.ts`
- **Backend API Routing**: `168` REST endpoints verified across `server/routes/*.ts`
- **Lecture 3 Compliance**: 100% verified against Senior Mentor Karanvir Sir verbatim transcript