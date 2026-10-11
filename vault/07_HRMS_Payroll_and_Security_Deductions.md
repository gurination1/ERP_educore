---
title: "HRMS Payroll & Security Deductions"
category: "HRMS"
tags: ["#hrms", "#payroll", "#security_deduction", "#statutory"]
summary: "Salary breakup (Basic, HRA, Net, TDS), statutory PF/ESI/Voluntary PF toggles, and auto-locking security deductions."
---

# 💼 HRMS Payroll & Security Deductions

> Linked Entities: [[00_EduCore_Master_Index]], [[08_Online_Exit_NOC_System]], [[10_Field_Level_RBAC_Permissions]]

## 1. Staff Categorization & Multi-Role Support
- Staff are classified into 3 primary levels: `Teaching`, `Non-Teaching`, `Administration`.
- **Multi-Role Support**: A staff member can hold multiple additional appointments across departments (e.g. Non-teaching staff teaching competitive classes in Humanities and acting as mentor in E-Cell).
- **Multiple Bank Accounts**: Stored with default flag for direct salary disbursement.

## 2. Salary Structure & Statutory Toggles
- **Components**: Basic Pay, HRA, Special Allowance, Gross Salary, Net Salary, TDS %.
- **Statutory Benefit Toggles**:
  - `PF Applicable`: Applicable for salaries $\le$ ₹15,000/month.
  - `ESI Applicable`: Applicable for salaries $\le$ ₹21,000/month.
  - `Voluntary PF`: Allows employees above ₹15,000 threshold to opt-in for PF deductions.

## 3. Security Deduction Auto-Locking
- Institutional policy deducts an employee security bond over consecutive paychecks (e.g., target ₹30,000 via ₹5,000 monthly installments).
- **Auto-Lock Rule**:
  $$\sum \text{Installments} = \text{Target Amount} \implies \mathbf{IS\_LOCKED = TRUE}$$
- Once target is reached, deduction fields automatically lock and cease deductions.
- Funds remain in trust until released via [[08_Online_Exit_NOC_System]].\n