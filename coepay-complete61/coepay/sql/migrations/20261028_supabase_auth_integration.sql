-- =============================================================================
-- COE-Pay: Database Migration - Supabase OTP Authentication Integration
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+ (InnoDB Engine, utf8mb4_unicode_ci)
-- Date: 2026-10-28
-- Description: Adds supabase_uid and auth_provider columns to users table
--              to securely map authenticated Supabase Auth identities (UUID)
--              to MySQL application records and student profiles.
-- =============================================================================

USE `coepay_db`;

-- 1. Add `supabase_uid` column to `users` table if not exists
-- Supabase Auth generates a 36-character RFC 4122 UUID for each user (auth.users.id).
-- A UNIQUE constraint ensures one-to-one mapping and prevents duplicate links.

SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "supabase_uid";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `supabase_uid` VARCHAR(36) NULL UNIQUE AFTER `user_id`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Add `auth_provider` column to distinguish auth mechanisms
SET @columnname = "auth_provider";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `users` ADD COLUMN `auth_provider` ENUM('local', 'supabase_otp') NOT NULL DEFAULT 'supabase_otp' AFTER `role`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Add Index on `supabase_uid` for fast token lookup
SET @indexname = "idx_users_supabase_uid";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  "SELECT 1",
  "CREATE INDEX `idx_users_supabase_uid` ON `users` (`supabase_uid`);"
));
PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- 4. Audit Log record for migration
INSERT INTO `audit_logs` (`user_id`, `action_type`, `entity_name`, `entity_id`, `details`, `ip_address`, `user_agent`)
VALUES (1, 'MIGRATION_SUPABASE_AUTH', 'schema', NULL, 'Applied 20261028_supabase_auth_integration migration: added supabase_uid and auth_provider columns to users', '127.0.0.1', 'CLI-Migration-Runner')
ON DUPLICATE KEY UPDATE `details` = VALUES(`details`);

-- =============================================================================
-- REVERSIBLE MIGRATION (ROLLBACK INSTRUCTIONS):
-- To revert this schema modification, execute the following statements:
--
-- ALTER TABLE `users` DROP INDEX `idx_users_supabase_uid`;
-- ALTER TABLE `users` DROP COLUMN `supabase_uid`;
-- ALTER TABLE `users` DROP COLUMN `auth_provider`;
-- =============================================================================
