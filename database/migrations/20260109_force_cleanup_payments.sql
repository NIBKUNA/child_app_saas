-- Migration: Force Clean & Reset Billing Data
-- Description: Deep cleans orphaned data and provides an option to wipe all payments for a fresh start.

BEGIN;

-- 1. CLEANUP ORPHANS (The likely cause of ghost data)
-- Delete payment_items where payment_id is invalid
DELETE FROM payment_items
WHERE payment_id IS NOT NULL 
AND payment_id NOT IN (SELECT id FROM payments);

-- Delete payments where child_id is invalid (deleted children)
DELETE FROM payments
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- Delete payments where child_id IS NULL (Corrupted data)
DELETE FROM payments
WHERE child_id IS NULL;


-- 2. RESET 'ALREADY PAID' LOGIC (OPTIONAL - Run this if you want TRUE ZERO)
-- Uncomment the lines below to wipe ALL payments for the current operational period (e.g., 2025 onwards)
-- DELETE FROM payment_items;
-- DELETE FROM payments;


-- 3. ENSURE INTEGRITY
-- Verify no schedules exist for deleted children
DELETE FROM schedules
WHERE child_id NOT IN (SELECT id FROM children);

-- Verify no logs exist for deleted children
DELETE FROM counseling_logs WHERE child_id NOT IN (SELECT id FROM children);
DELETE FROM daily_notes WHERE child_id NOT IN (SELECT id FROM children);

COMMIT;
