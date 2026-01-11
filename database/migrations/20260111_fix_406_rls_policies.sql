-- ============================================
-- Fix 406 Not Acceptable Error
-- RLS Policy for admin_settings and centers tables
-- Created: 2026-01-11
-- ============================================

-- 1. Enable RLS on admin_settings table (if not already enabled)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 2. Allow anon (non-authenticated users) to SELECT from admin_settings
-- This is needed for public pages to display center branding/settings
DROP POLICY IF EXISTS "Allow anon to read admin_settings" ON admin_settings;
CREATE POLICY "Allow anon to read admin_settings"
ON admin_settings
FOR SELECT
TO anon
USING (true);

-- 3. Allow authenticated users to SELECT from admin_settings
DROP POLICY IF EXISTS "Allow authenticated to read admin_settings" ON admin_settings;
CREATE POLICY "Allow authenticated to read admin_settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (true);

-- 4. Allow only admins to INSERT/UPDATE/DELETE admin_settings
-- (Keep existing policies for write operations)

-- ============================================
-- Also fix RLS for 'centers' table (used by Footer, Header, etc.)
-- ============================================

-- 5. Enable RLS on centers table
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- 6. Allow anon to read centers (for public footer/header)
DROP POLICY IF EXISTS "Allow anon to read centers" ON centers;
CREATE POLICY "Allow anon to read centers"
ON centers
FOR SELECT
TO anon
USING (true);

-- 7. Allow authenticated users to read centers
DROP POLICY IF EXISTS "Allow authenticated to read centers" ON centers;
CREATE POLICY "Allow authenticated to read centers"
ON centers
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- Verification Query (run this to check policies)
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename IN ('admin_settings', 'centers');
