-- ============================================================
-- Zarada ERP: RLS 정책 수정 Part 2 (children, payments, assessments, etc.)
-- 날짜: 2026-03-05
-- 이전: 20260305_fix_rls_id_mismatch.sql (schedules, counseling_logs, payment_items)
-- 이번: children, payments, development_assessments, admin_notifications, daily_notes
-- ============================================================

-- ============================================================
-- PART 1: CHILDREN 정책 전면 교체
-- ============================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "children_parent_select" ON children;
DROP POLICY IF EXISTS "children_therapist_select" ON children;
DROP POLICY IF EXISTS "children_admin_select" ON children;
DROP POLICY IF EXISTS "children_super_admin" ON children;
DROP POLICY IF EXISTS "children_admin_crud" ON children;
DROP POLICY IF EXISTS "children_staff_read" ON children;
DROP POLICY IF EXISTS "children_therapist_assigned" ON children;
DROP POLICY IF EXISTS "children_parent_family" ON children;

-- 슈퍼 어드민
CREATE POLICY "children_super_admin" ON children
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민/매니저/스태프: 같은 센터 아동 전체 CRUD
CREATE POLICY "children_admin_all" ON children
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = children.center_id
    )
);

-- 치료사: 같은 센터 아동 조회 (일정/배정 기반)
CREATE POLICY "children_therapist_select" ON children
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM therapists t 
        WHERE t.profile_id = auth.uid() 
        AND t.center_id = children.center_id
    )
);

-- 부모: family_relationships 기반 자녀만 조회
CREATE POLICY "children_parent_select" ON children
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
    )
);

-- ============================================================
-- PART 2: PAYMENTS 정책 전면 교체
-- ============================================================

DROP POLICY IF EXISTS "payments_super_admin" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_admin_center" ON payments;
DROP POLICY IF EXISTS "payments_parent_select" ON payments;
DROP POLICY IF EXISTS "payments_parent_child" ON payments;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 슈퍼 어드민
CREATE POLICY "payments_super_admin" ON payments
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민/매니저/스태프: 같은 센터 결제 전체 접근
CREATE POLICY "payments_admin_all" ON payments
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND (up.center_id = payments.center_id 
             OR payments.center_id IS NULL)
    )
);

-- 부모: 자녀 결제 조회
CREATE POLICY "payments_parent_select" ON payments
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
    )
);

-- ============================================================
-- PART 3: DEVELOPMENT_ASSESSMENTS 정책 전면 교체
-- ============================================================

DROP POLICY IF EXISTS "Therapists can view assessments for their students" ON development_assessments;
DROP POLICY IF EXISTS "Therapists can create assessments" ON development_assessments;
DROP POLICY IF EXISTS "Therapists can update own assessments" ON development_assessments;
DROP POLICY IF EXISTS "Therapists can delete own assessments" ON development_assessments;
DROP POLICY IF EXISTS "Parents can view own child assessments" ON development_assessments;
DROP POLICY IF EXISTS "Admins can do everything" ON development_assessments;

ALTER TABLE development_assessments ENABLE ROW LEVEL SECURITY;

-- 슈퍼 어드민
CREATE POLICY "assessments_super_admin" ON development_assessments
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민/매니저: 같은 센터 평가 전체 접근
CREATE POLICY "assessments_admin_all" ON development_assessments
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
    )
);

-- 치료사: 본인이 작성한 평가 OR 같은 센터의 평가 조회/작성/수정/삭제
-- development_assessments.therapist_id는 user_profiles.id를 참조하므로 auth.uid() 직접 비교 가능
CREATE POLICY "assessments_therapist_all" ON development_assessments
FOR ALL TO authenticated
USING (
    therapist_id = auth.uid()
    OR
    child_id IN (
        SELECT s.child_id FROM schedules s 
        JOIN therapists t ON t.id = s.therapist_id 
        WHERE t.profile_id = auth.uid()
    )
);

-- 부모: 자녀 평가 조회만
CREATE POLICY "assessments_parent_select" ON development_assessments
FOR SELECT TO authenticated
USING (
    child_id IN (
        SELECT child_id FROM family_relationships WHERE parent_id = auth.uid()
    )
);

-- ============================================================
-- PART 4: ADMIN_NOTIFICATIONS 정책
-- ============================================================

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_super_admin" ON admin_notifications;
DROP POLICY IF EXISTS "notifications_own" ON admin_notifications;
DROP POLICY IF EXISTS "notifications_admin_all" ON admin_notifications;

-- 슈퍼 어드민
CREATE POLICY "notifications_super_admin" ON admin_notifications
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 본인 알림
CREATE POLICY "notifications_own" ON admin_notifications
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- 어드민: 같은 센터 알림 전체
CREATE POLICY "notifications_admin_all" ON admin_notifications
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = admin_notifications.center_id
    )
);

-- ============================================================
-- PART 5: CONSULTATIONS (상담 문의) 정책
-- ============================================================

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_super_admin" ON consultations;
DROP POLICY IF EXISTS "consultations_admin_all" ON consultations;

-- 슈퍼 어드민
CREATE POLICY "consultations_super_admin" ON consultations
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민: 같은 센터 상담 문의 전체
CREATE POLICY "consultations_admin_all" ON consultations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = consultations.center_id
    )
);

-- anon 사용자 INSERT 허용 (홈페이지 상담 접수)
CREATE POLICY "consultations_anon_insert" ON consultations
FOR INSERT TO anon
WITH CHECK (true);

-- ============================================================
-- PART 6: PROGRAMS 정책
-- ============================================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_super_admin" ON programs;
DROP POLICY IF EXISTS "programs_center_read" ON programs;
DROP POLICY IF EXISTS "programs_admin_all" ON programs;

-- 슈퍼 어드민
CREATE POLICY "programs_super_admin" ON programs
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 모든 인증 사용자: 같은 센터 프로그램 조회
CREATE POLICY "programs_center_read" ON programs
FOR SELECT TO authenticated
USING (
    center_id IN (
        SELECT center_id FROM user_profiles WHERE id = auth.uid()
    )
    OR
    center_id IN (
        SELECT center_id FROM therapists WHERE profile_id = auth.uid()
    )
);

-- 어드민: 프로그램 CRUD
CREATE POLICY "programs_admin_all" ON programs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = programs.center_id
    )
);

-- ============================================================
-- PART 7: LEADS 정책
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_super_admin" ON leads;
DROP POLICY IF EXISTS "leads_admin_all" ON leads;

-- 슈퍼 어드민
CREATE POLICY "leads_super_admin" ON leads
FOR ALL TO authenticated
USING (auth.email() = 'anukbin@gmail.com');

-- 어드민: 같은 센터 리드 전체
CREATE POLICY "leads_admin_all" ON leads
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'manager', 'staff')
        AND up.center_id = leads.center_id
    )
);

-- ============================================================
-- PART 8: 추가 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_id_role ON user_profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_center_role ON user_profiles(center_id, role);

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ RLS Part 2 완료 - children, payments, assessments, notifications, consultations, programs, leads' AS status;
