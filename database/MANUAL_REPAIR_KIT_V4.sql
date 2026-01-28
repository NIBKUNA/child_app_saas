-- =======================================================
-- 🛠️ MANUAL REPAIR KIT V4 (ADD MISSING ENUM)
-- =======================================================
-- Reason: The 'staff' role might be missing from the ENUM, 
-- causing issues if the frontend sends 'staff' but DB only accepts 'therapist'.
-- =======================================================

BEGIN;

-- 1. 🧹 CLEANUP: Remove conflicting test data
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.user_profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 2. 🏗️ STRUCTURE: Ensure 'phone' column & ENUM update
DO $$ 
BEGIN
    -- Phone Column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;

    -- Update ENUM safely (if 'staff' is missing)
    -- We can't IF NOT EXISTS add value easily in transaction block on some PG versions, 
    -- but usually ALTER TYPE ADD VALUE IF NOT EXISTS works.
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Enum update skipped or failed: %', SQLERRM;
    END;

     BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee';
    EXCEPTION WHEN OTHERS THEN
         NULL;
    END;
END $$;

-- 3. 🔌 TRIGGER 1: AUTH -> PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_raw_center TEXT;
    v_role user_role;
BEGIN
    v_raw_center := new.raw_user_meta_data->>'center_id';
    
    -- Safe Center ID
    BEGIN
        IF v_raw_center IS NOT NULL AND v_raw_center != '' THEN
            v_center_id := v_raw_center::UUID;
        ELSE
            v_center_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_center_id := NULL;
    END;

    -- Safe Role Casting (Default to parent)
    BEGIN
        v_role := (new.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'parent';
    END;

    INSERT INTO public.user_profiles (id, email, name, role, center_id, phone, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
        COALESCE(v_role, 'parent'),
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        last_sign_in_at = NOW();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. 🔌 TRIGGER 2: PROFILE -> PARENT
CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    IF new.role = 'parent' THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (
            new.id,
            new.center_id,
            new.name,
            new.email,
            COALESCE(new.phone, '010-0000-0000')
        )
        ON CONFLICT (profile_id) DO UPDATE
        SET 
            center_id = EXCLUDED.center_id,
            name = EXCLUDED.name,
            updated_at = NOW();
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_sync ON public.user_profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();


-- 5. 🛡️ PERMISSIONS: Explicit Drops
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;
DROP POLICY IF EXISTS "View Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Insert Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "View Own Profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update Own Profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert Own Profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;
