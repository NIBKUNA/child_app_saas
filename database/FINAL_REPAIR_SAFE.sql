-- =======================================================
-- 🏆 FINAL REPAIR: PARENT REGISTRATION (SAFE VERSION)
-- =======================================================

BEGIN;

-- 1. 🧹 CLEANUP: Clear test data
DELETE FROM public.parents WHERE email = 'zombi00000@naver.com';
DELETE FROM public.profiles WHERE email = 'zombi00000@naver.com';
DELETE FROM auth.users WHERE email = 'zombi00000@naver.com';

-- 2. 🏗️ ENSURE CENTER: Update the existing center with slug
--    Using a more robust update logic to avoid "Already Exists" error
UPDATE public.centers 
SET slug = 'seoulsegyero' 
WHERE name = '위례 세계로 아동발달센터' OR slug = 'seoulsegyero';

-- 3. 🤖 ROBUST TRIGGER: Auth -> Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_raw_meta TEXT;
BEGIN
    v_raw_meta := new.raw_user_meta_data->>'center_id';
    
    -- VALIDATE Center ID
    IF v_raw_meta IS NOT NULL AND v_raw_meta != '' THEN
        BEGIN
            SELECT id INTO v_center_id FROM public.centers WHERE id = v_raw_meta::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_center_id := NULL;
        END;
    END IF;

    -- FALLBACK: Pick based on slug 'seoulsegyero' if metadata is wrong
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers WHERE slug = 'seoulsegyero' LIMIT 1;
    END IF;
    
    -- FINAL FALLBACK: Any center
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers LIMIT 1;
    END IF;

    INSERT INTO public.profiles (id, email, name, role, center_id, phone, is_active)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', '회원'),
        'parent', 
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        center_id = COALESCE(EXCLUDED.center_id, public.profiles.center_id),
        updated_at = NOW();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_sync ON public.profiles;
CREATE TRIGGER on_user_profile_sync
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_specific_table();

COMMIT;
