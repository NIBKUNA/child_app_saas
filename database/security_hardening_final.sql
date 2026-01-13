-- ============================================================
-- 🛡️ Supabase Security Hardening & Zero-Warning Solution (v3)
-- Fixes Idempotency (Policy already exists error)
-- ============================================================

-- 0. Helper Function for Super Admin Check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.1 Helper Function to Get Center ID safely (AVOIDS RECURSION)
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT center_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Enable RLS on ALL Tables
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_therapist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_care_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_observations ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.development_assessments (id UUID PRIMARY KEY); 
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;


-- 2. Define Strict Isolation Policies (Using Helper Function)

-- [Profile]
DROP POLICY IF EXISTS "View own center profiles" ON public.profiles;
CREATE POLICY "View own center profiles" ON public.profiles
FOR SELECT USING (
  public.is_super_admin() 
  OR
  center_id = public.get_my_center_id() 
);

-- [Center]
DROP POLICY IF EXISTS "View own center" ON public.centers;
CREATE POLICY "View own center" ON public.centers
FOR SELECT USING (
  public.is_super_admin()
  OR
  id = public.get_my_center_id()
);

-- [Children]
DROP POLICY IF EXISTS "View center children" ON public.children;
CREATE POLICY "View center children" ON public.children
FOR SELECT USING (
  public.is_super_admin()
  OR
  center_id = public.get_my_center_id()
);

-- [Schedules]
DROP POLICY IF EXISTS "View center schedules" ON public.schedules;
CREATE POLICY "View center schedules" ON public.schedules
FOR SELECT USING (
  public.is_super_admin()
  OR
  center_id = public.get_my_center_id()
);

-- [Admin Settings]
DROP POLICY IF EXISTS "View admin settings" ON public.admin_settings;
CREATE POLICY "View admin settings" ON public.admin_settings
FOR SELECT USING (
  public.is_super_admin()
  OR
  center_id = public.get_my_center_id()
  OR center_id IS NULL 
);

-- [Generic - Leads]
DROP POLICY IF EXISTS "View center leads" ON public.leads;
CREATE POLICY "View center leads" ON public.leads
FOR SELECT USING (
   public.is_super_admin() OR center_id = public.get_my_center_id()
);

-- [Generic - Therapists]
DROP POLICY IF EXISTS "View center therapists" ON public.therapists;
CREATE POLICY "View center therapists" ON public.therapists
FOR SELECT USING (
   public.is_super_admin() OR center_id = public.get_my_center_id()
);


-- 3. Hardening Write Policies
DROP POLICY IF EXISTS "Manage center schedules" ON public.schedules; -- 🔥 Added DROP
CREATE POLICY "Manage center schedules" ON public.schedules
FOR ALL USING (
  public.is_super_admin() 
  OR 
  center_id = public.get_my_center_id()
);


-- 5. Final Confirmation Log
DO $$
BEGIN
  RAISE NOTICE '✅ Security Hardening V3 (Idempotent) Applied.';
END $$;
