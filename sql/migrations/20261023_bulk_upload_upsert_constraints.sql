-- =============================================================================
-- Migration: 20261023_bulk_upload_upsert_constraints.sql
-- System: COE-Pay - Centralized Payment Authorization, Collection, and Monitoring
-- Purpose: Schema updates, indexes, unique constraints, and upsert procedure
--          to support robust bulk student masterlist uploads.
-- =============================================================================

USE `coepay_db`;

-- 1. Ensure Unique Key on students.student_number
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'students' 
      AND index_name = 'uq_students_student_number'
);
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `students` ADD UNIQUE KEY `uq_students_student_number` (`student_number`)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Ensure Composite Index for Cohort Lookups (Program, Year Level, Section)
SET @exist := (
    SELECT COUNT(*) 
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
      AND table_name = 'students' 
      AND index_name = 'idx_student_cohort'
);
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `students` ADD INDEX `idx_student_cohort` (`program`, `year_level`, `section`)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Stored Procedure for Safe, Transactional Student Upsert & Obligation Assignment
DROP PROCEDURE IF EXISTS `sp_upsert_student_record`;
DELIMITER //

CREATE PROCEDURE `sp_upsert_student_record`(
    IN  p_student_number VARCHAR(30),
    IN  p_first_name     VARCHAR(50),
    IN  p_middle_name    VARCHAR(50),
    IN  p_last_name      VARCHAR(50),
    IN  p_email          VARCHAR(100),
    IN  p_program        VARCHAR(50),
    IN  p_year_level     TINYINT UNSIGNED,
    IN  p_section        VARCHAR(20),
    IN  p_contact_number VARCHAR(20),
    IN  p_admin_user_id  INT UNSIGNED,
    OUT p_action_taken   VARCHAR(10), -- 'INSERT' or 'UPDATE'
    OUT p_student_id     INT UNSIGNED
)
proc_label: BEGIN
    DECLARE v_user_id INT UNSIGNED;
    DECLARE v_existing_student_id INT UNSIGNED;
    DECLARE v_default_password_hash VARCHAR(255);
    
    -- Default password hash: 'password123' (bcrypt)
    SET v_default_password_hash = '$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq';
    
    -- Clean & normalize inputs
    SET p_student_number = TRIM(p_student_number);
    SET p_first_name     = TRIM(p_first_name);
    SET p_last_name      = TRIM(p_last_name);
    SET p_email          = LOWER(TRIM(p_email));
    SET p_section        = TRIM(p_section);
    IF p_program IS NULL OR p_program = '' THEN
        SET p_program = 'BSCOE';
    END IF;

    -- Check if student already exists by student_number
    SELECT `student_id`, `user_id` INTO v_existing_student_id, v_user_id
    FROM `students`
    WHERE `student_number` = p_student_number
    LIMIT 1;

    IF v_existing_student_id IS NOT NULL THEN
        -- =====================================================
        -- CASE 1: UPDATE EXISTING STUDENT RECORD
        -- =====================================================
        UPDATE `students`
        SET `first_name`     = p_first_name,
            `middle_name`    = NULLIF(TRIM(p_middle_name), ''),
            `last_name`      = p_last_name,
            `program`        = p_program,
            `year_level`     = p_year_level,
            `section`        = p_section,
            `contact_number` = NULLIF(TRIM(p_contact_number), ''),
            `updated_at`     = CURRENT_TIMESTAMP
        WHERE `student_id` = v_existing_student_id;

        -- Update associated user email if provided
        IF p_email IS NOT NULL AND p_email <> '' THEN
            UPDATE `users`
            SET `email`      = p_email,
                `updated_at` = CURRENT_TIMESTAMP
            WHERE `user_id` = v_user_id;
        END IF;

        SET p_action_taken = 'UPDATE';
        SET p_student_id   = v_existing_student_id;

    ELSE
        -- =====================================================
        -- CASE 2: INSERT NEW STUDENT RECORD
        -- =====================================================
        -- Check if user account exists with this username
        SELECT `user_id` INTO v_user_id
        FROM `users`
        WHERE `username` = p_student_number
        LIMIT 1;

        IF v_user_id IS NULL THEN
            -- Check if email is already in use by another user
            IF EXISTS (SELECT 1 FROM `users` WHERE `email` = p_email) THEN
                -- Append student_number suffix to prevent collision
                SET p_email = CONCAT(SUBSTRING_INDEX(p_email, '@', 1), '+', REPLACE(p_student_number, '-', ''), '@', SUBSTRING_INDEX(p_email, '@', -1));
            END IF;

            INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `is_active`)
            VALUES (p_student_number, p_email, v_default_password_hash, 'student', 1);

            SET v_user_id = LAST_INSERT_ID();
        END IF;

        INSERT INTO `students` (
            `user_id`,
            `student_number`,
            `first_name`,
            `middle_name`,
            `last_name`,
            `program`,
            `year_level`,
            `section`,
            `contact_number`
        ) VALUES (
            v_user_id,
            p_student_number,
            p_first_name,
            NULLIF(TRIM(p_middle_name), ''),
            p_last_name,
            p_program,
            p_year_level,
            p_section,
            NULLIF(TRIM(p_contact_number), '')
        );

        SET p_student_id = LAST_INSERT_ID();
        SET p_action_taken = 'INSERT';

    END IF;

    -- =========================================================
    -- COHORT OBLIGATION AUTO-MAPPING
    -- Automatically assign active authorized payment requests matching student cohort
    -- =========================================================
    INSERT INTO `student_payment_assignments` (`request_id`, `student_id`, `status`, `assigned_at`)
    SELECT 
        r.`request_id`,
        p_student_id,
        'unpaid',
        CURRENT_TIMESTAMP
    FROM `payment_requests` r
    WHERE r.`status` = 'authorized'
      AND (r.`target_year_level` IS NULL OR r.`target_year_level` = p_year_level)
      AND (r.`target_section` IS NULL OR LOWER(r.`target_section`) = LOWER(p_section))
      AND NOT EXISTS (
          SELECT 1 
          FROM `student_payment_assignments` a 
          WHERE a.`request_id` = r.`request_id` 
            AND a.`student_id` = p_student_id
      );

END //
DELIMITER ;
