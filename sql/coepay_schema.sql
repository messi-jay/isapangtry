-- =============================================================================
-- PROJECT NEXUS: COE-Pay Database Schema & Comprehensive Seed Data
-- System: COE-Pay: A Centralized Payment Authorization, Collection, and Monitoring System
-- Institution: ICCT Colleges Foundation, Inc. - College of Engineering and Digital Technology
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

DROP DATABASE IF EXISTS `coepay_db`;
CREATE DATABASE `coepay_db` 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `coepay_db`;

-- -----------------------------------------------------
-- 1. Table: `academic_terms`
-- -----------------------------------------------------
CREATE TABLE `academic_terms` (
    `term_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `academic_year` VARCHAR(20) NOT NULL COMMENT 'e.g. 2026-2027',
    `semester` ENUM('1st Semester', '2nd Semester', 'Summer') NOT NULL,
    `is_current` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = active/current semester, 0 = past/future',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_academic_term` (`academic_year`, `semester`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 2. Table: `users`
-- -----------------------------------------------------
CREATE TABLE `users` (
    `user_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `supabase_uid` VARCHAR(36) NULL UNIQUE COMMENT 'Supabase Auth RFC 4122 UUID identity',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'School ID or unique username',
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt or Argon2 hash (empty or placeholder for OTP-only accounts)',
    `role` ENUM('admin', 'personnel', 'student', 'developer') NOT NULL DEFAULT 'student',
    `auth_provider` ENUM('local', 'supabase_otp') NOT NULL DEFAULT 'supabase_otp',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = deactivated/suspended',
    `last_login` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_supabase_uid` (`supabase_uid`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_status` (`is_active`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 3. Table: `students`
-- -----------------------------------------------------
CREATE TABLE `students` (
    `student_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `student_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'ICCT Student ID Number',
    `first_name` VARCHAR(50) NOT NULL,
    `middle_name` VARCHAR(50) NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `program` VARCHAR(50) NOT NULL DEFAULT 'BSCpE' COMMENT 'Computer Engineering',
    `year_level` TINYINT UNSIGNED NOT NULL COMMENT '1 = 1st Year, 2 = 2nd Year, etc.',
    `section` VARCHAR(20) NOT NULL COMMENT 'e.g. BSCpE-4A',
    `contact_number` VARCHAR(20) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_student_program_year` (`program`, `year_level`, `section`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 4. Table: `personnel`
-- -----------------------------------------------------
CREATE TABLE `personnel` (
    `personnel_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL UNIQUE,
    `employee_number` VARCHAR(30) NOT NULL UNIQUE,
    `first_name` VARCHAR(50) NOT NULL,
    `middle_name` VARCHAR(50) NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `department` VARCHAR(100) NOT NULL DEFAULT 'College of Engineering and Digital Technology',
    `designation` VARCHAR(100) NOT NULL COMMENT 'e.g. Department Chair, Org Treasurer, Faculty Adviser',
    `contact_number` VARCHAR(20) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_personnel_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 5. Table: `payment_categories`
-- -----------------------------------------------------
CREATE TABLE `payment_categories` (
    `category_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 6. Table: `payment_requests`
-- -----------------------------------------------------
CREATE TABLE `payment_requests` (
    `request_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(150) NOT NULL COMMENT 'Purpose/Title of the contribution',
    `description` TEXT NOT NULL COMMENT 'Detailed breakdown and instructions',
    `category_id` INT UNSIGNED NOT NULL,
    `term_id` INT UNSIGNED NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL COMMENT 'Payable amount per student in PHP',
    `deadline` DATETIME NOT NULL COMMENT 'Final due date for submission',
    `target_year_level` TINYINT UNSIGNED NULL,
    `target_section` VARCHAR(20) NULL,
    `gcash_account_name` VARCHAR(100) NOT NULL,
    `gcash_account_number` VARCHAR(20) NOT NULL,
    `gcash_qr_code_path` VARCHAR(255) NULL,
    `status` ENUM('draft', 'pending_authorization', 'authorized', 'rejected', 'closed') NOT NULL DEFAULT 'draft',
    `created_by_personnel_id` INT UNSIGNED NOT NULL,
    `authorized_by_user_id` INT UNSIGNED NULL,
    `authorized_at` DATETIME NULL,
    `authorization_remarks` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_requests_category` FOREIGN KEY (`category_id`) REFERENCES `payment_categories` (`category_id`) ON UPDATE CASCADE,
    CONSTRAINT `fk_requests_term` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`term_id`) ON UPDATE CASCADE,
    CONSTRAINT `fk_requests_creator` FOREIGN KEY (`created_by_personnel_id`) REFERENCES `personnel` (`personnel_id`) ON UPDATE CASCADE,
    CONSTRAINT `fk_requests_authorizer` FOREIGN KEY (`authorized_by_user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
    INDEX `idx_requests_status_deadline` (`status`, `deadline`),
    INDEX `idx_requests_target` (`target_year_level`, `target_section`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 7. Table: `student_payment_assignments`
-- -----------------------------------------------------
CREATE TABLE `student_payment_assignments` (
    `assignment_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `request_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `status` ENUM('unpaid', 'pending_verification', 'paid', 'overdue') NOT NULL DEFAULT 'unpaid',
    `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_request_student` (`request_id`, `student_id`),
    CONSTRAINT `fk_assignments_request` FOREIGN KEY (`request_id`) REFERENCES `payment_requests` (`request_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_assignments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_assignment_status` (`status`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 8. Table: `payment_transactions`
-- -----------------------------------------------------
CREATE TABLE `payment_transactions` (
    `transaction_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` INT UNSIGNED NOT NULL,
    `request_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `gcash_reference_number` VARCHAR(50) NOT NULL COMMENT 'Unique 13-digit ref number',
    `gcash_sender_name` VARCHAR(100) NOT NULL,
    `gcash_sender_number` VARCHAR(20) NOT NULL,
    `amount_paid` DECIMAL(10,2) NOT NULL,
    `payment_timestamp` DATETIME NOT NULL,
    `receipt_image_path` VARCHAR(255) NOT NULL,
    `student_notes` TEXT NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `verified_by_personnel_id` INT UNSIGNED NULL,
    `verified_at` DATETIME NULL,
    `verification_remarks` TEXT NULL,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_gcash_ref` (`gcash_reference_number`),
    CONSTRAINT `fk_trans_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `student_payment_assignments` (`assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_trans_request` FOREIGN KEY (`request_id`) REFERENCES `payment_requests` (`request_id`) ON UPDATE CASCADE,
    CONSTRAINT `fk_trans_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON UPDATE CASCADE,
    CONSTRAINT `fk_trans_verifier` FOREIGN KEY (`verified_by_personnel_id`) REFERENCES `personnel` (`personnel_id`) ON UPDATE CASCADE,
    INDEX `idx_trans_status` (`status`),
    INDEX `idx_trans_gcash_ref` (`gcash_reference_number`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 9. Table: `audit_logs`
-- -----------------------------------------------------
CREATE TABLE `audit_logs` (
    `log_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `entity_name` VARCHAR(50) NOT NULL,
    `entity_id` INT UNSIGNED NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_audit_action` (`action_type`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 10. Table: `dispatched_emails`
-- -----------------------------------------------------
CREATE TABLE `dispatched_emails` (
    `email_id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `recipient_email` VARCHAR(150) NOT NULL,
    `recipient_name` VARCHAR(150) NOT NULL,
    `student_number` VARCHAR(50) NULL,
    `email_type` VARCHAR(50) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `body_text` TEXT NOT NULL,
    `status` VARCHAR(30) DEFAULT 'DELIVERED',
    `dispatched_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_recipient_email` (`recipient_email`),
    INDEX `idx_student_number` (`student_number`),
    INDEX `idx_email_type` (`email_type`)
) ENGINE=InnoDB;

-- =============================================================================
-- COMPREHENSIVE SEED DATA
-- Default password hash: "password123" ($2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq)
-- =============================================================================

-- Academic Terms
INSERT INTO `academic_terms` (`term_id`, `academic_year`, `semester`, `is_current`) VALUES
(1, '2025-2026', '2nd Semester', 0),
(2, '2026-2027', '1st Semester', 1),
(3, '2026-2027', '2nd Semester', 0);

-- Payment Categories
INSERT INTO `payment_categories` (`category_id`, `category_name`, `description`, `is_active`) VALUES
(1, 'Departmental / Org Fee', 'Official ICCT COE Student Council membership, laboratory insurance, and engineering events kit.', 1),
(2, 'Capstone & Research Project', 'BSCpE Colloquium, panel evaluation honoraria, and research repository binder.', 1),
(3, 'Laboratory Maintenance Fee', 'Robotics, Embedded Systems, and IoT Lab equipment maintenance, probes, and consumables.', 1),
(4, 'Departmental Uniform / Shirt', 'Official College of Engineering and Digital Technology technical polo shirt and patch.', 1),
(5, 'Engineering Summit & Seminars', 'Annual Engineering Convention, tech workshops, industry tours, and digital certificates.', 1),
(6, 'Graduation / Exit Assessment', 'Graduation clearance, engineering ring & pin kit, and competency assessment fee.', 1),
(7, 'Embedded Systems & IoT Workshop', 'Microcontroller hardware kit (ESP32, sensors, jumpers) for laboratory projects.', 1);

-- Users (Developer, Coordinator, Officer, Faculty, 8 Official Masterlist Students)
INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `role`, `is_active`, `last_login`) VALUES
(100, 'developer', 'dave.guiyab@developer.coepay.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'developer', 1, NOW()),
(1, 'engr.mendoza', 'ivanlee.mendoza@icct.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'coordinator', 1, NOW()),
(2, 'officer', 'pearl.catequista@icct.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'officer', 1, NOW()),
(3, 'engr.delacruz', 'ramon.delacruz@icct.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'officer', 1, NOW()),
(4, 'engr.fernandez', 'anthony.fernandez@icct.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'officer', 1, NOW()),
-- 8 Official Students
(30, '2023-10001', 'christian.guiyab@students.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(31, '2023-10009', 'sstephencurryy30@gmail.com', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(32, '2023-10003', 'jeffesonsadoguio@gmail.com', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(33, '2023-10004', 'jerome.opana@students.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(34, '2023-10005', 'aaron.canonizado@students.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(35, '2023-10006', 'johnrobin.fernandez@students.edu.ph', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(36, '2023-10007', 'sdimasuay13@gmail.com', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW()),
(37, '2023-10008', 'gonzagat634@gmail.com', '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq', 'student', 1, NOW());

-- Personnel Profiles
INSERT INTO `personnel` (`personnel_id`, `user_id`, `employee_number`, `first_name`, `middle_name`, `last_name`, `department`, `designation`, `contact_number`) VALUES
(1, 2, 'OFF-2024-001', 'Pearl', 'Alexa', 'Catequista', 'College of Engineering Student Council & Organizations', 'College Student Officer & Financial Treasurer', '09123456789'),
(2, 3, 'EMP-2019-105', 'Ramon', 'Bautista', 'Dela Cruz', 'College of Engineering and Digital Technology', 'Faculty Adviser / Laboratory Head', '09189876543'),
(3, 4, 'EMP-2020-218', 'Anthony', 'Gerard', 'Fernandez', 'College of Engineering and Digital Technology', 'Senior Capstone & Research Coordinator', '09195556677');

-- Official Student Profiles (8 Masterlist Students)
INSERT INTO `students` (`student_id`, `user_id`, `student_number`, `first_name`, `middle_name`, `last_name`, `program`, `year_level`, `section`, `contact_number`) VALUES
(101, 30, '2023-10001', 'Christian Dave', 'D.', 'Guiyab', 'BS Computer Engineering', 4, '4A', '09123456789'),
(102, 31, '2023-10009', 'Jay-are', NULL, 'Mesias', 'BS Computer Engineering', 4, '4A', '09391439718'),
(103, 32, '2023-10003', 'Jefferson', 'C.', 'Sadoguio', 'BS Computer Engineering', 4, '4A', '09165938156'),
(104, 33, '2023-10004', 'Jerome', 'R.', 'Opana', 'BS Computer Engineering', 4, '4A', '09123456789'),
(105, 34, '2023-10005', 'Aaron Mikhael', NULL, 'Canonizado', 'BS Computer Engineering', 4, '4A', '09123456789'),
(106, 35, '2023-10006', 'John Robin', 'P.', 'Fernandez', 'BS Computer Engineering', 4, '4A', '09123456789'),
(107, 36, '2023-10007', 'Ma. Sophia', 'B.', 'Dimasu-ay', 'BS Computer Engineering', 4, '4A', '09636729211'),
(108, 37, '2023-10008', 'Tricia Mae', 'S.', 'Gonzaga', 'BS Computer Engineering', 4, '4A', '009501807279');

-- Payment Requests
INSERT INTO `payment_requests` (`request_id`, `title`, `description`, `category_id`, `term_id`, `amount`, `deadline`, `target_year_level`, `target_section`, `gcash_account_name`, `gcash_account_number`, `gcash_qr_code_path`, `status`, `created_by_personnel_id`, `authorized_by_user_id`, `authorized_at`, `authorization_remarks`) VALUES
(1, '1st Sem 2026-2027 COE Departmental Org Fee', 'Official ICCT COE Student Council membership, laboratory accident insurance, ID validation badge, and national convention entry.', 1, 2, 350.00, '2026-11-20 23:59:59', NULL, NULL, 'MARIA C SANTOS (COE TREASURER)', '09171234567', 'assets/img/qr-coe-org.svg', 'authorized', 1, 1, '2026-10-01 09:30:00', 'Approved for institutional collection across all COE students.'),
(2, 'BSCpE-4A Capstone 2 Final Defense and Colloquium Fee', 'Includes panel honoraria, technical proceedings print binder, plaque of recognition, and symposium refreshments.', 2, 2, 1200.00, '2026-10-31 23:59:59', 4, '4A', 'MARIA C SANTOS (COE TREASURER)', '09171234567', 'assets/img/qr-coe-org.svg', 'authorized', 1, 1, '2026-10-05 14:15:00', 'Approved for BSCpE 4th Year Section 4A only.'),
(3, '2026 Engineering Technical Polo Shirt (Batch 2027)', 'Embroidered institutional COE navy blue polo shirt with reflective engineering crest and student badge.', 4, 2, 550.00, '2026-11-25 23:59:59', 4, NULL, 'RAMON B DELA CRUZ', '09189876543', 'assets/img/qr-coe-org.svg', 'authorized', 2, 1, '2026-10-08 11:00:00', 'Authorized for all graduating 4th year sections.'),
(4, 'Embedded Systems & IoT Hardware Lab Kit', 'ESP32-WROOM-32D Development Board, Relay modules, I2C OLED display, and jumper wires replenishment.', 7, 2, 850.00, '2026-12-05 23:59:59', 3, '3A', 'ANTHONY G FERNANDEZ', '09195556677', 'assets/img/qr-coe-org.svg', 'pending_authorization', 3, NULL, NULL, NULL),
(5, 'Annual National Engineering Summit & Expo 2026', 'Registration and chartered transport fee for SMX Convention Center tech summit.', 5, 2, 1500.00, '2026-12-15 23:59:59', NULL, NULL, 'MARIA C SANTOS (COE TREASURER)', '09171234567', 'assets/img/qr-coe-org.svg', 'draft', 1, NULL, NULL, NULL),
(6, 'Robotics Arena Sensor Replenishment Fee', 'Ultrasonic rangefinders, motor shield drivers, and LiPo batteries for tournament testing.', 3, 2, 450.00, '2026-10-10 23:59:59', 4, '4B', 'RAMON B DELA CRUZ', '09189876543', 'assets/img/qr-coe-org.svg', 'authorized', 2, 1, '2026-09-25 09:00:00', 'Approved for BSCpE 4B Robotics class.');

-- Student Payment Assignments
INSERT INTO `student_payment_assignments` (`assignment_id`, `request_id`, `student_id`, `status`, `assigned_at`) VALUES
(101, 1, 101, 'paid', '2026-10-01 10:00:00'),
(102, 2, 101, 'unpaid', '2026-10-05 15:00:00'),
(103, 3, 101, 'unpaid', '2026-10-08 14:00:00'),
(104, 1, 102, 'paid', '2026-10-01 10:00:00'),
(105, 2, 102, 'paid', '2026-10-05 15:00:00'),
(106, 3, 102, 'paid', '2026-10-08 14:00:00'),
(107, 1, 103, 'paid', '2026-10-01 10:00:00'),
(108, 2, 103, 'paid', '2026-10-05 15:00:00'),
(109, 3, 103, 'paid', '2026-10-08 14:00:00'),
(110, 1, 104, 'paid', '2026-10-01 10:00:00'),
(111, 2, 104, 'pending_verification', '2026-10-05 15:00:00'),
(112, 3, 104, 'unpaid', '2026-10-08 14:00:00'),
(113, 1, 105, 'pending_verification', '2026-10-01 10:00:00'),
(114, 2, 105, 'unpaid', '2026-10-05 15:00:00'),
(115, 3, 105, 'unpaid', '2026-10-08 14:00:00'),
(116, 1, 106, 'paid', '2026-10-01 10:00:00'),
(117, 2, 106, 'unpaid', '2026-10-05 15:00:00'),
(118, 3, 106, 'unpaid', '2026-10-08 14:00:00'),
(119, 1, 107, 'paid', '2026-10-01 10:00:00'),
(120, 2, 107, 'paid', '2026-10-05 15:00:00'),
(121, 3, 107, 'paid', '2026-10-08 14:00:00'),
(122, 1, 108, 'unpaid', '2026-10-01 10:00:00'),
(123, 2, 108, 'unpaid', '2026-10-05 15:00:00'),
(124, 3, 108, 'unpaid', '2026-10-08 14:00:00');

-- Payment Transactions
INSERT INTO `payment_transactions` (`transaction_id`, `assignment_id`, `request_id`, `student_id`, `gcash_reference_number`, `gcash_sender_name`, `gcash_sender_number`, `amount_paid`, `payment_timestamp`, `receipt_image_path`, `student_notes`, `status`, `verified_by_personnel_id`, `verified_at`, `verification_remarks`, `submitted_at`) VALUES
(1, 101, 1, 101, '9021884920193', 'CHRISTIAN DAVE GUIYAB', '09123456789', 350.00, '2026-10-02 14:15:00', 'sample_receipt_1', 'COE Departmental Org Fee Paid', 'verified', 1, '2026-10-02 14:20:00', 'Verified against GCash Statement.', '2026-10-02 14:16:00'),
(2, 104, 1, 102, '9022510294821', 'JAY-ARE MESIAS', '09391439718', 350.00, '2026-10-02 16:30:00', 'sample_receipt_2', '1st Sem Org Fee payment', 'verified', 1, '2026-10-02 16:45:00', 'Merchant ledger checked. Approved.', '2026-10-02 16:35:00'),
(3, 105, 2, 102, '9022981048291', 'JAY-ARE MESIAS', '09391439718', 1200.00, '2026-10-06 10:15:00', 'sample_receipt_3', 'Capstone defense payment full', 'verified', 1, '2026-10-06 10:30:00', 'Official voucher generated.', '2026-10-06 10:20:00'),
(4, 106, 3, 102, '9023419028341', 'JAY-ARE MESIAS', '09391439718', 550.00, '2026-10-09 13:50:00', 'sample_receipt_4', 'Polo Shirt Size L', 'verified', 2, '2026-10-09 14:10:00', 'Payment confirmed.', '2026-10-09 13:55:00'),
(5, 107, 1, 103, '9024018294812', 'JEFFERSON SADOGUIO', '09165938156', 350.00, '2026-10-03 11:00:00', 'sample_receipt_5', 'Org Fee 4A', 'verified', 1, '2026-10-03 11:20:00', 'Reference approved.', '2026-10-03 11:05:00'),
(6, 108, 2, 103, '9025110294819', 'JEFFERSON SADOGUIO', '09165938156', 1200.00, '2026-10-07 13:40:00', 'sample_receipt_6', 'Capstone 2 colloquium fee', 'verified', 1, '2026-10-07 14:00:00', 'Paid in full.', '2026-10-07 13:45:00'),
(7, 109, 3, 103, '9026201948201', 'JEFFERSON SADOGUIO', '09165938156', 550.00, '2026-10-10 11:10:00', 'sample_receipt_7', 'Polo Shirt Size M', 'verified', 2, '2026-10-10 11:30:00', 'Verified and settled.', '2026-10-10 11:15:00'),
(8, 110, 1, 104, '9027381948201', 'JEROME OPANA', '09123456789', 350.00, '2026-10-04 14:15:00', 'sample_receipt_8', 'Departmental contribution', 'verified', 1, '2026-10-04 14:30:00', 'Confirmed.', '2026-10-04 14:20:00'),
(9, 111, 2, 104, '9028491029481', 'JEROME OPANA', '09123456789', 1200.00, '2026-10-16 10:55:00', 'sample_receipt_9', 'Capstone defense payment submitted', 'pending', NULL, NULL, NULL, '2026-10-16 11:00:00'),
(10, 113, 1, 105, '9029501948201', 'AARON MIKHAEL CANONIZADO', '09123456789', 350.00, '2026-10-16 09:05:00', 'sample_receipt_10', 'Org Fee express payment', 'pending', NULL, NULL, NULL, '2026-10-16 09:10:00'),
(11, 116, 1, 106, '9030018492011', 'JOHN ROBIN FERNANDEZ', '09123456789', 350.00, '2026-10-05 15:45:00', 'sample_receipt_11', 'Membership dues', 'verified', 1, '2026-10-05 16:00:00', 'Receipt approved.', '2026-10-05 15:50:00'),
(12, 119, 1, 107, '9030129482012', 'MA SOPHIA DIMASU-AY', '09636729211', 350.00, '2026-10-04 10:05:00', 'sample_receipt_12', 'COE Council Fee', 'verified', 1, '2026-10-04 10:20:00', 'Cleared.', '2026-10-04 10:10:00'),
(13, 120, 2, 107, '9030230593023', 'MA SOPHIA DIMASU-AY', '09636729211', 1200.00, '2026-10-07 16:15:00', 'sample_receipt_13', 'Capstone Colloquium panel fee', 'verified', 1, '2026-10-07 16:30:00', 'Approved and valid.', '2026-10-07 16:20:00'),
(14, 121, 3, 107, '9030341604134', 'MA SOPHIA DIMASU-AY', '09636729211', 550.00, '2026-10-10 13:40:00', 'sample_receipt_14', 'Technical Polo Shirt S', 'verified', 2, '2026-10-10 14:00:00', 'Payment confirmed.', '2026-10-10 13:45:00');

-- Audit Logs
INSERT INTO `audit_logs` (`log_id`, `user_id`, `action_type`, `entity_name`, `entity_id`, `details`, `ip_address`, `user_agent`) VALUES
(1, 1, 'SYSTEM_INIT', 'database', 1, 'Initialized COE-Pay official masterlist cohort for Academic Year 2026-2027 1st Semester', '127.0.0.1', 'Database Bootstrap Script'),
(2, 2, 'CREATE_REQUEST', 'payment_requests', 1, 'Created payment request: 1st Sem 2026-2027 COE Departmental Org Fee (PHP 350.00)', '192.168.1.10', 'Mozilla/5.0'),
(3, 1, 'AUTHORIZE_REQUEST', 'payment_requests', 1, 'Authorized payment request #1 and generated student assignments for 8 official students', '192.168.1.5', 'Mozilla/5.0'),
(4, 30, 'SUBMIT_PAYMENT', 'payment_transactions', 1, 'Submitted GCash payment ref: 9021884920193 for Request #1 (PHP 350.00)', '192.168.1.101', 'Mozilla/5.0'),
(5, 2, 'VERIFY_PAYMENT', 'payment_transactions', 1, 'Verified transaction #1 (Christian Dave Guiyab). Marked as paid.', '192.168.1.10', 'Mozilla/5.0'),
(6, 31, 'SUBMIT_PAYMENT', 'payment_transactions', 2, 'Submitted GCash payment ref: 9022510294821 for Request #1 (PHP 350.00)', '192.168.1.102', 'Mozilla/5.0'),
(7, 2, 'VERIFY_PAYMENT', 'payment_transactions', 2, 'Verified transaction #2 (Jay-are Mesias). Marked as paid.', '192.168.1.10', 'Mozilla/5.0'),
(8, 32, 'SUBMIT_PAYMENT', 'payment_transactions', 5, 'Submitted GCash payment ref: 9024018294812 for Request #1 (PHP 350.00)', '192.168.1.103', 'Mozilla/5.0'),
(9, 2, 'VERIFY_PAYMENT', 'payment_transactions', 5, 'Verified transaction #5 (Jefferson Sadoguio). Marked as paid.', '192.168.1.10', 'Mozilla/5.0'),
(10, 1, 'EMAIL_DISPATCH_DEFAULT_PASSWORD', 'users', 30, 'Dispatched initial welcome credentials and default password to 8 official masterlist students', '192.168.1.5', 'Mozilla/5.0');

-- Dispatched Emails Seed Records
INSERT INTO `dispatched_emails` (`email_id`, `recipient_email`, `recipient_name`, `student_number`, `email_type`, `subject`, `body_text`, `status`, `dispatched_at`) VALUES
(1, 'christian.guiyab@students.edu.ph', 'Christian Dave D. Guiyab', '2023-10001', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Christian Dave D. Guiyab,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10001\nRegistered Email: christian.guiyab@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:30:00'),
(2, 'sstephencurryy30@gmail.com', 'Jay-are Mesias', '2023-10009', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Jay-are Mesias,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10009\nRegistered Email: sstephencurryy30@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:31:00'),
(3, 'jeffesonsadoguio@gmail.com', 'Jefferson C. Sadoguio', '2023-10003', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Jefferson C. Sadoguio,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10003\nRegistered Email: jeffesonsadoguio@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:32:00'),
(4, 'jerome.opana@students.edu.ph', 'Jerome R. Opana', '2023-10004', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Jerome R. Opana,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10004\nRegistered Email: jerome.opana@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:33:00'),
(5, 'aaron.canonizado@students.edu.ph', 'Aaron Mikhael Canonizado', '2023-10005', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Aaron Mikhael Canonizado,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10005\nRegistered Email: aaron.canonizado@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:34:00'),
(6, 'johnrobin.fernandez@students.edu.ph', 'John Robin P. Fernandez', '2023-10006', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear John Robin P. Fernandez,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10006\nRegistered Email: johnrobin.fernandez@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:35:00'),
(7, 'sdimasuay13@gmail.com', 'Ma. Sophia B. Dimasu-ay', '2023-10007', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Ma. Sophia B. Dimasu-ay,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10007\nRegistered Email: sdimasuay13@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:36:00'),
(8, 'gonzagat634@gmail.com', 'Tricia Mae S. Gonzaga', '2023-10008', 'DEFAULT_PASSWORD', 'Welcome to COE-Pay: Your Default Login Credentials', 'Dear Tricia Mae S. Gonzaga,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10008\nRegistered Email: gonzagat634@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.', 'DELIVERED', '2026-08-20 09:37:00');
