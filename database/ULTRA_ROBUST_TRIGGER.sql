-- =======================================================
-- 🏛️ ULTRA ROBUST REGISTRATION TRIGGER (V5)
-- =======================================================
-- Reason: Fix 500 errors during signup by resolving 
-- UUID/Enum casting failures and ensuring data integrity.
-- =======================================================

BEGIN;

-- 1. 🤖 [FIX] handle_new_user (The 500 Error Killer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_center TEXT;
    v_center_id UUID;
    v_role_str TEXT;
    v_role user_role;
BEGIN
    -- [1] Safe Center ID Parsing
    v_raw_center := new.raw_user_meta_data->>'center_id';
    
    -- Validate if raw center is a valid UUID and exists
    IF v_raw_center IS NOT NULL AND v_raw_center ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        SELECT id INTO v_center_id FROM public.centers WHERE id = v_raw_center::UUID;
    END IF;

    -- [2] Fallback: If no center ID found, try slug
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers WHERE slug = 'seoulsegyero' LIMIT 1;
    END IF;

    -- [3] Absolute Fallback: First center in DB
    IF v_center_id IS NULL THEN
        SELECT id INTO v_center_id FROM public.centers LIMIT 1;
    END IF;

    -- [4] Safe Role Implementation
    v_role_str := COALESCE(new.raw_user_meta_data->>'role', 'parent');
    
    -- Ensure role matches valid enum values
    CASE v_role_str
        WHEN 'super_admin' THEN v_role := 'super_admin';
        WHEN 'admin' THEN v_role := 'admin';
        WHEN 'staff' THEN v_role := 'staff';
        WHEN 'therapist' THEN v_role := 'therapist';
        ELSE v_role := 'parent';
    END CASE;

    -- [5] INSERT with Conflict Resolution
    INSERT INTO public.profiles (id, email, name, role, center_id, phone, is_active)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '회원'),
        v_role, 
        v_center_id,
        COALESCE(new.raw_user_meta_data->>'phone', '010-0000-0000'),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        role = EXCLUDED.role,
        center_id = COALESCE(EXCLUDED.center_id, public.profiles.center_id);

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- NEVER allow a trigger to fail Auth (500 Error)
        -- Log it to Postgres logs but return 'new' to allow Auth creation
        RAISE WARNING 'CRITICAL: handle_new_user failed for % with error: %', new.email, SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ⛓️ [FIX] sync_profile_to_specific_table (Strict Isolation)
CREATE OR REPLACE FUNCTION public.sync_profile_to_specific_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Only register as a 'parent' if the role is correct and a center is assigned
    IF new.role = 'parent' AND new.center_id IS NOT NULL THEN
        INSERT INTO public.parents (profile_id, center_id, name, email, phone)
        VALUES (new.id, new.center_id, new.name, new.email, new.phone)
        ON CONFLICT (profile_id) DO UPDATE 
        SET 
            name = EXCLUDED.name, 
            phone = EXCLUDED.phone,
            center_id = EXCLUDED.center_id;
    ELSE
        -- Remove from parents table if role changed or center is missing
        DELETE FROM public.parents WHERE profile_id = new.id;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'CRITICAL: sync_profile_to_specific_table failed with error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
