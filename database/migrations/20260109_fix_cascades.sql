-- Migration: Fix Foreign Key Cascades for Data Integrity
-- Description: Adds ON DELETE CASCADE to critical relationships to ensure clean deletion.

-- 1. Schedules -> Payment Items (일정 삭제 시 수납 상세 삭제)
ALTER TABLE payment_items
DROP CONSTRAINT IF EXISTS payment_items_schedule_id_fkey;

ALTER TABLE payment_items
ADD CONSTRAINT payment_items_schedule_id_fkey
FOREIGN KEY (schedule_id)
REFERENCES schedules(id)
ON DELETE CASCADE;

-- 2. Schedules -> Counseling Logs (일정 삭제 시 상담 일지 삭제)
ALTER TABLE counseling_logs
DROP CONSTRAINT IF EXISTS counseling_logs_schedule_id_fkey;

ALTER TABLE counseling_logs
ADD CONSTRAINT counseling_logs_schedule_id_fkey
FOREIGN KEY (schedule_id)
REFERENCES schedules(id)
ON DELETE CASCADE;

-- 3. Schedules -> Daily Notes (일정 삭제 시 알림장 삭제)
ALTER TABLE daily_notes
DROP CONSTRAINT IF EXISTS daily_notes_schedule_id_fkey;

ALTER TABLE daily_notes
ADD CONSTRAINT daily_notes_schedule_id_fkey
FOREIGN KEY (schedule_id)
REFERENCES schedules(id)
ON DELETE CASCADE;

-- 4. Children -> Payments (아동 삭제 시 결제 내역 삭제)
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_child_id_fkey;

ALTER TABLE payments
ADD CONSTRAINT payments_child_id_fkey
FOREIGN KEY (child_id)
REFERENCES children(id)
ON DELETE CASCADE;

-- 5. Schedules -> Consultations (일정 삭제 시 상담 신청서 연결 해제 또는 삭제)
-- Note: 'consultations' table schema might vary, check if column exists first or handle error.
-- Assuming 'consultations_schedule_id_fkey' exists based on error logs.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'consultations_schedule_id_fkey') THEN
        ALTER TABLE consultations DROP CONSTRAINT consultations_schedule_id_fkey;
        ALTER TABLE consultations ADD CONSTRAINT consultations_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;
END $$;
