---
title: "PostgreSQL Native Database Architecture"
category: "Database"
tags: ["#database", "#postgres", "#architecture", "#multi_tenant"]
summary: "100% Native PostgreSQL database engine, multi-tenant schemas, 5 isolated database domains, and migratable DDL."
---

# 🐘 PostgreSQL Native Database Architecture

> Linked Entities: [[00_EduCore_Master_Index]], [[01_Multi_Tenant_Provisioning]]

## 1. Mandatory Engine Policy
- EduCore operates exclusively on **PostgreSQL 18.6** via native `pg.Pool`.
- Zero fallback to SQLite or MariaDB in production environments.
- Connection string managed via `POSTGRES_URL=postgresql://postgres@127.0.0.1:5432/educore`.

## 2. 5-Domain Architecture
1. **DB 1: Students & Academic Records**: `students`, `courses`, `batches`, `sections`, `subjects`, `timetable_slots`, `attendance_records`, `marks`.
2. **DB 2: Faculty & HRMS**: `users`, `staff_basic_info`, `staff_academic_journey`, `staff_payroll_structures`, `staff_security_deductions`, `staff_exit_noc`, `staff_additional_roles`.
3. **DB 3: Document Compliance Vault**: `student_documents`, `regulatory_vault`, `master_document_types`.
4. **DB 4: Finance, Operations & Governance**: `fee_heads`, `student_fees`, `payments`, `payment_gateways`, `attendance_settings`.
5. **DB 5: Dedicated Append-Only Audit Logs**: `audit_logs` with JSONB details, actor roles, cryptographic hashing, and indexing.

## 3. Database-Agnostic Migratable DDL
As requested by Karanvir Sir, all table definitions utilize clean, standardized ANSI-SQL data types (`VARCHAR`, `INT`, `NUMERIC`, `BOOLEAN`, `TIMESTAMPTZ`) to ensure seamless future migrations between database engines.\n