-- ============================================================
-- Zarada ERP: RLS 성능 최적화 (서브쿼리 → 캐싱 함수)
-- 날짜: 2026-03-06
-- 목적: RLS 정책의 서브쿼리가 row마다 반복 실행되는 문제 해결
--        SECURITY DEFINER + STABLE 함수로 세션당 1회만 실행
-- ============================================================

-- ============================================================
-- 1. 헬퍼 함수 (세션 단위 캐싱)
-- ============================================================

-- 현재 사용자의 center_id 반환
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS UUID AS $$
    SELECT center_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 role 반환
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role::text FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 therapist IDs (배열) 반환
CREATE OR REPLACE FUNCTION public.get_my_therapist_ids()
RETURNS UUID[] AS $$
    SELECT COALESCE(array_agg(id), '{}')
    FROM therapists WHERE profile_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 현재 사용자의 자녀 IDs 반환
CREATE OR REPLACE FUNCTION public.get_my_child_ids()
RETURNS UUID[] AS $$
    SELECT COALESCE(array_agg(child_id), '{}')
    FROM family_relationships WHERE parent_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 슈퍼어드민 체크
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT auth.email() IN ('anukbin@gmail.com', 'zaradajoo@gmail.com')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. SCHEDULES 정책 재생성 (함수 기반)
-- ============================================================

DROP POLICY IF EXISTS "schedules_super_admin" ON schedules;
DROP POLICY IF EXISTS "schedules_admin_all" ON schedules;
DROP POLICY IF EXISTS "schedules_therapist_all" ON schedules;
DROP POLICY IF EXISTS "schedules_parent_select" ON schedules;

CREATE POLICY "schedules_super_admin" ON schedules
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "schedules_admin_all" ON schedules
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
    AND center_id = public.get_my_center_id()
);

CREATE POLICY "schedules_therapist_all" ON schedules
FOR ALL TO authenticated
USING (
    therapist_id = ANY(public.get_my_therapist_ids())
);

CREATE POLICY "schedules_parent_select" ON schedules
FOR SELECT TO authenticated
USING (
    child_id = ANY(public.get_my_child_ids())
);

-- ============================================================
-- 3. COUNSELING_LOGS 정책 재생성
-- ============================================================

DROP POLICY IF EXISTS "logs_super_admin" ON counseling_logs;
DROP POLICY IF EXISTS "logs_admin_all" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_all" ON counseling_logs;
DROP POLICY IF EXISTS "logs_parent_select" ON counseling_logs;

CREATE POLICY "logs_super_admin" ON counseling_logs
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "logs_admin_all" ON counseling_logs
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
    AND center_id = public.get_my_center_id()
);

CREATE POLICY "logs_therapist_all" ON counseling_logs
FOR ALL TO authenticated
USING (
    therapist_id = ANY(public.get_my_therapist_ids())
);

CREATE POLICY "logs_parent_select" ON counseling_logs
FOR SELECT TO authenticated
USING (
    child_id = ANY(public.get_my_child_ids())
);

-- ============================================================
-- 4. CHILDREN 정책 재생성
-- ============================================================

DROP POLICY IF EXISTS "children_super_admin" ON children;
DROP POLICY IF EXISTS "children_admin_all" ON children;
DROP POLICY IF EXISTS "children_therapist_select" ON children;
DROP POLICY IF EXISTS "children_parent_select" ON children;

CREATE POLICY "children_super_admin" ON children
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "children_admin_all" ON children
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
    AND center_id = public.get_my_center_id()
);

CREATE POLICY "children_therapist_select" ON children
FOR SELECT TO authenticated
USING (
    public.get_my_role() = 'therapist'
    AND center_id = public.get_my_center_id()
);

CREATE POLICY "children_parent_select" ON children
FOR SELECT TO authenticated
USING (
    id = ANY(public.get_my_child_ids())
);

-- ============================================================
-- 5. PAYMENTS 정책 재생성
-- ============================================================

DROP POLICY IF EXISTS "payments_super_admin" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_parent_select" ON payments;

CREATE POLICY "payments_super_admin" ON payments
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "payments_admin_all" ON payments
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
    AND (center_id = public.get_my_center_id() OR center_id IS NULL)
);

CREATE POLICY "payments_parent_select" ON payments
FOR SELECT TO authenticated
USING (
    child_id = ANY(public.get_my_child_ids())
);

-- ============================================================
-- 6. PAYMENT_ITEMS 정책 재생성
-- ============================================================

DROP POLICY IF EXISTS "payment_items_admin_all" ON payment_items;
DROP POLICY IF EXISTS "payment_items_super_admin" ON payment_items;

CREATE POLICY "payment_items_super_admin" ON payment_items
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "payment_items_admin_all" ON payment_items
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
);

-- ============================================================
-- 7. DEVELOPMENT_ASSESSMENTS 정책 재생성
-- ============================================================

DROP POLICY IF EXISTS "assessments_super_admin" ON development_assessments;
DROP POLICY IF EXISTS "assessments_admin_all" ON development_assessments;
DROP POLICY IF EXISTS "assessments_therapist_all" ON development_assessments;
DROP POLICY IF EXISTS "assessments_parent_select" ON development_assessments;

CREATE POLICY "assessments_super_admin" ON development_assessments
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "assessments_admin_all" ON development_assessments
FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'manager', 'staff')
);

-- development_assessments.therapist_id는 user_profiles.id 참조이므로 직접 비교 OK
CREATE POLICY "assessments_therapist_all" ON development_assessments
FOR ALL TO authenticated
USING (
    therapist_id = auth.uid()
);

CREATE POLICY "assessments_parent_select" ON development_assessments
FOR SELECT TO authenticated
USING (
    child_id = ANY(public.get_my_child_ids())
);

-- ============================================================
-- 8. 인덱스 보강
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_therapists_profile_id ON therapists(profile_id);
CREATE INDEX IF NOT EXISTS idx_family_rel_parent_id ON family_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_schedules_center_start ON schedules(center_id, start_time);
CREATE INDEX IF NOT EXISTS idx_counseling_logs_schedule_id ON counseling_logs(schedule_id);

-- ============================================================
SELECT '✅ RLS 성능 최적화 완료 - STABLE 함수 캐싱 적용' AS status;
