---
title: "Timetable, Combined Classes & Free Period"
category: "Academics"
tags: ["#timetable", "#combined_classes", "#electives", "#free_period"]
summary: "Faculty conflict detection, Combined Classes (CC), parallel elective splits, and Free Period (FC) auto-present logic."
---

# 🗓️ Timetable & Combined Classes (CC)

> Linked Entities: [[03_Curriculum_and_Subject_Matrix]], [[05_Attendance_Governance_and_Anti_Fraud_Lock]]

## 1. Faculty Timetable Conflict Detector
When assigning a slot (`day_of_week`, `start_time`, `end_time`, `faculty_id`), the system inspects all parallel slots across the campus:
- If the faculty is already booked in another class at that slot:
  - System flags a **Faculty Conflict Error**.
  - Prompts admin: *"Is this a Combined Class (CC)?"*

## 2. Combined Classes (`CC`) Tagging
- If multiple batches/sections attend the same lecture simultaneously (e.g., Section A and B attending Physics together, or BA and B.Com shared lecture):
  - Mark slot as `is_combined_class: true`.
  - Displayed in timetable as `CC_[SubjectName]`.
  - The professor's attendance desk automatically renders the unified student roster from both batches together!

## 3. Parallel Elective Splitting (CC1..CC4)
In complex elective periods, a single cohort can split into 4 parallel classrooms:
- 3 students in Elective A (German)
- 3 students in Elective B (French)
- 3 students in Elective C (Robotics)
- 1 student in Free Period (`FC`)
- The system handles multiple parallel combined classes in the same period block without collision.

## 4. Free Period (`FC`) Mechanics
- `Free Period` is created in [[03_Curriculum_and_Subject_Matrix]] with code `FC_[COURSE]_[TERM]`.
- Attributes: `take_attendance: false`, `take_exam: false`, `show_in_report_card: false`.
- **Attendance Calculation**: In daily roll-call computations, students assigned to Free Class (`FC`) are automatically counted as **Present**!\n