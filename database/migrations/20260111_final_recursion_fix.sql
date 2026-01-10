-- ============================================================
-- Zarada ERP: 최종 무한 재귀 수정 및 계정 복구
-- 버전: Final
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- ============================================================
-- 1. Helper Function 재작성 (SECURITY DEFINER 필수)
-- ============================================================
-- SECURITY DEFINER를 사용하여 함수 실행 시 RLS를 우회하도록 설정 (무한 재귀 방지의 핵심)

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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 👈 중요: RLS 우회

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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- 👈 중요: RLS 우회

-- ============================================================
-- 2. user_profiles RLS 정책 완전 초기화
-- ============================================================

DROP POLICY IF EXISTS "profiles_self" ON user_profiles;
DROP POLICY IF EXISTS "profiles_jwt_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "profiles_center_isolation" ON user_profiles;
DROP POLICY IF EXISTS "super_admin_bypass" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON user_profiles;

-- 3. 안전한 정책 적용 (테이블 조회 최소화)

-- 3.1 Super Admin (JWT 기반 - DB 조회 없음)
CREATE POLICY "profiles_super_admin_bypass" ON user_profiles
FOR ALL 
TO authenticated
USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 3.2 본인 프로필 (ID 비교 - 안전)
CREATE POLICY "profiles_self_access" ON user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3.3 (옵션) 같은 센터 직원 조회
-- get_user_center_id()가 SECURITY DEFINER이므로 사용 가능하지만, 
-- 지금 오류가 발생 중이므로 일단 주석 처리하거나 보수적으로 접근
/*
CREATE POLICY "profiles_center_read" ON user_profiles
FOR SELECT
TO authenticated
USING (
    center_id = public.get_user_center_id()
    AND public.get_user_role() IN ('admin', 'staff')
);
*/

-- ============================================================
-- 3. Super Admin 계정 복구
-- ============================================================

UPDATE user_profiles
SET 
    role = 'super_admin',
    status = 'active'
WHERE email = 'anukbin@gmail.com';

-- ============================================================
-- 4. 확인
-- ============================================================

SELECT '✅ 최종 수정 완료: Helper 함수 SECURITY DEFINER 적용 및 RLS 단순화' AS status;
SELECT email, role, status FROM user_profiles WHERE email = 'anukbin@gmail.com';
