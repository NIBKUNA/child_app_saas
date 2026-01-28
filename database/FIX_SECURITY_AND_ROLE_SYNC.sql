-- ============================================
-- Zarada Security Repair Kit (Infinite Loop Fix)
-- Description: Fixes 500 Internal Server Error caused by RLS infinite recursion
-- ============================================

-- 1. [Helper Function] Recursion-proof session getter
-- SECURITY DEFINER makes it run with creator's privileges, bypassing RLS to break the loop
CREATE OR REPLACE FUNCTION public.get_my_profile_info()
RETURNS TABLE (center_id UUID, role public.user_role) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.center_id, u.role
    FROM public.user_profiles u
    WHERE u.id = auth.uid();
END;
$$;

-- 2. [Policy] Safe isolation without direct self-reference
DROP POLICY IF EXISTS "p_user_profiles_center_isolation" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their center data" ON public.user_profiles;

CREATE POLICY "p_user_profiles_center_isolation" ON public.user_profiles
FOR SELECT TO authenticated
USING (
    -- Case A: It's my own profile
    id = auth.uid() 
    OR 
    -- Case B: Using helper function to check center/role without recursion
    EXISTS (
        SELECT 1 
        FROM public.get_my_profile_info() AS my
        WHERE 
            (my.role::text IN ('super_admin', 'admin')) -- I am an admin
            OR 
            (user_profiles.center_id = my.center_id) -- We are in the same center
    )
);

-- 3. [Sync] Robust Trigger for Role Consistency
CREATE OR REPLACE FUNCTION sync_role_logic()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'user_profiles' THEN
        UPDATE public.therapists SET system_role = NEW.role::text WHERE profile_id = NEW.id;
    ELSIF TG_TABLE_NAME = 'therapists' THEN
        UPDATE public.user_profiles SET role = NEW.system_role::user_role WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_role ON user_profiles;
CREATE TRIGGER tr_sync_profile_role AFTER UPDATE OF role ON user_profiles FOR EACH ROW EXECUTE FUNCTION sync_role_logic();

DROP TRIGGER IF EXISTS tr_sync_therapist_role ON therapists;
CREATE TRIGGER tr_sync_therapist_role AFTER UPDATE OF system_role ON therapists FOR EACH ROW EXECUTE FUNCTION sync_role_logic();

-- 4. [Security] Ensure RLS is active
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
