-- 👑 Sovereign Security & RLS Policy V2
-- This script ensures:
-- 1. 'anukbin@gmail.com' has GOD MODE (bypass all RLS).
-- 2. Standard users are strictly isolated to their 'center_id'.
-- 3. 'marketing_source' in consultations is accessible to admins.

-- Enable RLS on all critical tables
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 1. 🛡️ SUPER ADMIN GOD POLICY (Email-based Override)
-- Changed to public schema to avoid permission errors
CREATE OR REPLACE FUNCTION public.get_auth_email() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.email', true), '')::text;
$$ LANGUAGE sql STABLE;

-- Macro for Super Admin Check
-- Checks if role is super_admin OR email is the Fortress Email
create or replace function is_super_admin()
returns boolean as $$
begin
  return (
    (select role from public.user_profiles where id = auth.uid()) = 'super_admin'
    OR
    public.get_auth_email() = 'anukbin@gmail.com'
  );
end;
$$ language plpgsql security definer;

-- 2. 🛡️ UNIVERSAL RLS POLICIES (Example for consultations)

DROP POLICY IF EXISTS "Super Admin All Access" ON consultations;
CREATE POLICY "Super Admin All Access" ON consultations
    FOR ALL
    USING ( is_super_admin() );

DROP POLICY IF EXISTS "Center Isolation" ON consultations;
CREATE POLICY "Center Isolation" ON consultations
    FOR ALL
    USING (
        center_id = (select center_id from public.user_profiles where id = auth.uid())
    );

-- Repeat for Schedules
DROP POLICY IF EXISTS "Super Admin All Access Schedules" ON schedules;
CREATE POLICY "Super Admin All Access Schedules" ON schedules
    FOR ALL
    USING ( is_super_admin() );

DROP POLICY IF EXISTS "Center Isolation Schedules" ON schedules;
CREATE POLICY "Center Isolation Schedules" ON schedules
    FOR ALL
    USING (
        center_id = (select center_id from public.user_profiles where id = auth.uid())
    );

-- Repeat for User Profiles (Critical for viewing other users)
DROP POLICY IF EXISTS "Super Admin View All Profiles" ON user_profiles;
CREATE POLICY "Super Admin View All Profiles" ON user_profiles
    FOR ALL
    USING ( is_super_admin() );

DROP POLICY IF EXISTS "Users View Same Center Profiles" ON user_profiles;
CREATE POLICY "Users View Same Center Profiles" ON user_profiles
    FOR SELECT
    USING (
        center_id = (select center_id from public.user_profiles where id = auth.uid())
        OR id = auth.uid()
    );

-- 3. 🚨 Data Reset Function (RPC)
-- Allows Super Admin to wipe a user's data for recovery
CREATE OR REPLACE FUNCTION admin_reset_user_data(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Strict Check
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  -- Delete Dependent Data (Adjust as needed)
  DELETE FROM public.schedules WHERE child_id IN (SELECT id FROM public.children WHERE guardian_id = target_user_id);
  DELETE FROM public.children WHERE guardian_id = target_user_id;
  DELETE FROM public.consultations WHERE guardian_name IN (SELECT name FROM public.user_profiles WHERE id = target_user_id);
  
  -- Reset Profile Status
  UPDATE public.user_profiles 
  SET status = 'active', role = 'parent' 
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
