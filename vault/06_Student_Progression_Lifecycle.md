---
title: "Student Progression & Lifecycle"
category: "Academics"
tags: ["#students", "#progression", "#lifecycle", "#ordinance"]
summary: "Granular statuses (active, promoted, demoted, struck_off, deactivated) and non-destructive fee preservation."
---

# 🎓 Student Progression & Lifecycle

> Linked Entities: [[02_Academic_Topology_5_Levels]], [[05_Attendance_Governance_and_Anti_Fraud_Lock]]

## 1. Granular Student Statuses
Karanvir Sir specified 5 distinct lifecycle states for enrolled students:
1. `active`: Regularly enrolled, attending classes in current term.
2. `promoted`: Successfully passed ordinances and advanced to next academic term.
3. `demoted`: Failed academic year or Ordinance criteria; repeating previous term/year.
4. `struck_off`: Name removed from collegiate rolls due to chronic absence (>14 days unexcused) or disciplinary expulsion.
5. `deactivated`: Withdrawn, transferred to external university, or graduated.

## 2. Progression History Audit
- Every progression change is permanently logged in `student_progression_history`:
  - `previous_status` -> `new_status`
  - `previous_term` -> `new_term`
  - `order_no` (Institutional Office Order)
  - `reason` and `changed_by`
- **Zero Loss Ledger Guarantee**: Promoting or demoting a student never deletes historical attendance records or pending [[09_Dynamic_Payment_Gateways_Live_Test|Fee Heads]].\n