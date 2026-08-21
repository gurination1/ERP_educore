-- ==============================================================================
-- EduCore ERP - MariaDB Realistic Seed Data
-- ==============================================================================

USE `educore_erp`;

-- Passwords:
-- Admin: admin123 (hashed)
-- Student: student123 (hashed)
-- Sample bcrypt hash for standard demo authentication:
-- '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea'

-- 1. Insert Users
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `full_name`, `avatar_url`, `is_active`) VALUES
('usr-admin-01', 'admin', 'admin@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'admin', 'Dr. Ramesh Chandra (Registrar)', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmCe2nK5yn2MzfaI3kCnW0nsowqO3EV58Ga69olnaTWnrwRkrVYL41WIGBNg3bCeeSll-y7q-sNxZnHAmS6R6flXcHN8FmEd7YctXzyaVMrHWtueSk6o9YibOVt8o5EF2w8Sb20QpYV9jv4_fwNINqv1CYnW8CqP4LtuL4L7W6_MOM7pY86gWQTI9AN3JgzjczSurPGgarPw32rrk9xSW0oSixeifD_sg3dYr9-I-QBTghh310DDep', 1),
('usr-stu-aryan', 'aryan', 'aryan@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Aryan Sharma', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeiC80XBMv76j7_mmqCTcV9ZoMVZPfV_CdXd_33ne25_LIcAK_aNzQB6o4mvRXLqi6oREzmz295hMjEcQKFSotWGv1NikCOM_tIPmBQDzFiaMO8yJKSdfRUTIfZSoUkGyEjTIjKF5D8DMp3A9swq7gKNz8yzp0zkvchBkPPxFbIrY_ZA6tW5oSONcFtKCHTd3RgKK6vRjOMjtXmy5qOVJVowbvGGivEwYdD84ExfwTGl3sAzLegZ9N', 1),
('usr-stu-001', 'stu001', 'alice.smith@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Alice Smith', NULL, 1),
('usr-stu-002', 'stu002', 'bob.johnson@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Bob Johnson', NULL, 1),
('usr-stu-003', 'stu003', 'charlie.davis@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Charlie Davis', NULL, 1),
('usr-stu-004', 'stu004', 'emma.wilson@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Emma Wilson', NULL, 1),
('usr-stu-005', 'stu005', 'michael.brown@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'student', 'Michael Brown', NULL, 1),
('usr-staff-01', 'staff01', 'staff@educore.edu', '$2a$10$wKxHw.8VwYn.t3iW9n7wUOKfE3FjYqP7B6X3lW2j6z2xS2F9jG1ea', 'staff', 'Prof. Sunita Rao (Staff / Faculty)', NULL, 1);

-- 2. Insert Sessions
INSERT INTO `sessions` (`id`, `name`, `start_date`, `end_date`, `is_current`) VALUES
('sess-2025-26', '2025-26', '2025-07-01', '2026-06-30', 1),
('sess-2024-25', '2024-25', '2024-07-01', '2025-06-30', 0),
('sess-2023-27', '2023-27', '2023-07-01', '2027-06-30', 0),
('sess-2022-24', '2022-24', '2022-07-01', '2024-06-30', 0),
('sess-2021-24', '2021-24', '2021-07-01', '2024-06-30', 0),
('sess-2022-25', '2022-25', '2022-07-01', '2025-06-30', 0);

-- 3. Insert Courses
INSERT INTO `courses` (`id`, `code`, `name`, `department`, `duration_years`, `total_semesters`, `base_tuition_fee`) VALUES
('crs-btech-cs', 'B.Tech CS', 'Bachelor of Technology in Computer Science & Engineering', 'Computer Engineering', 4, 8, 90000.00),
('crs-btech-me', 'B.Tech ME', 'Bachelor of Technology in Mechanical Engineering', 'Mechanical Engineering', 4, 8, 85000.00),
('crs-mba-fin', 'MBA Finance', 'Master of Business Administration (Financial Management)', 'Management Studies', 2, 4, 110000.00),
('crs-bsc-phy', 'B.Sc Physics', 'Bachelor of Science in Applied Physics', 'Natural Sciences', 3, 6, 45000.00);

-- 4. Insert Students
INSERT INTO `students` (`id`, `user_id`, `student_id`, `first_name`, `last_name`, `gender`, `dob`, `email`, `phone`, `guardian_name`, `guardian_relation`, `guardian_phone`, `course_id`, `session_id`, `current_semester`, `admission_year`, `admission_status`, `fees_status`, `attendance_percentage`, `total_classes`, `attended_classes`) VALUES
('stu-rec-aryan', 'usr-stu-aryan', 'STU-2023-088', 'Aryan', 'Sharma', 'male', '2004-03-15', 'aryan@educore.edu', '+91 98765 43210', 'Sunil Sharma', 'parent', '+91 98765 43200', 'crs-btech-cs', 'sess-2025-26', 4, 2023, 'approved', 'due', 85.00, 100, 85),
('stu-rec-001', 'usr-stu-001', 'STU-001', 'Alice', 'Smith', 'female', '2005-06-12', 'alice.smith@educore.edu', '+91 98111 22334', 'David Smith', 'parent', '+91 98111 22330', 'crs-btech-cs', 'sess-2023-27', 4, 2023, 'approved', 'paid', 92.00, 100, 92),
('stu-rec-002', 'usr-stu-002', 'STU-002', 'Bob', 'Johnson', 'male', '2002-11-20', 'bob.johnson@educore.edu', '+91 98222 33445', 'Robert Johnson', 'parent', '+91 98222 33440', 'crs-mba-fin', 'sess-2022-24', 2, 2022, 'approved', 'due', 78.00, 100, 78),
('stu-rec-003', 'usr-stu-003', 'STU-003', 'Charlie', 'Davis', 'nonbinary', '2003-08-05', 'charlie.davis@educore.edu', '+91 98333 44556', 'Karen Davis', 'parent', '+91 98333 44550', 'crs-bsc-phy', 'sess-2021-24', 6, 2021, 'approved', 'overdue', 64.00, 100, 64),
('stu-rec-004', 'usr-stu-004', 'STU-004', 'Emma', 'Wilson', 'female', '2005-01-18', 'emma.wilson@educore.edu', '+91 98444 55667', 'James Wilson', 'parent', '+91 98444 55660', 'crs-btech-cs', 'sess-2023-27', 4, 2023, 'approved', 'paid', 96.00, 100, 96),
('stu-rec-005', 'usr-stu-005', 'STU-005', 'Michael', 'Brown', 'male', '2004-09-24', 'michael.brown@educore.edu', '+91 98555 66778', 'Thomas Brown', 'parent', '+91 98555 66770', 'crs-bsc-phy', 'sess-2022-25', 4, 2022, 'approved', 'paid', 88.00, 100, 88),
('stu-rec-aarav', NULL, 'STU-006', 'Aarav', 'Sharma', 'male', '2004-04-10', 'aarav.sharma@educore.edu', '+91 98666 77889', 'Sanjay Sharma', 'parent', '+91 98666 77880', 'crs-btech-cs', 'sess-2025-26', 4, 2023, 'approved', 'overdue', 70.00, 100, 70),
('stu-rec-priya', NULL, 'STU-007', 'Priya', 'Patel', 'female', '2003-12-14', 'priya.patel@educore.edu', '+91 98777 88990', 'Mukesh Patel', 'parent', '+91 98777 88990', 'crs-mba-fin', 'sess-2025-26', 2, 2024, 'approved', 'overdue', 82.00, 100, 82),
('stu-rec-rohan', NULL, 'STU-008', 'Rohan', 'Gupta', 'male', '2003-02-28', 'rohan.gupta@educore.edu', '+91 98888 99001', 'Anil Gupta', 'parent', '+91 98888 99000', 'crs-bsc-phy', 'sess-2025-26', 6, 2022, 'approved', 'due', 84.00, 100, 84),
('stu-rec-neha', NULL, 'STU-009', 'Neha', 'Singh', 'female', '2004-07-19', 'neha.singh@educore.edu', '+91 98999 00112', 'Rajesh Singh', 'parent', '+91 98999 00110', 'crs-btech-me', 'sess-2025-26', 4, 2023, 'approved', 'overdue', 75.00, 100, 75);

-- 5. Insert Fee Heads
INSERT INTO `fee_heads` (`id`, `code`, `title`, `description`, `is_recurring`) VALUES
('fh-tuition', 'TUITION', 'Academic Tuition Fee', 'Semester academic tuition, classroom access, and lab instructions', 1),
('fh-hostel', 'HOSTEL', 'Hostel & Residence Fee', 'Campus accommodation, housekeeping, and facility maintenance', 1),
('fh-exam', 'EXAM', 'Examination & Assessment Fee', 'Semester terminal exams, grade transcript processing', 1),
('fh-lib', 'LIBRARY', 'Library & Resource Access Fee', 'Digital library, textbook reserve access, research journal database', 1),
('fh-sports', 'DEVELOPMENT', 'Campus Sports & Development Fee', 'Gymnasium, athletic sports ground, and club activities', 0);

-- 6. Insert Student Fees Ledger
INSERT INTO `student_fees` (`id`, `student_id`, `fee_head_id`, `session_id`, `semester`, `amount`, `discount_amount`, `paid_amount`, `due_amount`, `due_date`, `status`) VALUES
('sf-aryan-01', 'stu-rec-aryan', 'fh-tuition', 'sess-2025-26', 4, 45000.00, 0.00, 0.00, 45000.00, '2025-10-15', 'due'),
('sf-aryan-02', 'stu-rec-aryan', 'fh-tuition', 'sess-2024-25', 3, 45000.00, 0.00, 45000.00, 0.00, '2024-10-15', 'paid'),
('sf-aryan-03', 'stu-rec-aryan', 'fh-exam', 'sess-2024-25', 3, 3500.00, 0.00, 3500.00, 0.00, '2024-11-10', 'paid'),
('sf-aarav-01', 'stu-rec-aarav', 'fh-tuition', 'sess-2025-26', 4, 45000.00, 0.00, 0.00, 45000.00, '2025-08-15', 'overdue'),
('sf-priya-01', 'stu-rec-priya', 'fh-tuition', 'sess-2025-26', 2, 32500.00, 0.00, 0.00, 32500.00, '2025-08-20', 'overdue'),
('sf-rohan-01', 'stu-rec-rohan', 'fh-tuition', 'sess-2025-26', 6, 15000.00, 0.00, 0.00, 15000.00, '2025-09-01', 'due'),
('sf-neha-01', 'stu-rec-neha', 'fh-tuition', 'sess-2025-26', 4, 45000.00, 0.00, 0.00, 45000.00, '2025-08-10', 'overdue');

-- 7. Insert Payments (Aryan previous semester)
INSERT INTO `payments` (`id`, `receipt_no`, `student_id`, `student_fee_id`, `amount_paid`, `payment_mode`, `transaction_reference`, `payment_date`, `status`, `notes`, `collected_by`) VALUES
('pay-rec-0088', 'REC-2024-0088', 'stu-rec-aryan', 'sf-aryan-02', 45000.00, 'online_upi', 'UPI/2024/9028301128', '2024-10-12 14:32:00', 'success', 'Semester 3 Tuition Fee Paid online', 'usr-admin-01'),
('pay-rec-0089', 'REC-2024-0089', 'stu-rec-aryan', 'sf-aryan-03', 3500.00, 'net_banking', 'HDFC/NET/88492019', '2024-11-08 10:15:00', 'success', 'Semester 3 Examination Fee Paid', 'usr-admin-01');

-- 8. Insert Schemes / Scholarships
INSERT INTO `schemes` (`id`, `code`, `title`, `description`, `award_amount`, `eligibility_criteria`, `deadline`, `is_active`) VALUES
('sch-merit-01', 'MERIT-2025', 'State Merit & Excellence Scholarship', 'Prestigious institutional merit grant awarded to high-performing students who secured 8.5+ CGPA in prior semester.', 50000.00, 'Minimum 8.5 CGPA and no pending backlogs.', '2025-11-30', 1),
('sch-need-02', 'NEED-2025', 'Need-Based Fee Concession Grant', 'Financial assistance grant for students with annual family income under INR 3,00,000.', 35000.00, 'Family income certificate issued by competent revenue authority.', '2025-10-31', 1),
('sch-stem-03', 'WOMEN-STEM', 'Women in STEM Leadership Fellowship', 'Special endowment to encourage female scholars enrolled in Engineering & Technology branches.', 40000.00, 'Female students enrolled in B.Tech courses with CGPA 7.5+.', '2025-12-15', 1);

-- 9. Insert Dynamic Forms
INSERT INTO `dynamic_forms` (`id`, `form_code`, `title`, `description`, `schema_json`, `is_published`, `created_by`) VALUES
('df-hostel-app', 'FORM-HOSTEL-2025', 'Hostel Room & Mess Allotment Form', 'Apply for room allocation, dietary preferences, and room-mate preference for 2025-26.', '[{"name":"room_type","label":"Room Preference","type":"select","required":true,"options":["Single AC","Double Sharing AC","Non-AC 3-Sharing"]},{"name":"diet_preference","label":"Dietary Preference","type":"radio","required":true,"options":["Vegetarian","Non-Vegetarian","Jain Special"]},{"name":"medical_condition","label":"Any Chronic Allergies / Medical Notes","type":"textarea","required":false},{"name":"emergency_guardian","label":"Local Guardian Contact in City","type":"text","required":true}]', 1, 'usr-admin-01'),
('df-internship-noc', 'FORM-NOC-2025', 'Summer Internship NOC & Verification', 'Submit company internship offer letter for college dean endorsement.', '[{"name":"company_name","label":"Company / Organization Name","type":"text","required":true},{"name":"role_title","label":"Internship Role Title","type":"text","required":true},{"name":"stipend_inr","label":"Monthly Stipend (INR)","type":"number","required":true},{"name":"start_date","label":"Internship Start Date","type":"date","required":true},{"name":"duration_weeks","label":"Duration in Weeks","type":"select","required":true,"options":["4 Weeks","8 Weeks","12 Weeks","6 Months"]}]', 1, 'usr-admin-01');

-- 10. Insert Notices
INSERT INTO `notices` (`id`, `title`, `summary`, `content`, `notice_date`, `category`, `is_pinned`) VALUES
('not-01', 'Mid-Term Examination Schedule Released', 'Check the portal for detailed timings and room allocations.', 'All students enrolled in even semesters are advised to check the mid-term assessment schedule. Hall tickets will be issued 3 days prior.', '2025-09-28', 'Academic', 1),
('not-02', 'Campus Placement Drive 2025', 'TCS and Infosys recruitment drive for final year B.Tech students.', 'Eligible students with CGPA 7.0+ must register on the training and placement portal before 5th October.', '2025-09-25', 'Placement', 0),
('not-03', 'Hostel Maintenance Update', 'Water supply interruption on Sunday between 9 AM and 2 PM.', 'Scheduled pipeline servicing and water tank cleaning will be performed across Blocks A, B, and C.', '2025-09-20', 'Campus Life', 0);
