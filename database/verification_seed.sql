-- ==========================================
-- Verification Seed Data
-- ==========================================

-- 1. Create Centers for Testing
-- Note: UUIDs are generated automatically if not provided, but we need to ensure names exist.

INSERT INTO centers (name, address, phone, email, slug)
SELECT 'Jamsil Branch', 'Seoul Songpa-gu Jamsil-dong', '02-1234-5678', 'jamsil@test.com', 'jamsil-branch'
WHERE NOT EXISTS (SELECT 1 FROM centers WHERE name = 'Jamsil Branch');

INSERT INTO centers (name, address, phone, email, slug)
SELECT 'Gangnam Branch', 'Seoul Gangnam-gu Yeoksam-dong', '02-9876-5432', 'gangnam@test.com', 'gangnam-branch'
WHERE NOT EXISTS (SELECT 1 FROM centers WHERE name = 'Gangnam Branch');


-- 2. (Optional) Clear admin settings for these centers to ensure fresh start
-- DELETE FROM admin_settings 
-- WHERE center_id IN (SELECT id FROM centers WHERE name IN ('Jamsil Branch', 'Gangnam Branch'));

-- 3. (Optional) Insert a dummy child for quickly linking if you have access to the DB logs to see the code
-- but for UI testing, it's better to create via UI to see the code.
