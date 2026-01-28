-- =======================================================
-- 🏆 THE FINAL TRUTH: SINGLE SOURCE OF TRUTH (V10)
-- =======================================================
-- This script ends the "Ghost User" cycle by:
-- 1. Merging 'profiles' and 'user_profiles' back into ONE table.
-- 2. Fixing all broken Foreign Keys.
-- 3. Cleaning all 'zombi' traces everywhere.
-- =======================================================

BEGIN;

-- [1] CLEANUP CONFUSING VIEWS/TABLES
DROP VIEW IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles_old_backup CASCADE;

-- [2] ENSURE 'user_profiles' IS THE REAL TABLE
-- If 'profiles' table exists, we rename it to 'user_profiles' (the name used in the original schema)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- If user_profiles exists as a table, we merge data. If not, rename.
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
            INSERT INTO public.user_profiles SELECT * FROM public.profiles ON CONFLICT (id) DO NOTHING;
            DROP TABLE public.profiles CASCADE;
        ELSE
            ALTER TABLE public.profiles RENAME TO user_profiles;
        END IF;
    END IF;
END $$;

-- [3] FIX BROKEN FOREIGN KEYS
-- We need to ensure parents, therapists, and family_relationships all point to 'user_profiles'
ALTER TABLE IF EXISTS public.parents DROP CONSTRAINT IF EXISTS parents_profile_id_fkey;
ALTER TABLE public.parents ADD CONSTRAINT parents_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.therapists DROP CONSTRAINT IF EXISTS therapists_profile_id_fkey;
ALTER TABLE public.therapists ADD CONSTRAINT therapists_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.family_relationships DROP CONSTRAINT IF EXISTS family_relationships_parent_id_fkey;
ALTER TABLE public.family_relationships ADD CONSTRAINT family_relationships_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- [4] THE "UNBREAKABLE" TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
BEGIN
    -- [A] Resolve Center
    SELECT id INTO v_center_id FROM public.centers WHERE slug = 'seoulsegyero' LIMIT 1;
    IF v_center_id IS NULL THEN SELECT id INTO v_center_id FROM public.centers LIMIT 1; END IF;

    -- [B] Insert into SINGLE truth table
    INSERT INTO public.user_profiles (id, email, name, role, center_id, phone, is_active)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', '회원'),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'parent'::user_role), 
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [5] THE "PERFECT" SYNC
CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    IF new.role = 'parent' THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (new.id, new.center_id, new.name, new.email, COALESCE(new.phone, '010-0000-0000'))
        ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
    ELSE
        DELETE FROM public.parents WHERE profile_id = new.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [6] NUCLEAR CLEANUP (One last time)
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.user_profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

COMMIT;
