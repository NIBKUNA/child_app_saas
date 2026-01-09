-- Migration: Deep Clean Ghost Data
-- Description: Removes all orphaned records that are not linked to valid parent records.

BEGIN;

-- 1. Clean Payment Items (orphaned from payments or schedules)
DELETE FROM payment_items
WHERE payment_id IS NOT NULL 
AND payment_id NOT IN (SELECT id FROM payments);

DELETE FROM payment_items
WHERE schedule_id IS NOT NULL 
AND schedule_id NOT IN (SELECT id FROM schedules);

-- 2. Clean Payments (orphaned from children)
DELETE FROM payments
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- 3. Clean Schedules (orphaned from children)
DELETE FROM schedules
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- 4. Clean Counseling Logs
DELETE FROM counseling_logs
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

DELETE FROM counseling_logs
WHERE schedule_id IS NOT NULL 
AND schedule_id NOT IN (SELECT id FROM schedules);

-- 5. Clean Daily Notes
DELETE FROM daily_notes
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

DELETE FROM daily_notes
WHERE schedule_id IS NOT NULL 
AND schedule_id NOT IN (SELECT id FROM schedules);

-- 6. Clean Consultations
DELETE FROM consultations
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

DELETE FROM consultations
WHERE schedule_id IS NOT NULL 
AND schedule_id NOT IN (SELECT id FROM schedules);

-- 7. Clean Vouchers
DELETE FROM vouchers
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- 8. Clean Child-Therapist Relations
DELETE FROM child_therapist
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

COMMIT;
