-- =======================================================
-- 🛠️ MASTER SCHEMA & REGISTRATION REPAIR
-- =======================================================
-- This script fixes the naming conflicts, trigger issues, 
-- and ensures clean parent signup/deletion flows.
-- =======================================================

BEGIN;

-- 1. 🧹 OBJECT CLEANUP (Resolving "is not a view" error)
-- We check object types before dropping to avoid the 42809 error.
DO $$ 
BEGIN
    -- Drop triggers first to release dependencies
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS tr_sync_profile_to_parents ON public.user_profiles;
    DROP TRIGGER IF EXISTS final_emergency_trigger ON auth.users;
    DROP TRIGGER IF EXISTS tr_final_fix ON auth.users;

    -- Drop the view if it exists
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        DROP VIEW public.user_profiles CASCADE;
    END IF;
    
    -- Ensure we have a clean slate for the 'profiles' vs 'user_profiles' conflict
    -- In this SaaS, we will standardize on 'user_profiles' as the BASE TABLE.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DROP TABLE public.profiles CASCADE;
    END IF;
END $$;

-- 2. 🏗️ BASE TABLE: user_profiles
-- This table is the "Single Source of Truth" linked to auth.users.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    center_id UUID REFERENCES public.centers(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'parent',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 🏗️ CHILD TABLE: parents
-- ON DELETE CASCADE ensures that when a profile is deleted, the parent record disappears too.
ALTER TABLE IF EXISTS public.parents 
    DROP CONSTRAINT IF EXISTS parents_profile_id_fkey;

ALTER TABLE public.parents 
    ADD CONSTRAINT parents_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- 4. 🤖 THE MASTER TRIGGER: handle_new_signup
-- This handles BOTH user_profile AND specific role-table insertion (parents).
CREATE OR REPLACE FUNCTION public.handle_new_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role user_role;
    v_full_name TEXT;
BEGIN
    -- [A] Determine Center (Priority: Metadata > SEO Center > First Available)
    v_center_id := (new.raw_user_meta_data->>'center_id')::UUID;
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers WHERE slug = 'seoulsegyero' LIMIT 1;
    END IF;
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers LIMIT 1;
    END IF;

    -- [B] Determine Role & Name
    v_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'parent'::user_role);
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '신규회원');

    -- [C] Insert into Main Profile
    INSERT INTO public.user_profiles (id, email, name, role, center_id, phone)
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role,
        v_center_id,
        new.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

    -- [D] If Role is Parent, Insert into Parents Table automatically
    IF v_role = 'parent' THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (
            new.id,
            v_center_id,
            v_full_name,
            new.email,
            COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000')
        )
        ON CONFLICT (profile_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent 500 errors by catching any DB failure but allowing Auth to succeed
    RAISE WARNING 'CRITICAL: handle_new_signup failed for %: %', new.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 🔌 ATTACH THE TRIGGER
DROP TRIGGER IF EXISTS tr_on_signup ON auth.users;
CREATE TRIGGER tr_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_signup();

-- 6. 🧹 CLEANUP "ZOMBI" (One last time to allow retry)
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

COMMIT;
