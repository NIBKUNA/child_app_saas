-- Migration: Add center info and operating hours columns
-- Date: 2026-01-09
-- Description: Adds columns for map URL and operating hours to the centers table

ALTER TABLE centers ADD COLUMN IF NOT EXISTS naver_map_url TEXT;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS weekday_hours VARCHAR(100);
ALTER TABLE centers ADD COLUMN IF NOT EXISTS saturday_hours VARCHAR(100);
ALTER TABLE centers ADD COLUMN IF NOT EXISTS holiday_text VARCHAR(200);

-- Add helpful comment
COMMENT ON COLUMN centers.naver_map_url IS 'Naver Map share URL for location';
COMMENT ON COLUMN centers.weekday_hours IS 'Weekday operating hours (e.g. 09:00 - 19:00)';
COMMENT ON COLUMN centers.saturday_hours IS 'Saturday operating hours (e.g. 09:00 - 16:00)';
COMMENT ON COLUMN centers.holiday_text IS 'Holiday/Sunday closure text';
