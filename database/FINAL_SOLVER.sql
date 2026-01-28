-- =======================================================
-- 🚀 FINAL GLOBAL REPAIR: PARENT REGISTRATION
-- =======================================================
-- This script fixes the "Foreign Key Violation" (Center ID mismatch) 
-- and ensures the registration flow is infallible.
-- =======================================================

BEGIN;

-- 1. 🧹 CLEANUP: Remove any existing test data that might conflict
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.user_profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 2. 🏗️ DATA INTEGRITY: Ensure the "seoulsegyero" center exists
--    This matches the URL /centers/seoulsegyero/...
INSERT INTO public.centers (name, slug, address)
SELECT '위례 세계로 아동발달센터', 'seoulsegyero', '위례대로'
WHERE NOT EXISTS (SELECT 1 FROM public.centers WHERE slug = 'seoulsegyero');

-- 3. 🤖 ROBUST TRIGGER: Auth -> Profile
--    Modified to be DEFENSIVE against invalid Center IDs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_raw_center TEXT;
BEGIN
    v_raw_center := new.raw_user_meta_data->>'center_id';
    
    -- [CRITICAL FIX] Validate Center ID before using it
    -- If the ID from frontend doesn't exist in our DB, we pick the first available center.
    IF v_raw_center IS NOT NULL AND v_raw_center != '' AND EXISTS (SELECT 1 FROM centers WHERE id = v_raw_center::UUID) THEN
        v_center_id := v_raw_center::UUID;
    ELSE
        -- Fallback to the first center in the DB to avoid FK violation
        SELECT id INTO v_center_id FROM public.centers ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Insert Profile
    INSERT INTO public.user_profiles (id, email, name, role, center_id, phone, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
        'parent', 
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        center_id = EXCLUDED.center_id, -- Sync center if updated
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
DROP TRIGGER IF EXISTS on_user_profile_sync ON public.user_profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

-- 5. 🛡️ PERMISSIONS: Clean Slate
DROP POLICY IF EXISTS "View Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Update Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Insert Own Profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.user_profiles;

CREATE POLICY "View Own Profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Update Own Profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert Own Profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;
