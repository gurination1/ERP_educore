---
title: "Curriculum & Subject Matrix"
category: "Academics"
tags: ["#academics", "#curriculum", "#subjects", "#faculty"]
summary: "Strict subject code formula, 3 evaluation checkboxes, and faculty allocation handover dates."
---

# 📚 Curriculum & Subject Matrix

> Linked Entities: [[02_Academic_Topology_5_Levels]], [[04_Timetable_Combined_Classes_and_Free_Period]], [[05_Attendance_Governance_and_Anti_Fraud_Lock]]

## 1. Strict Subject Coding Formula
Subject codes are automatically generated according to Karanvir Sir's formula:
$$\text{Subject Code} = [\text{NAME}]\_[\text{COURSE}]\_[\text{TERM}]$$
- Examples:
  - `HIST_101_01` (History, 1st Semester)
  - `CS_101_01` (Programming in C, B.Tech CSE, Term 1)
  - `DBMS_BCA_03` (Database Management, BCA, Term 3)
  - `FC_CSE_01` (Free Period / Library Hour, CSE, Term 1)

## 2. The 3 Evaluation Checkboxes
Every subject entity features three distinct boolean flags:
1. `take_exam` (boolean): Does this subject require examinations/grading?
2. `show_in_report_card` (boolean): Does this subject appear on student transcripts/report cards?
3. `take_attendance` (boolean): Does this subject take daily attendance? (Default `true`; set to `false` for Free Period `FC`).

## 3. Faculty Assignment & Handover Dates
- Faculty allocations feature explicit validity dates:
  - `valid_from` (ISO date)
  - `valid_until` (ISO date)
- **Mid-Term Handover Protocol**:
  - When a professor leaves mid-semester or takes maternity/sabbatical leave, the admin executes a handover:
  - Endpoint: `POST /api/academics/allocations/handover`.
  - Sets predecessor's `valid_until` to transition date and assigns successor from that date forward without disrupting prior attendance or grading logs.\n