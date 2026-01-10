-- ============================================================
-- Zarada ERP: RLS 정책 고도화 (Multi-tenant + RBAC) v2.1
-- 버전: 2.1 (Fixed for actual DB schema)
-- 생성일: 2026-01-10
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- ============================================================
-- PART 1: 헬퍼 함수 (Helper Functions)
-- ============================================================

-- 1.1 현재 사용자의 center_id 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_center_id()
RETURNS UUID AS $$
DECLARE
    center UUID;
BEGIN
    SELECT center_id INTO center 
    FROM user_profiles 
    WHERE id = auth.uid();
    RETURN center;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.2 현재 사용자의 role 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM user_profiles 
    WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.3 Super Admin 체크 함수
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.email() = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.4 부모-자녀 관계 체크 함수
CREATE OR REPLACE FUNCTION public.is_parent_of(target_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM family_relationships
        WHERE parent_id = auth.uid()
        AND child_id = target_child_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.5 치료사-아동 담당 체크 함수
CREATE OR REPLACE FUNCTION public.is_therapist_of(target_child_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM child_therapist
        WHERE therapist_id = auth.uid()
        AND child_id = target_child_id
    ) OR EXISTS (
        SELECT 1 FROM schedules
        WHERE therapist_id = auth.uid()
        AND child_id = target_child_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PART 2: 기존 정책 완전 삭제
-- ============================================================

-- USER_PROFILES
DROP POLICY IF EXISTS "profiles_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_center_isolation" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;

-- CHILDREN  
DROP POLICY IF EXISTS "children_super_admin" ON children;
DROP POLICY IF EXISTS "children_admin_crud" ON children;
DROP POLICY IF EXISTS "children_staff_read" ON children;
DROP POLICY IF EXISTS "children_therapist_assigned" ON children;
DROP POLICY IF EXISTS "children_parent_family" ON children;

-- SCHEDULES
DROP POLICY IF EXISTS "schedules_super_admin" ON schedules;
DROP POLICY IF EXISTS "schedules_admin_crud" ON schedules;
DROP POLICY IF EXISTS "schedules_therapist_own" ON schedules;
DROP POLICY IF EXISTS "schedules_therapist_update" ON schedules;
DROP POLICY IF EXISTS "schedules_parent_child" ON schedules;

-- COUNSELING_LOGS
DROP POLICY IF EXISTS "logs_super_admin" ON counseling_logs;
DROP POLICY IF EXISTS "logs_admin_center" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_read" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_insert" ON counseling_logs;
DROP POLICY IF EXISTS "logs_therapist_assigned_update" ON counseling_logs;
DROP POLICY IF EXISTS "logs_parent_child" ON counseling_logs;

-- PAYMENTS
DROP POLICY IF EXISTS "payments_super_admin" ON payments;
DROP POLICY IF EXISTS "payments_admin_center" ON payments;
DROP POLICY IF EXISTS "payments_parent_child" ON payments;

-- FAMILY_RELATIONSHIPS
DROP POLICY IF EXISTS "family_super_admin" ON family_relationships;
DROP POLICY IF EXISTS "family_admin_manage" ON family_relationships;
DROP POLICY IF EXISTS "family_parent_own" ON family_relationships;
DROP POLICY IF EXISTS "family_parent_insert" ON family_relationships;

-- DAILY_NOTES
DROP POLICY IF EXISTS "notes_super_admin" ON daily_notes;
DROP POLICY IF EXISTS "notes_admin_center" ON daily_notes;
DROP POLICY IF EXISTS "notes_therapist_own" ON daily_notes;
DROP POLICY IF EXISTS "notes_parent_child" ON daily_notes;
DROP POLICY IF EXISTS "notes_parent_reply" ON daily_notes;

-- ============================================================
-- PART 3: RLS 활성화 (존재하는 테이블만)
-- ============================================================

ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS children ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS family_relationships ENABLE ROW LEVEL SECURITY;

-- 조건부 활성화 (테이블 존재 시)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counseling_logs') THEN
        ALTER TABLE counseling_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_notes') THEN
        ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================
-- PART 4: USER_PROFILES 정책
-- ============================================================

-- Super Admin: 전체 접근
CREATE POLICY "profiles_super_admin" ON user_profiles
FOR ALL USING (public.is_super_admin());

-- 본인 프로필 조회
CREATE POLICY "profiles_self_select" ON user_profiles
FOR SELECT USING (id = auth.uid());

-- 같은 센터 조회 (Admin/Staff)
CREATE POLICY "profiles_center_isolation" ON user_profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.center_id = user_profiles.center_id
        AND up.role IN ('admin', 'staff')
    )
);

-- 본인 프로필 수정
CREATE POLICY "profiles_self_update" ON user_profiles
FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- PART 5: CHILDREN 정책
-- ============================================================

-- Super Admin
CREATE POLICY "children_super_admin" ON children
FOR ALL USING (public.is_super_admin());

-- Admin: 센터 기반 CRUD
CREATE POLICY "children_admin_crud" ON children
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'admin'
        AND up.center_id = children.center_id
    )
);

-- Staff: 센터 기반 조회
CREATE POLICY "children_staff_read" ON children
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role = 'staff'
        AND up.center_id = children.center_id
    )
);

-- Therapist: 담당 아동만 조회
CREATE POLICY "children_therapist_assigned" ON children
FOR SELECT USING (
    public.get_user_role() = 'therapist' 
    AND public.is_therapist_of(id)
);

-- Parent: family_relationships 기반 조회만
CREATE POLICY "children_parent_family" ON children
FOR SELECT USING (
    public.get_user_role() = 'parent' 
    AND public.is_parent_of(id)
);

-- ============================================================
-- PART 6: SCHEDULES 정책
-- ============================================================

-- Super Admin
CREATE POLICY "schedules_super_admin" ON schedules
FOR ALL USING (public.is_super_admin());

-- Admin/Staff: 센터 기반 CRUD
CREATE POLICY "schedules_admin_crud" ON schedules
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'staff')
        AND up.center_id = schedules.center_id
    )
);

-- Therapist: 본인 담당 수업만 조회
CREATE POLICY "schedules_therapist_own" ON schedules
FOR SELECT USING (
    public.get_user_role() = 'therapist' 
    AND therapist_id = auth.uid()
);

-- Therapist: 본인 담당 수업만 수정
CREATE POLICY "schedules_therapist_update" ON schedules
FOR UPDATE USING (
    public.get_user_role() = 'therapist' 
    AND therapist_id = auth.uid()
);

-- Parent: 자녀 일정만 조회
CREATE POLICY "schedules_parent_child" ON schedules
FOR SELECT USING (
    public.get_user_role() = 'parent' 
    AND public.is_parent_of(child_id)
);

-- ============================================================
-- PART 7: FAMILY_RELATIONSHIPS 정책
-- ============================================================

-- Super Admin
CREATE POLICY "family_super_admin" ON family_relationships
FOR ALL USING (public.is_super_admin());

-- Admin: 센터 기반 관리
CREATE POLICY "family_admin_manage" ON family_relationships
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN children c ON c.center_id = up.center_id
        WHERE up.id = auth.uid() 
        AND up.role IN ('admin', 'staff')
        AND c.id = family_relationships.child_id
    )
);

-- Parent: 본인 관계만 조회
CREATE POLICY "family_parent_own" ON family_relationships
FOR SELECT USING (parent_id = auth.uid());

-- Parent: 초대 코드로 관계 생성
CREATE POLICY "family_parent_insert" ON family_relationships
FOR INSERT WITH CHECK (parent_id = auth.uid());

-- ============================================================
-- PART 8: COUNSELING_LOGS 정책 (테이블 존재 시)
-- ============================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counseling_logs') THEN
        -- Super Admin
        EXECUTE 'CREATE POLICY "logs_super_admin" ON counseling_logs FOR ALL USING (public.is_super_admin())';
        
        -- Therapist: 담당 아동 상담 기록 조회
        EXECUTE 'CREATE POLICY "logs_therapist_read" ON counseling_logs FOR SELECT USING (
            public.get_user_role() = ''therapist'' 
            AND (therapist_id = auth.uid() OR public.is_therapist_of(child_id))
        )';
        
        -- Therapist: 본인 작성 기록만 INSERT
        EXECUTE 'CREATE POLICY "logs_therapist_insert" ON counseling_logs FOR INSERT WITH CHECK (
            public.get_user_role() = ''therapist'' AND therapist_id = auth.uid()
        )';
        
        -- Parent: 자녀 상담 기록 조회만
        EXECUTE 'CREATE POLICY "logs_parent_child" ON counseling_logs FOR SELECT USING (
            public.get_user_role() = ''parent'' AND public.is_parent_of(child_id)
        )';
    END IF;
END $$;

-- ============================================================
-- PART 9: PAYMENTS 정책 (child_id 기반, center_id 미사용)
-- ============================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        -- Super Admin
        EXECUTE 'CREATE POLICY "payments_super_admin" ON payments FOR ALL USING (public.is_super_admin())';
        
        -- Admin/Staff: children 테이블 통해 센터 확인
        EXECUTE 'CREATE POLICY "payments_admin_center" ON payments FOR ALL USING (
            EXISTS (
                SELECT 1 FROM user_profiles up
                JOIN children c ON c.center_id = up.center_id
                WHERE up.id = auth.uid() 
                AND up.role IN (''admin'', ''staff'')
                AND c.id = payments.child_id
            )
        )';
        
        -- Parent: 본인 자녀 결제 내역 조회만
        EXECUTE 'CREATE POLICY "payments_parent_child" ON payments FOR SELECT USING (
            public.get_user_role() = ''parent'' AND public.is_parent_of(child_id)
        )';
    END IF;
END $$;

-- ============================================================
-- PART 10: 성능 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_center_role ON user_profiles(center_id, role);
CREATE INDEX IF NOT EXISTS idx_children_center_id ON children(center_id);
CREATE INDEX IF NOT EXISTS idx_schedules_center_id ON schedules(center_id);
CREATE INDEX IF NOT EXISTS idx_schedules_therapist_id ON schedules(therapist_id);
CREATE INDEX IF NOT EXISTS idx_schedules_child_id ON schedules(child_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_parent ON family_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_child ON family_relationships(child_id);

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ RLS 정책 고도화 완료 (Multi-tenant + RBAC) v2.1' AS status;
