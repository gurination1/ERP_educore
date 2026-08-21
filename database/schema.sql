-- ==============================================================================
-- EduCore ERP - Normalized MariaDB Database Schema
-- Version: 1.0.0
-- Dialect: MariaDB / MySQL 8.0+
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `educore_erp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `educore_erp`;

-- 1. Users Table (Authentication and RBAC)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'admin', 'staff') NOT NULL DEFAULT 'student',
    `full_name` VARCHAR(150) NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB;

-- 2. Sessions / Academic Years Table
CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(20) NOT NULL UNIQUE, -- e.g., '2025-26', '2024-25'
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
    `id` VARCHAR(36) PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'BTECH-CS', 'MBA-FIN', 'BSC-PHY'
    `name` VARCHAR(150) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `duration_years` INT NOT NULL DEFAULT 4,
    `total_semesters` INT NOT NULL DEFAULT 8,
    `base_tuition_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS `students` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NULL UNIQUE,
    `student_id` VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'STU-001'
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `gender` ENUM('male', 'female', 'nonbinary', 'prefer_not_to_say') NOT NULL,
    `dob` DATE NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(30) NOT NULL,
    `guardian_name` VARCHAR(150) NOT NULL,
    `guardian_relation` ENUM('parent', 'sibling', 'spouse', 'other') NOT NULL DEFAULT 'parent',
    `guardian_phone` VARCHAR(30) NOT NULL,
    `course_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `current_semester` INT NOT NULL DEFAULT 1,
    `admission_year` INT NOT NULL,
    `admission_status` ENUM('draft', 'submitted', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    `fees_status` ENUM('paid', 'due', 'overdue') NOT NULL DEFAULT 'due',
    `attendance_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
    `total_classes` INT NOT NULL DEFAULT 100,
    `attended_classes` INT NOT NULL DEFAULT 85,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT,
    INDEX `idx_students_course` (`course_id`),
    INDEX `idx_students_status` (`fees_status`),
    INDEX `idx_students_admission_year` (`admission_year`),
    INDEX `idx_students_name` (`first_name`, `last_name`)
) ENGINE=InnoDB;

-- 5. Fee Heads (Tuition, Hostel, Exam, Lab, Library, etc.)
CREATE TABLE IF NOT EXISTS `fee_heads` (
    `id` VARCHAR(36) PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Student Fees Ledger Table
CREATE TABLE IF NOT EXISTS `student_fees` (
    `id` VARCHAR(36) PRIMARY KEY,
    `student_id` VARCHAR(36) NOT NULL,
    `fee_head_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `semester` INT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `due_amount` DECIMAL(12, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('paid', 'partial', 'due', 'overdue') NOT NULL DEFAULT 'due',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`fee_head_id`) REFERENCES `fee_heads`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT,
    INDEX `idx_student_fees_status` (`status`),
    INDEX `idx_student_fees_due_date` (`due_date`)
) ENGINE=InnoDB;

-- 7. Payments & Receipts Table
CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(36) PRIMARY KEY,
    `receipt_no` VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'REC-2025-0089'
    `student_id` VARCHAR(36) NOT NULL,
    `student_fee_id` VARCHAR(36) NULL,
    `amount_paid` DECIMAL(12, 2) NOT NULL,
    `payment_mode` ENUM('online_upi', 'net_banking', 'credit_card', 'debit_card', 'cash', 'cheque') NOT NULL,
    `transaction_reference` VARCHAR(100) NOT NULL,
    `payment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('success', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'success',
    `notes` TEXT NULL,
    `collected_by` VARCHAR(36) NULL,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_fee_id`) REFERENCES `student_fees`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`collected_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_payments_student` (`student_id`),
    INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB;

-- 8. Schemes & Scholarships Table
CREATE TABLE IF NOT EXISTS `schemes` (
    `id` VARCHAR(36) PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `award_amount` DECIMAL(12, 2) NOT NULL,
    `eligibility_criteria` TEXT NOT NULL,
    `deadline` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Scholarship Applications Table
CREATE TABLE IF NOT EXISTS `scholarship_applications` (
    `id` VARCHAR(36) PRIMARY KEY,
    `scheme_id` VARCHAR(36) NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `annual_family_income` DECIMAL(12, 2) NOT NULL,
    `previous_gpa` DECIMAL(4, 2) NOT NULL,
    `reason_for_application` TEXT NOT NULL,
    `document_path` VARCHAR(500) NULL,
    `status` ENUM('submitted', 'under_review', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
    `admin_remarks` TEXT NULL,
    `reviewed_by` VARCHAR(36) NULL,
    `reviewed_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_scholarship_status` (`status`)
) ENGINE=InnoDB;

-- 10. Dynamic Form Builder (JSON Schemas) Table
CREATE TABLE IF NOT EXISTS `dynamic_forms` (
    `id` VARCHAR(36) PRIMARY KEY,
    `form_code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `schema_json` LONGTEXT NOT NULL, -- JSON Array of Field Definitions
    `is_published` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Dynamic Form Submissions Table
CREATE TABLE IF NOT EXISTS `form_submissions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `form_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `response_json` LONGTEXT NOT NULL, -- JSON Object with Key-Value responses
    `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`form_id`) REFERENCES `dynamic_forms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_form_submissions_form` (`form_id`)
) ENGINE=InnoDB;

-- 12. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS `documents` (
    `id` VARCHAR(36) PRIMARY KEY,
    `entity_type` ENUM('admission', 'scholarship', 'fee_receipt', 'identity', 'general') NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size_bytes` INT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `uploaded_by` VARCHAR(36) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_documents_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB;

-- 13. Institutional Notices Table
CREATE TABLE IF NOT EXISTS `notices` (
    `id` VARCHAR(36) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT NOT NULL,
    `content` LONGTEXT NULL,
    `notice_date` DATE NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'Academic',
    `is_pinned` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
