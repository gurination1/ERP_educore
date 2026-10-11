---
title: "Attendance Governance & Anti-Fraud Lock"
category: "Academics"
tags: ["#attendance", "#governance", "#anti_fraud", "#compliance"]
summary: "Configurable backdated lock (10, 20, 30 days) preventing fraud, and 75% exam gate clearance."
---

# ⏱️ Attendance Governance & Anti-Fraud Lock

> Linked Entities: [[04_Timetable_Combined_Classes_and_Free_Period]], [[06_Student_Progression_Lifecycle]]

## 1. Anti-Fraud Backdated Attendance Lock
To prevent faculty from retroactively falsifying student attendance months later to bypass university regulations, EduCore enforces an immutable backdated lock window.

- **Institutional Setting**: `backdated_lock_days` (default 20 days; configurable to 10, 20, or 30 days).
- **Validation Rule**:
  $$\text{Current Date} - \text{Attendance Date} > \text{Lock Days} \implies \mathbf{ERROR:\; GATE\; LOCKED}$$
- Faculty attempts to record or mutate attendance beyond this threshold are rejected with HTTP 403.
- Audit trail logs all attendance submission timestamps with actor IP and cryptographic hash.

## 2. Examination Gate Clearance (75% Cutoff)
- University affiliations (PUP Patiala, MRSPTU Bathinda, Panjab University) mandate a 75% cumulative attendance threshold.
- EduCore dynamically evaluates cumulative percentage:
  $$\text{Attendance \%} = \frac{\text{Attended Classes} + \text{FC Periods}}{\text{Total Scheduled Classes}} \times 100$$
- Students below 75% are flagged for administrative condonation or barred from downloading admit cards.\n