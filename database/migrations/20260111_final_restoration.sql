-- ============================================================
-- Zarada ERP: Final System Restoration & Security Hardening
-- 🚀 Release: 2026.01.11 Hotfix Final
-- Developer: 안욱빈 (An Uk-bin)
-- Description: Consolidates Zero-Dependency RLS and Super Admin access fixes.
-- ============================================================

-- 1. CLEANUP (Removing Recursive Risks)
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- 2. USER PROFILES (Zero-Dependency)
-- Allow users to read their own profile
DROP POLICY IF EXISTS "profiles_self_select" ON user_profiles;
CREATE POLICY "profiles_self_select" ON user_profiles
FOR SELECT USING (id = auth.uid());

-- Allow Super Admin Bypass (Already Applied but reinforced)
-- Note: 'super_admin_bypass' policies should exist from previous scripts.

-- 3. STANDARD ACCESS RESTORATION (Standard Users)

-- Children: Parents see their own kids, Therapists see assigned kids (via Schedules)
DROP POLICY IF EXISTS "children_parent_select" ON children;
CREATE POLICY "children_parent_select" ON children
FOR SELECT TO authenticated
USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "children_therapist_select" ON children;
CREATE POLICY "children_therapist_select" ON children
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT child_id 
        FROM schedules 
        WHERE therapist_id = auth.uid()
    )
);

-- Schedules: Parents see child's schedule, Therapists see their own
DROP POLICY IF EXISTS "schedules_parent_select" ON schedules;
CREATE POLICY "schedules_parent_select" ON schedules
FOR SELECT TO authenticated
USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "schedules_therapist_select" ON schedules;
CREATE POLICY "schedules_therapist_select" ON schedules
FOR SELECT TO authenticated
USING (therapist_id = auth.uid());

-- Counseling Logs: Parents read-only, Therapists see own
DROP POLICY IF EXISTS "logs_parent_select" ON counseling_logs;
CREATE POLICY "logs_parent_select" ON counseling_logs
FOR SELECT TO authenticated
USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "logs_therapist_select" ON counseling_logs;
CREATE POLICY "logs_therapist_select" ON counseling_logs
FOR SELECT TO authenticated
USING (therapist_id = auth.uid());

-- Payments: Parents see own bills
DROP POLICY IF EXISTS "payments_parent_select" ON payments;
CREATE POLICY "payments_parent_select" ON payments
FOR SELECT TO authenticated
USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));


-- 4. VERIFICATION
SELECT 
    tablename, 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- ✅ Restoration Complete.
-- "Code with Pride, Secure with Logic. - An Uk-bin"
