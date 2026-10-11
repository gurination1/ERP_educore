---
title: "Field-Level RBAC Permissions Matrix"
category: "Architecture"
tags: ["#rbac", "#permissions", "#security", "#access_control"]
summary: "Granular field-level view/edit access control matrix with hierarchical view-dependency rule."
---

# 🛡️ Field-Level RBAC Permissions Matrix

> Linked Entities: [[00_EduCore_Master_Index]], [[01_Multi_Tenant_Provisioning]], [[07_HRMS_Payroll_and_Security_Deductions]]

## 1. Overview
EduCore enforces fine-grained attribute-based access control (ABAC) down to individual data fields across Student and Staff dossiers.

## 2. The Hierarchical View-Dependency Rule
Karanvir Sir specified a mandatory mathematical invariant for permissions:
$$\mathbf{can\_view = FALSE} \implies \mathbf{can\_edit = FALSE}$$
- If a user role is denied visibility (`View = false`) for a field, the `Edit` capability is automatically disabled, locked, and grayed out.
- A user cannot edit what they cannot see.

## 3. Controlled Field Matrix
- **Student Information**:
  - `stu_aadhaar`: Aadhaar UID (View: Admin/Staff; Edit: Admin only)
  - `stu_phone`: Contact Number (View: All; Edit: Admin/Staff/Student)
  - `stu_fee_ledger`: Tuition Ledger (View: Admin/Student; Edit: Admin only)
  - `stu_marks`: Exam & Internal Marks (View: All; Edit: Admin/Faculty)
- **Staff Information**:
  - `stf_salary`: Basic, HRA, Net (View: Admin/Staff Self; Edit: Admin only)
  - `stf_pf_esi`: Statutory Deductions (View: Admin/Staff Self; Edit: Admin only)
  - `stf_security_deposit`: Security Schedule (View: Admin/Staff Self; Edit: Admin only)
  - `stf_bank_details`: Salary A/C & IFSC (View: Admin/Staff Self; Edit: Admin/Staff Self)\n