-- ============================================================
-- 👑 RESTORE SUPER ADMIN PERMISSIONS
-- ============================================================

-- 1. Ensure 'anukbin@gmail.com' has the correct role
UPDATE public.profiles
SET role = 'admin' -- Using 'admin' as the base role, but 'is_super_admin()' handles the privilege
WHERE email = 'anukbin@gmail.com';

-- 2. Verify and Re-assert is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Strict Email Check
  RETURN (auth.jwt() ->> 'email') = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Double Check RLS Bypass for Profiles (Most critical)
DROP POLICY IF EXISTS "View own center profiles" ON public.profiles;
CREATE POLICY "View own center profiles" ON public.profiles
FOR SELECT USING (
  public.is_super_admin() -- 🔓 Bypass
  OR
  center_id = public.get_my_center_id() 
);

-- 4. Log the restoration
DO $$
BEGIN
  RAISE NOTICE '✅ Super Admin Permissions Restored for anukbin@gmail.com';
END $$;
