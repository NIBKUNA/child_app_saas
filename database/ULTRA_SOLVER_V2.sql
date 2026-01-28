-- =======================================================
-- 🏆 ULTRA DEFENSIVE GLOBAL REPAIR (V2)
-- =======================================================
-- This script fixes the Center ID mismatch and Trigger issues.
-- It is designed to be "unbreakable" by validating every ID.
-- =======================================================

BEGIN;

-- 1. 🧹 CLEANUP: Clear EVERYTHING related to this test email
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 2. 🏗️ DATA: Create the Center explicitly with the correct slug
--    If it already exists with a different slug, we update it.
INSERT INTO public.centers (id, name, slug, address)
VALUES ('02117996-fa99-4859-a640-40fb32968b2e', '위례 세계로 아동발달센터', 'seoulsegyero', '위례대로')
ON CONFLICT (id) DO UPDATE SET slug = 'seoulsegyero';

-- Ensure slug is unique and exists
UPDATE public.centers SET slug = 'seoulsegyero' WHERE name = '위례 세계로 아동발달센터';

-- 3. 🤖 BULLETPROOF TRIGGER: Auth -> Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_raw_meta TEXT;
BEGIN
    -- [1] Try to extract center_id from metadata
    v_raw_meta := new.raw_user_meta_data->>'center_id';
    
    -- [2] VALIDATE Center ID
    -- Check if it is a valid UUID and exists in our centers table
    IF v_raw_meta IS NOT NULL AND v_raw_meta != '' THEN
        BEGIN
            SELECT id INTO v_center_id FROM public.centers WHERE id = v_raw_meta::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_center_id := NULL;
        END;
    END IF;

    -- [3] FALLBACK: If still NULL, pick the ONLY center we have (or the first one)
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- [4] INSERT into 'profiles' table (the actual table, not the view)
    INSERT INTO public.profiles (id, email, name, role, center_id, phone, is_active)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
        'parent', -- Everyone signing up via this portal is a parent
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        center_id = EXCLUDED.center_id,
        updated_at = NOW();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply Trigger 1
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. 🔌 TRIGGER 2: Profile -> Parent (Sync)
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

-- Re-apply Trigger 2
DROP TRIGGER IF EXISTS on_user_profile_sync ON public.profiles; -- Target the TABLE 'profiles'
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

-- 5. 🛡️ PERMISSIONS: Ensure RLS is fixed on the correct table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "View Own Profile" ON public.profiles;
CREATE POLICY "View Own Profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Update Own Profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Insert Own Profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

COMMIT;
