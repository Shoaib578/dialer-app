-- Adds spreadsheet-import fields to app_contacts. `name` stays as the
-- denormalized full name (first + last) that other tables already read.
ALTER TABLE app_contacts
  ADD COLUMN first_name VARCHAR(191) NOT NULL DEFAULT '' AFTER name,
  ADD COLUMN last_name VARCHAR(191) NOT NULL DEFAULT '' AFTER first_name,
  ADD COLUMN address VARCHAR(320) DEFAULT NULL AFTER phone_e164,
  ADD COLUMN business_name VARCHAR(191) DEFAULT NULL AFTER address,
  ADD COLUMN lender VARCHAR(191) DEFAULT NULL AFTER business_name,
  ADD COLUMN loan_amount DECIMAL(14,2) DEFAULT NULL AFTER lender,
  ADD COLUMN misc VARCHAR(320) DEFAULT NULL AFTER loan_amount,
  ADD COLUMN notes TEXT DEFAULT NULL AFTER misc;

-- Backfill first_name from the existing `name` column for pre-existing rows
-- (best-effort split on the first space; everything else becomes last_name).
UPDATE app_contacts
SET
  first_name = TRIM(SUBSTRING_INDEX(name, ' ', 1)),
  last_name = TRIM(CASE
    WHEN LOCATE(' ', name) > 0 THEN SUBSTRING(name, LOCATE(' ', name) + 1)
    ELSE ''
  END)
WHERE first_name = '';
