-- 🚨 FIX: 500 Internal Server Error (RLS Recursion)
-- We must use SECURITY DEFINER functions to break the infinite loop when policies query the table they protect.

-- 1. Helper: Safe Email Getter
CREATE OR REPLACE FUNCTION public.get_auth_email() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.email', true), '')::text;
$$ LANGUAGE sql STABLE;

-- 2. Helper: Safe Center ID Getter (Bypasses RLS)
-- This is critical to prevent recursion when querying user_profiles
CREATE OR REPLACE FUNCTION public.get_my_center_id() 
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT center_id FROM public.user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 👈 Vital: Runs as owner, ignoring RLS

-- 3. Helper: Super Admin Check (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'super_admin'
    OR
    public.get_auth_email() = 'anukbin@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 🧹 CLEANUP OLD POLICIES (To prevent conflicts)
DROP POLICY IF EXISTS "Super Admin All Access" ON consultations;
DROP POLICY IF EXISTS "Center Isolation" ON consultations;
DROP POLICY IF EXISTS "Super Admin All Access Schedules" ON schedules;
DROP POLICY IF EXISTS "Center Isolation Schedules" ON schedules;
DROP POLICY IF EXISTS "Super Admin View All Profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users View Same Center Profiles" ON user_profiles;
DROP POLICY IF EXISTS "Read Own Profile" ON user_profiles;

-- 🛡️ POLICIES FOR user_profiles
CREATE POLICY "Read Own Profile" ON user_profiles
    FOR SELECT USING ( id = auth.uid() );

CREATE POLICY "Super Admin Manage Profiles" ON user_profiles
    FOR ALL USING ( public.is_super_admin() );

CREATE POLICY "View Same Center Profiles" ON user_profiles
    FOR SELECT USING (
        center_id = public.get_my_center_id()
    );

-- 🛡️ POLICIES FOR consultations
CREATE POLICY "Super Admin All Access Consultations" ON consultations
    FOR ALL USING ( public.is_super_admin() );

CREATE POLICY "Center Isolation Consultations" ON consultations
    FOR ALL USING (
        center_id = public.get_my_center_id()
    );

-- 🛡️ POLICIES FOR schedules
CREATE POLICY "Super Admin All Access Schedules" ON schedules
    FOR ALL USING ( public.is_super_admin() );

CREATE POLICY "Center Isolation Schedules" ON schedules
    FOR ALL USING (
        center_id = public.get_my_center_id()
    );

-- 🛡️ POLICIES FOR children (Prevents 500 on Dashboard)
CREATE POLICY "Super Admin All Access Children" ON children
    FOR ALL USING ( public.is_super_admin() );

CREATE POLICY "Center Isolation Children" ON children
    FOR ALL USING (
        center_id = public.get_my_center_id()
    );

-- 🛡️ POLICIES FOR payments
CREATE POLICY "Super Admin All Access Payments" ON payments
    FOR ALL USING ( public.is_super_admin() );

CREATE POLICY "Center Isolation Payments" ON payments
    FOR ALL USING (
        child_id IN (SELECT id FROM public.children WHERE center_id = public.get_my_center_id())
    );

-- 🩹 Function to Reset Data (Admin Tool)
CREATE OR REPLACE FUNCTION admin_reset_user_data(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  DELETE FROM public.schedules WHERE child_id IN (SELECT id FROM public.children WHERE guardian_id = target_user_id);
  DELETE FROM public.children WHERE guardian_id = target_user_id;
  DELETE FROM public.consultations WHERE guardian_name IN (SELECT name FROM public.user_profiles WHERE id = target_user_id);
  
  UPDATE public.user_profiles 
  SET status = 'active', role = 'parent' 
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
