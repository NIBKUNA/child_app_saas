-- 🛡️ FIX RLS INFINITE RECURSION (V2)
-- Description: Recursion occurs because 'Staff can view all profiles' queries 'user_profiles' to check the role, 
-- triggering the policy again. To fix this, we use a SECURITY DEFINER function to check the role without RLS interference.

-- 1. Create a Helper Function to Check Role (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- ⚠️ Critical: Runs with owner privileges, bypassing RLS
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- 2. Update Policies using the Helper Function
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.user_profiles;

-- Policy 1: View Own Profile (Simple, Direct)
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Staff can view all profiles (Uses Helper Function to avoid recursion)
CREATE POLICY "Staff can view all profiles"
ON public.user_profiles FOR SELECT
USING (
  (SELECT public.get_my_role()) IN ('admin', 'super_admin', 'therapist', 'staff')
);

-- Policy 3: Admin can update any profile (Uses Helper Function)
CREATE POLICY "Admin can update all profiles"
ON public.user_profiles FOR UPDATE
USING (
  (SELECT public.get_my_role()) IN ('admin', 'super_admin')
);

-- Policy 4: Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 5: Users can insert own profile
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant execute to function
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO service_role;

SELECT 'RLS Recursion Fixed via Security Definer Function' as status;
