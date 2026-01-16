-- 🛡️ FIX RLS INFINITE RECURSION (V3 - FINAL)
-- Description: Completely rebuilds RLS for user_profiles to eliminate recursion.
-- We use a SECURITY DEFINER function that MUST be owned by a SUPERUSER (postgres) to bypass RLS.

-- 1. Reset: Drop everything to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles;
DROP FUNCTION IF EXISTS public.get_my_role();

-- 2. Create Helper Function (SECURITY DEFINER)
-- ⚠️ IMPORTANT: This function runs with the privileges of the CREATOR (Database Owner).
-- It will bypass RLS on user_profiles, allowing it to read the role without triggering the policy loop.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- 🛡️ Security Best Practice
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- 3. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Define Policies (Non-Recursive)

-- A. View Own Profile (Direct ID Check - No Recursion)
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- B. Staff View All (Uses Function)
-- The function 'get_my_role()' runs as Superuser, so it doesn't trigger this policy again.
CREATE POLICY "Staff can view all profiles"
ON public.user_profiles FOR SELECT
USING (
  public.get_my_role() IN ('admin', 'super_admin', 'therapist', 'staff')
);

-- C. Admin Update All (Uses Function)
CREATE POLICY "Admin can update all profiles"
ON public.user_profiles FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'super_admin')
);

-- D. Users Update Self
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- E. Users Insert Self (Registration)
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated, service_role;

-- 6. Verification Output
SELECT 
    schemaname, tablename, policyname, roles, cmd 
FROM 
    pg_policies 
WHERE 
    tablename = 'user_profiles';
