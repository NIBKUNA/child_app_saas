-- 🛡️ FIX RLS INFINITE RECURSION (V4 - FACTORY RESET)
-- Description: Uses CASCADE to forcefully remove the function and ALL policies that depend on it.
-- This solves the "cannot drop function" error you encountered.

-- 1. 🧨 FORCE DROP Function and ALL Dependent Policies
-- This single command deletes the function AND any policy (even ones with different names) that uses it.
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 2. Drop any other lingering policies just in case
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles; -- Old name
DROP POLICY IF EXISTS "Staff can update all profiles" ON public.user_profiles; -- The rogue policy that caused the error

-- 3. Re-create Helper Function (SECURITY DEFINER)
-- Bypasses RLS by running as the Database Owner (Superuser)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 4. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Define Policies (Clean & Simple)

-- A. View Self
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- B. Staff View All (Uses Function)
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

-- D. Update Self
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- E. Insert Self
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated, service_role;

SELECT 'RLS Factory Reset Complete (CASCADE Used)' as status;
