-- 🛡️ [Final Security Cleanup - 2026-01-10]
-- 1. Remove Unauthorized Super Admins
-- Delete any profile with role='super_admin' or 'admin' (if intended to be restricted) 
-- that is NOT 'anukbin@gmail.com'.
-- Since 'admin' is for center admins, we should only target 'super_admin' cleanup for safety, 
-- or reset everyone else to 'parent' or 'therapist' if requested.
-- The prompt said "delete all test super_admin accounts except anukbin@gmail.com".

DELETE FROM user_profiles
WHERE role = 'super_admin'
AND email != 'anukbin@gmail.com';

-- 2. Downgrade any 'admin' to 'parent' if they are clearly test accounts (Optional/Safe Mode)
-- For now, purely enforcing Super Admin uniqueness.

-- 3. Verification Query
SELECT id, email, role, status 
FROM user_profiles 
WHERE role = 'super_admin';
