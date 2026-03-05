-- ============================================================
-- Zarada ERP: RLS 정책 긴급 수정 (ID 불일치 + JWT metadata 문제)
-- 날짜: 2026-03-05
-- 문제: therapist_id = auth.uid() 비교 오류 + jwt metadata 미사용
-- 해결: user_profiles 서브쿼리 기반으로 전면 교체
-- ============================================================

-- ============================================================
-- PART 1: 기존 잘못된 정책 전부 삭제
-- ============================================================

-- schedules 관련 정책 전부 삭제
DROP POLICY IF EXISTS "schedules_therapist_all" ON schedules;
DROP POLICY IF EXISTS "schedules_therapist_own" ON schedules;
DROP POLICY IF EXISTS "schedules_therapist_update" ON schedules;
DROP POLICY IF EXISTS "schedules_admin_all" ON schedules;
DROP POLICY IF EXISTS "schedules_admin_crud" ON schedules;
DROP POLICY IF EXISTS "schedules_parent_select" ON schedules;
DROP POLICY IF EXISTS "schedules_parent_child" ON schedules;
DROP POLICY IF EXISTS "schedules_super_admin" ON schedules;
DROP POLICY IF EXISTS "super_admin_bypass" ON schedules;
DROP POLICY IF EXISTS "super_admin_all_schedules" ON schedules;
DROP POLICY IF EXISTS "admin_center_schedules" ON schedules;
DROP POLICY IF EXISTS "staff_assigned_schedules" ON schedules;
DROP POLICY IF EXISTS "parent_own_schedules" ON schedules;
DROP POLICY IF EXISTS "Parents can view their children's schedules" ON schedules;

-- counseling_logs 관련 정책 전부 삭제
DROP POLICY IF EXISTS "logs_therapist_all" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_read" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_insert" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_read" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_insert" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_update" ON counseling_logs;
DROP POLICY IF EXISTS "logs_admin_all" ON counseling_logs;
DROP POLICY IF EXISTS "logs_admin_center" ON counseling_logs;
DROP POLICY IF EXISTS "logs_parent_select" ON counseling_logs;
DROP POLICY IF EXISTS "logs_parent_child" ON counseling_logs;
DROP POLICY IF EXISTS "logs_super_admin" ON counseling_logs;

-- payment_items 정책 삭제 (있으면)
DROP POLICY IF EXISTS "payment_items_admin_all" ON payment_items;
DROP POLICY IF EXISTS "payment_items_therapist_read" ON payment_items;

-- ============================================================
-- PART 2: RLS 활성화 확인
-- ============================================================

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 3: SCHEDULES 새 정책 (올바른 ID 매칭)
-- ============================================================

-- 슈퍼 어드민: 전체 접근
CREATE POLICY "schedules_super_admin" ON schedules
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민/매니저: 같은 센터의 모든 일정 접근
CREATE POLICY "schedules_admin_all" ON schedules
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = schedules.center_id
    )
);

-- 치료사: 본인 담당 일정 전체 접근
-- ✨ [핵심 수정] therapists.profile_id = auth.uid() 를 통해 연결
CREATE POLICY "schedules_therapist_all" ON schedules
FOR ALL TO authenticated
USING (
    therapist_id IN (
        SELECT id FROM therapists WHERE profile_id = auth.uid()
    )
);

-- 부모: 자녀 일정 조회만
CREATE POLICY "schedules_parent_select" ON schedules
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
    )
);

-- ============================================================
-- PART 4: COUNSELING_LOGS 새 정책
-- ============================================================

-- 슈퍼 어드민
CREATE POLICY "logs_super_admin" ON counseling_logs
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민/매니저: 같은 센터 일지 전체 접근
CREATE POLICY "logs_admin_all" ON counseling_logs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = counseling_logs.center_id
    )
);

-- 치료사: 본인 작성 일지 전체 접근
-- ✨ [핵심 수정] 같은 ID 매칭 방식 적용
CREATE POLICY "logs_therapist_all" ON counseling_logs
FOR ALL TO authenticated
USING (
    therapist_id IN (
        SELECT id FROM therapists WHERE profile_id = auth.uid()
    )
);

-- 부모: 자녀 일지 조회만
CREATE POLICY "logs_parent_select" ON counseling_logs
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
    )
);

-- ============================================================
-- PART 5: PAYMENT_ITEMS 정책 (수납 기능 필수)
-- ============================================================

-- 어드민/매니저: 전체 접근
CREATE POLICY "payment_items_admin_all" ON payment_items
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff', 'super_admin')
    )
);

-- 슈퍼 어드민
CREATE POLICY "payment_items_super_admin" ON payment_items
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- ============================================================
-- PART 6: 검증용 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_therapists_profile_id ON therapists(profile_id);
CREATE INDEX IF NOT EXISTS idx_family_rel_parent_id ON family_relationships(parent_id);

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ RLS 정책 수정 완료 - therapist_id 매칭 + user_profiles 기반 role 확인' AS status;
