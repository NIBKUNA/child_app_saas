-- Add session_date column to counseling_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'counseling_logs' AND column_name = 'session_date') THEN
        ALTER TABLE counseling_logs ADD COLUMN session_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Optional: Backfill existing logs with created_at date
UPDATE counseling_logs 
SET session_date = created_at::date 
WHERE session_date IS NULL;
