---
title: "Online 5-Point Exit NOC System"
category: "HRMS"
tags: ["#hrms", "#exit_noc", "#security_refund", "#clearance"]
summary: "5-point departmental clearance checklist (Library, Accounts, Dept/Lab, IT, HR) unlocking security refund release."
---

# 🚪 Online 5-Point Exit NOC System

> Linked Entities: [[07_HRMS_Payroll_and_Security_Deductions]], [[10_Field_Level_RBAC_Permissions]]

## 1. Departmental Clearance Checkpoints
When an employee resigns or completes their contract, EduCore initiates the 5-point No Objection Certificate (NOC) protocol:

```mermaid
graph TD
    NOC["Employee Resignation"] --> CP1["1. Library (Books & Journals Returned)"]
    NOC --> CP2["2. Accounts (Advance / Imprest Nil Dues)"]
    NOC --> CP3["3. Department / HOD (Lab Assets & Answer Scripts)"]
    NOC --> CP4["4. IT Dept (Laptop, Email Deactivation)"]
    NOC --> CP5["5. HR Dept (ID Card Surrendered & Exit Interview)"]
    CP1 & CP2 & CP3 & CP4 & CP5 --> ALL["ALL 5 CHECKPOINTS CLEARED"]
    ALL --> UNLOCK["🔓 'RELEASE SECURITY DEPOSIT' BUTTON ACTIVE"]
    UNLOCK --> PAY["Record Payment Mode & Tx Ref (NEFT/Cheque)"]
```

## 2. Security Refund Gatekeeper
- The "Release Security Deposit" refund button remains strictly **DISABLED** until all 5 department checkpoints are verified and signed off.
- Releasing the refund updates the security deduction status to `refunded`, records the disbursement mode (NEFT/Cheque) and transaction reference, and creates an immutable cryptographic audit record.\n