-- ============================================================
-- 🚀 MASTER SYSTEM FIX: Security, Permissions, & Cache
-- ============================================================

-- 1. Reload Supabase Schema Cache (Fixes PGRST200)
NOTIFY pgrst, 'reload schema';

-- 2. Define Super Admin Identification Function (Immutable & Cached)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Hardcoded Email Check for Maximum Security & Reliability
  RETURN (auth.jwt() ->> 'email') = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.1 Helper to get center_id safely
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT center_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Force Supervisor Role to 'admin' (Base Role)
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'anukbin@gmail.com';


-- 4. Apply RLS Policies with EXPLICIT Bypass (Nuclear Option)

-- [Profiles]
DROP POLICY IF EXISTS "View profiles" ON public.profiles;
DROP POLICY IF EXISTS "View own center profiles" ON public.profiles;
CREATE POLICY "View profiles master" ON public.profiles
FOR SELECT USING (
  public.is_super_admin() -- 🔓 SUPER ADMIN BYPASS
  OR
  center_id = public.get_my_center_id()
  OR
  id = auth.uid()
);

-- [Children] - Critical for "Loading Failed" error
DROP POLICY IF EXISTS "View children" ON public.children;
DROP POLICY IF EXISTS "View center children" ON public.children;
CREATE POLICY "View children master" ON public.children
FOR SELECT USING (
  public.is_super_admin() -- 🔓 SUPER ADMIN BYPASS
  OR
  center_id = public.get_my_center_id()
);

-- [Schedules]
DROP POLICY IF EXISTS "View schedules" ON public.schedules;
DROP POLICY IF EXISTS "View center schedules" ON public.schedules;
CREATE POLICY "View schedules master" ON public.schedules
FOR SELECT USING (
  public.is_super_admin() -- 🔓 SUPER ADMIN BYPASS
  OR
  center_id = public.get_my_center_id()
);

-- [Centers]
DROP POLICY IF EXISTS "View centers" ON public.centers;
DROP POLICY IF EXISTS "View own center" ON public.centers;
CREATE POLICY "View centers master" ON public.centers
FOR SELECT USING (
  public.is_super_admin() -- 🔓 SUPER ADMIN BYPASS
  OR
  id = public.get_my_center_id()
);

-- 5. Final Schema Reload Notification
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '✅ MASTER SYSTEM FIX APPLIED. Schema Reloaded. Super Admin Bypass Active.';
END $$;
