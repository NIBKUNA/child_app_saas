-- =======================================================
-- 🛡️ FLIGHT RECORDER & ROBUST TRIGGER FIX
-- Addresses: "Database error saving new user" (500 Error)
-- Cause: Invalid UUID casting (e.g. empty string) in trigger
-- =======================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role user_role;
    v_name VARCHAR;
    v_center_input TEXT;
    v_role_input TEXT;
BEGIN
    -- 1. Parse Center ID (Robustly)
    BEGIN
        v_center_input := new.raw_user_meta_data->>'center_id';
        
        -- Handle Empty String or Null
        IF v_center_input IS NULL OR trim(v_center_input) = '' THEN
             v_center_id := NULL;
        ELSE
             v_center_id := v_center_input::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback for garbage UUIDs
        v_center_id := NULL;
    END;

    -- 2. Parse Role (Robustly)
    BEGIN
        v_role_input := new.raw_user_meta_data->>'role';
        
        IF v_role_input IS NULL OR trim(v_role_input) = '' THEN
            v_role := 'parent'::user_role;
        ELSE
            v_role := v_role_input::user_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'parent'::user_role;
    END;

    v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

    -- 3. Insert Profile (Transaction Atomic)
    INSERT INTO public.user_profiles (id, email, name, role, center_id, status)
    VALUES (
        new.id,
        new.email,
        v_name,
        v_role,
        v_center_id,
        'active'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-Apply Trigger to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
