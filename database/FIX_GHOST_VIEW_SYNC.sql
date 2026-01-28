-- =======================================================
-- 👻 GHOST VIEW SYNC & CLEANUP
-- =======================================================
-- Result: Data is flowing correctly to 'parents', but the 
-- 'view_ghost_users' is still showing the record because it's 
-- checking a stale or different table.
-- This script fixes the view connections.
-- =======================================================

BEGIN;

-- 1. Ensure 'user_profiles' is a VIEW, not a TABLE
-- If it's a table, rename it to back it up, so the View can take over.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_type = 'BASE TABLE') THEN
        ALTER TABLE public.user_profiles RENAME TO user_profiles_old_backup;
    END IF;
END $$;

-- 2. Re-create the View to point to the truth (profiles)
CREATE OR REPLACE VIEW public.user_profiles AS 
SELECT * FROM public.profiles;

-- 3. Fix the Ghost User View
-- A Ghost is someone who exists in Auth but has NO Profile entry.
CREATE OR REPLACE VIEW public.view_ghost_users AS
SELECT 
    au.id, 
    au.email, 
    au.created_at, 
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Final Cleanup of any orphaned records that don't match Auth
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.parents WHERE profile_id NOT IN (SELECT id FROM public.profiles);

COMMIT;
