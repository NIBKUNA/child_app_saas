-- ==========================================
-- Fix SaaS Registration Flow (Robust Version)
-- ==========================================

-- 1. Disable the trigger first to see if it allows signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Improved Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role VARCHAR;
    v_name VARCHAR;
BEGIN
    -- Extract metadata safely
    -- The key fix: Handle potential NULLs or invalid UUIDs gracefully
    BEGIN
        v_center_id := (new.raw_user_meta_data->>'center_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_center_id := NULL; -- If invalid UUID, set to NULL
    END;

    v_role := COALESCE(new.raw_user_meta_data->>'role', 'parent');
    v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

    -- Insert into profiles
    -- Uses SECURITY DEFINER to bypass RLS
    INSERT INTO public.profiles (id, email, name, role, center_id, status)
    VALUES (
        new.id,
        new.email,
        v_name,
        v_role,
        v_center_id,
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        center_id = EXCLUDED.center_id,
        updated_at = now();

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- 🔥 CRITICALLY IMPORTANT: catch errors so we don't block the auth transaction
    -- Log the error if possible, or just fail silently but allow the user creation (profile will be missing, but user created)
    -- In this case, we prefer to allow user creation so we can debug.
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-enable Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
