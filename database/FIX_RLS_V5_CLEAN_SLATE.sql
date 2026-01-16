-- 🛡️ FIX RLS INFINITE RECURSION (V5 - ABSOLUTE CLEANUP)
-- Description: Dynamically finds and drops ALL policies on user_profiles to ensure no hidden recursive policies remain.

-- 1. 🧹 Dynamic Drop of ALL Policies on user_profiles
DO $$ 
DECLARE 
  r RECORD; 
BEGIN 
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP 
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles'; 
    RAISE NOTICE 'Dropped Policy: %', r.policyname;
  END LOOP; 
END $$;

-- 2. 🧨 Drop Function CASCADE (Removes any remaining dependencies)
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 3. 🏗️ Re-create Helper Function (SECURITY DEFINER)
-- Critical: This function must be created by an admin/owner to bypass RLS.
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

-- 4. ✅ Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. 🛡️ Define New Non-Recursive Policies

-- A. View Own Profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- B. Staff View All (Uses SECURITY DEFINER function)
CREATE POLICY "Staff can view all profiles"
ON public.user_profiles FOR SELECT
USING (
  public.get_my_role() IN ('admin', 'super_admin', 'therapist', 'staff')
);

-- C. Admin Update All
CREATE POLICY "Admin can update all profiles"
ON public.user_profiles FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'super_admin')
);

-- D. Users Update Self
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- E. Registration (Insert Self)
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. 🔓 Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated, service_role;

-- 7. 📊 Verification
SELECT count(*) as policies_count FROM pg_policies WHERE tablename = 'user_profiles';
SELECT 'RLS Fully Reset & Fixed' as status;
