-- Fix: Data truncated for column 'role' when creating HR users.
-- Run this on the backend database used by the leave management system.
--
-- MySQL/MariaDB:
-- The frontend sends lowercase role values:
-- user, lead, assistant manager, manager, hr, admin

ALTER TABLE users
  MODIFY role ENUM(
    'user',
    'lead',
    'assistant manager',
    'manager',
    'hr',
    'admin'
  ) NOT NULL DEFAULT 'user';
