-- ============================================================
-- Zarada ERP: Nuclear Fix (Infinite Recursion & Account Reset)
-- 🚨 긴급: 모든 정책/함수 초기화 및 슈퍼 어드민 계정 재성성
-- 버전: Nuclear
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- ============================================================
-- 1. Helper Function 삭제 (의존성 제거)
-- ============================================================
DROP FUNCTION IF EXISTS public.get_user_center_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_center_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_parent_of(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_therapist_of(UUID) CASCADE;

-- ============================================================
-- 2. user_profiles 모든 정책 삭제
-- ============================================================
DROP POLICY IF EXISTS "profiles_self" ON user_profiles;
DROP POLICY IF EXISTS "profiles_jwt_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "profiles_center_isolation" ON user_profiles;
DROP POLICY IF EXISTS "super_admin_bypass" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON user_profiles;
DROP POLICY IF EXISTS "profiles_super_admin_bypass" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON user_profiles;

-- ============================================================
-- 3. Helper Function 재생성 (SECURITY DEFINER - RLS 우회)
-- ============================================================

-- 3.1 Super Admin 체크 (가장 안전한 방법: 이메일 직접 비교)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.email() = 'anukbin@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 내 Center ID 조회
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 내 Role 조회
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. user_profiles 정책 재설정 (재귀 발생 원천 차단)
-- ============================================================

-- 4.1 Super Admin 무조건 허용 (함수 X, JWT 직접 비교)
CREATE POLICY "profiles_super_admin_nuclear" ON user_profiles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 4.2 본인 프로필 조회/수정 (ID 직접 비교)
CREATE POLICY "profiles_self_nuclear" ON user_profiles
FOR ALL 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 중요: get_user_role() 등을 사용하는 "직원 조회" 정책은 당분간 비활성화
-- 필요하다면 아래와 같이 SECURITY DEFINER 함수를 통해서만 접근해야 함

-- ============================================================
-- 5. 계정 리셋 (Delete & Re-register Logic)
-- ============================================================

DO $$
DECLARE
    target_email TEXT := 'anukbin@gmail.com';
    target_uid UUID;
BEGIN
    -- 1. auth.users에서 UID 조회 (Supabase에서는 SQL로 auth.users 직접 접근이 어려울 수 있으나, user_profiles 기준 처리)
    SELECT id INTO target_uid FROM user_profiles WHERE email = target_email;

    IF target_uid IS NOT NULL THEN
        -- 2. 기존 프로필 삭제
        DELETE FROM user_profiles WHERE id = target_uid;
        
        -- 3. 프로필 재생성 (Super Admin 권한으로)
        INSERT INTO user_profiles (id, email, name, role, status)
        VALUES (
            target_uid, 
            target_email, 
            '안욱빈 (Super Admin)', 
            'super_admin', 
            'active'
        );
    END IF;
END $$;

-- 매뉴얼: 만약 auth.users 자체가 꼬였다면 Supabase 대시보드에서 유저 삭제 후 재가입 필요. 
-- 여기서는 user_profiles 데이터를 정화.

-- ============================================================
-- 6. 확인
-- ============================================================
SELECT '✅ NUCLEAR FIX 완료: 함수/정책 초기화 및 계정 재설정' AS status;
SELECT * FROM user_profiles WHERE email = 'anukbin@gmail.com';
