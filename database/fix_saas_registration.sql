-- ==========================================
-- Fix SaaS Registration Flow
-- ==========================================

-- 1. Update the handle_new_user function to properly extract metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_center_id UUID;
    v_role VARCHAR;
    v_name VARCHAR;
BEGIN
    -- Extract metadata safely
    -- Note: attributes in raw_user_meta_data are JSON keys
    v_center_id := (new.raw_user_meta_data->>'center_id')::UUID;
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'parent'); -- Default to parent
    v_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User');

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, name, role, center_id, status)
    VALUES (
        new.id,
        new.email,
        v_name,
        v_role,
        v_center_id,
        'active' -- Auto-activate for testing/mvp
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        center_id = EXCLUDED.center_id,
        updated_at = now();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure profiles table allows RLS for new inserts (or is open)
-- Since the trigger runs as SECURITY DEFINER, it bypasses RLS.
-- But we double check the centers table RLS doesn't block "references" check if any?
-- (References check is system level, usually fine).
