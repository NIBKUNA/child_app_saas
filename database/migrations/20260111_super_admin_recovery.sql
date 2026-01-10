-- ============================================================
-- Zarada ERP: Super Admin 권한 복구 및 보호 스크립트
-- 🚨 긴급 수정: Super Admin 접근 차단 이슈 해결
-- 버전: 1.0
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚨 문제: Super Admin(anukbin@gmail.com) RLS에 의해 데이터 접근 차단됨        │
│ 🔧 해결: 모든 테이블에 Super Admin 최우선 정책 추가                           │
└─────────────────────────────────────────────────────────────────────────────┘
*/

-- ============================================================
-- PART 1: Super Admin 역할 강제 업데이트
-- ============================================================

-- 1.1 현재 Super Admin 계정 상태 확인
SELECT 
    '🔍 현재 Super Admin 상태' AS check_type,
    id, 
    email, 
    role, 
    status,
    center_id
FROM user_profiles 
WHERE email = 'anukbin@gmail.com';

-- 1.2 Super Admin 역할 강제 설정 (덮어쓰기)
UPDATE user_profiles 
SET 
    role = 'super_admin',
    status = 'active'
WHERE email = 'anukbin@gmail.com';

-- 1.3 업데이트 확인
SELECT 
    '✅ Super Admin 역할 업데이트 완료' AS status,
    email, 
    role 
FROM user_profiles 
WHERE email = 'anukbin@gmail.com';

-- ============================================================
-- PART 2: 기존 Super Admin 정책 제거 (충돌 방지)
-- ============================================================

-- 모든 테이블에서 기존 super admin 정책 삭제
DROP POLICY IF EXISTS "super_admin_bypass" ON user_profiles;
DROP POLICY IF EXISTS "super_admin_bypass" ON children;
DROP POLICY IF EXISTS "super_admin_bypass" ON schedules;
DROP POLICY IF EXISTS "super_admin_bypass" ON family_relationships;
DROP POLICY IF EXISTS "super_admin_bypass" ON payments;
DROP POLICY IF EXISTS "super_admin_bypass" ON centers;
DROP POLICY IF EXISTS "super_admin_bypass" ON therapists;
DROP POLICY IF EXISTS "super_admin_bypass" ON parents;
DROP POLICY IF EXISTS "super_admin_bypass" ON leads;
DROP POLICY IF EXISTS "super_admin_bypass" ON blog_posts;

-- 기존 명명 패턴의 정책도 삭제
DROP POLICY IF EXISTS "profiles_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "children_super_admin" ON children;
DROP POLICY IF EXISTS "schedules_super_admin" ON schedules;
DROP POLICY IF EXISTS "family_super_admin" ON family_relationships;
DROP POLICY IF EXISTS "payments_super_admin" ON payments;
DROP POLICY IF EXISTS "logs_super_admin" ON counseling_logs;
DROP POLICY IF EXISTS "notes_super_admin" ON daily_notes;

-- ============================================================
-- PART 3: Super Admin 최우선 바이패스 정책 생성
-- ============================================================

-- 3.1 user_profiles - Super Admin 전체 접근
CREATE POLICY "super_admin_bypass" ON user_profiles
FOR ALL 
TO authenticated
USING (auth.email() = 'anukbin@gmail.com')
WITH CHECK (auth.email() = 'anukbin@gmail.com');

-- 3.2 children - Super Admin 전체 접근
CREATE POLICY "super_admin_bypass" ON children
FOR ALL 
TO authenticated
USING (auth.email() = 'anukbin@gmail.com')
WITH CHECK (auth.email() = 'anukbin@gmail.com');

-- 3.3 schedules - Super Admin 전체 접근
CREATE POLICY "super_admin_bypass" ON schedules
FOR ALL 
TO authenticated
USING (auth.email() = 'anukbin@gmail.com')
WITH CHECK (auth.email() = 'anukbin@gmail.com');

-- 3.4 family_relationships - Super Admin 전체 접근
CREATE POLICY "super_admin_bypass" ON family_relationships
FOR ALL 
TO authenticated
USING (auth.email() = 'anukbin@gmail.com')
WITH CHECK (auth.email() = 'anukbin@gmail.com');

-- 3.5 centers - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'centers') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON centers';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON centers FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.6 payments - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON payments';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON payments FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.7 therapists - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapists') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON therapists';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON therapists FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.8 parents - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON parents';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON parents FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.9 leads - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON leads';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON leads FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.10 blog_posts - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON blog_posts';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON blog_posts FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.11 counseling_logs - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counseling_logs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON counseling_logs';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON counseling_logs FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.12 daily_notes - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_notes') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON daily_notes';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON daily_notes FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.13 vouchers - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vouchers') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON vouchers';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON vouchers FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- 3.14 consultations - Super Admin 전체 접근
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "super_admin_bypass" ON consultations';
        EXECUTE 'CREATE POLICY "super_admin_bypass" ON consultations FOR ALL TO authenticated USING (auth.email() = ''anukbin@gmail.com'') WITH CHECK (auth.email() = ''anukbin@gmail.com'')';
    END IF;
END $$;

-- ============================================================
-- PART 4: Super Admin 함수 재생성 (보안 강화)
-- ============================================================

-- is_super_admin 함수 재생성 (SECURITY DEFINER로 권한 상승)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.email() = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PART 5: 복구 확인 스크립트
-- ============================================================

-- 5.1 Super Admin 바이패스 정책 확인
SELECT 
    '📋 Super Admin 정책 목록' AS report,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname = 'super_admin_bypass'
ORDER BY tablename;

-- 5.2 데이터 접근 테스트 (Super Admin으로 로그인 시 실행)
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS divider;
SELECT '🔍 Super Admin 데이터 접근 테스트' AS test_title;
SELECT '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS divider;

-- 테이블별 접근 가능 데이터 수 확인
SELECT 
    'user_profiles' AS table_name,
    COUNT(*) AS accessible_rows
FROM user_profiles
UNION ALL
SELECT 'children', COUNT(*) FROM children
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'centers', COUNT(*) FROM centers;

-- ============================================================
-- PART 6: 향후 정책 추가 시 주의사항
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ 중요: 향후 RLS 정책 추가 시 Super Admin 보호 가이드                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. 모든 새로운 정책에는 Super Admin 예외 조건 포함:                            │
│                                                                             │
│    CREATE POLICY "example_policy" ON some_table                             │
│    FOR SELECT USING (                                                       │
│        auth.email() = 'anukbin@gmail.com'  -- Super Admin 바이패스          │
│        OR (                                                                 │
│            -- 일반 사용자 조건                                               │
│            your_normal_conditions_here                                      │
│        )                                                                    │
│    );                                                                       │
│                                                                             │
│ 2. 정책 이름 규칙:                                                           │
│    - Super Admin 전용: "super_admin_bypass"                                 │
│    - 일반 정책: "테이블명_역할_액션" (예: "children_parent_select")           │
│                                                                             │
│ 3. 정책 우선순위:                                                            │
│    - Supabase RLS는 OR 조건으로 작동                                        │
│    - 하나의 정책이라도 TRUE면 접근 허용                                       │
│    - "super_admin_bypass"가 TRUE → 다른 정책 무관하게 접근 허용              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
*/

-- ============================================================
-- 완료
-- ============================================================
SELECT '✅ Super Admin 권한 복구 완료!' AS final_status;
SELECT 'anukbin@gmail.com 계정으로 로그인하여 모든 데이터 접근 가능합니다.' AS message;
