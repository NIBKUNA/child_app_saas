-- ============================================================
-- Zarada ERP: 3+1 RLS 보안 정책 및 DB 정화 SQL
-- 생성일: 2026-01-10
-- ============================================================

-- ============================================================
-- PART 1: 고아 데이터 조사 (실행 전 백업 권장)
-- ============================================================

-- 1.1 연결 끊긴 schedules 조회 (child_id가 children에 없는 경우)
SELECT 'orphan_schedules' AS type, COUNT(*) AS count
FROM schedules 
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- 1.2 연결 끊긴 payments 조회
SELECT 'orphan_payments' AS type, COUNT(*) AS count
FROM payments 
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- 1.3 연결 끊긴 consultations 조회
SELECT 'orphan_consultations' AS type, COUNT(*) AS count
FROM consultations 
WHERE child_id IS NOT NULL 
AND child_id NOT IN (SELECT id FROM children);

-- ============================================================
-- PART 2: 고아 데이터 삭제 (주의: 백업 후 실행)
-- ============================================================

-- DELETE FROM schedules WHERE child_id NOT IN (SELECT id FROM children);
-- DELETE FROM payments WHERE child_id NOT IN (SELECT id FROM children);
-- DELETE FROM consultations WHERE child_id NOT IN (SELECT id FROM children);

-- ============================================================
-- PART 3: RLS 활성화
-- ============================================================

-- children 테이블 RLS 활성화
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- schedules 테이블 RLS 활성화
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- payments 테이블 RLS 활성화
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- consultations 테이블 RLS 활성화
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: 기존 정책 삭제 (충돌 방지)
-- ============================================================

DROP POLICY IF EXISTS "super_admin_all_children" ON public.children;
DROP POLICY IF EXISTS "admin_center_children" ON public.children;
DROP POLICY IF EXISTS "staff_assigned_children" ON public.children;
DROP POLICY IF EXISTS "parent_own_children" ON public.children;

DROP POLICY IF EXISTS "super_admin_all_schedules" ON public.schedules;
DROP POLICY IF EXISTS "admin_center_schedules" ON public.schedules;
DROP POLICY IF EXISTS "staff_assigned_schedules" ON public.schedules;
DROP POLICY IF EXISTS "parent_own_schedules" ON public.schedules;

DROP POLICY IF EXISTS "super_admin_all_payments" ON public.payments;
DROP POLICY IF EXISTS "admin_center_payments" ON public.payments;
DROP POLICY IF EXISTS "staff_no_payments" ON public.payments;
DROP POLICY IF EXISTS "parent_own_payments" ON public.payments;

-- ============================================================
-- PART 5: CHILDREN 테이블 RLS 정책
-- ============================================================

-- 5.1 Super Admin: 모든 데이터 접근
CREATE POLICY "super_admin_all_children" ON public.children
FOR ALL USING (
    auth.email() = 'anukbin@gmail.com'
);

-- 5.2 Admin: 본인 센터 데이터만
CREATE POLICY "admin_center_children" ON public.children
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND center_id = children.center_id
    )
);

-- 5.3 Staff (치료사): 담당 아동만 조회
CREATE POLICY "staff_assigned_children" ON public.children
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM child_therapist 
        WHERE therapist_id = auth.uid() 
        AND child_id = children.id
    )
);

-- 5.4 Parent (부모): 본인 자녀만
CREATE POLICY "parent_own_children" ON public.children
FOR SELECT USING (parent_id = auth.uid());

-- ============================================================
-- PART 6: SCHEDULES 테이블 RLS 정책
-- ============================================================

-- 6.1 Super Admin
CREATE POLICY "super_admin_all_schedules" ON public.schedules
FOR ALL USING (auth.email() = 'anukbin@gmail.com');

-- 6.2 Admin: 센터 기반
CREATE POLICY "admin_center_schedules" ON public.schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND center_id = schedules.center_id
    )
);

-- 6.3 Staff: 담당 아동의 일정만
CREATE POLICY "staff_assigned_schedules" ON public.schedules
FOR SELECT USING (
    therapist_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM child_therapist 
        WHERE therapist_id = auth.uid() 
        AND child_id = schedules.child_id
    )
);

-- 6.4 Parent: 본인 자녀 일정만
CREATE POLICY "parent_own_schedules" ON public.schedules
FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- ============================================================
-- PART 7: PAYMENTS 테이블 RLS 정책 (치료사 완전 차단)
-- ============================================================

-- 7.1 Super Admin
CREATE POLICY "super_admin_all_payments" ON public.payments
FOR ALL USING (auth.email() = 'anukbin@gmail.com');

-- 7.2 Admin: 센터 기반 (children JOIN 필요)
CREATE POLICY "admin_center_payments" ON public.payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM children c
        JOIN user_profiles up ON up.id = auth.uid()
        WHERE c.id = payments.child_id 
        AND up.role = 'admin' 
        AND up.center_id = c.center_id
    )
);

-- 7.3 Staff: 완전 차단 (USING false)
CREATE POLICY "staff_no_payments" ON public.payments
FOR SELECT USING (false);

-- 7.4 Parent: 본인 자녀 수납 현황만
CREATE POLICY "parent_own_payments" ON public.payments
FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- ============================================================
-- PART 8: 성능 최적화 - 인덱스 생성
-- ============================================================

-- center_id 인덱스 (Admin 정책 성능 향상)
CREATE INDEX IF NOT EXISTS idx_children_center_id ON public.children(center_id);
CREATE INDEX IF NOT EXISTS idx_schedules_center_id ON public.schedules(center_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_center_id ON public.user_profiles(center_id);

-- child_therapist 인덱스 (Staff 정책 성능 향상)
CREATE INDEX IF NOT EXISTS idx_child_therapist_therapist_id ON public.child_therapist(therapist_id);
CREATE INDEX IF NOT EXISTS idx_child_therapist_child_id ON public.child_therapist(child_id);

-- parent_id 인덱스 (Parent 정책 성능 향상)
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ RLS 정책 및 인덱스 생성 완료' AS status;
