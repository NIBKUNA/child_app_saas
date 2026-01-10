-- ============================================================
-- Zarada ERP: Definitive System Reset (Infinite Recursion Solution)
-- 🚨 긴급: user_profiles RLS 정책 초기화 및 계정 리셋 (FK 처리 포함)
-- 버전: Final v3 (Fixed FK Constraint)
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- ============================================================
-- 1. Helper Function Cleanup
-- ============================================================
DROP FUNCTION IF EXISTS public.get_user_center_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_center_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_parent_of(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_therapist_of(UUID) CASCADE;

-- ============================================================
-- 2. user_profiles RLS 비활성화
-- ============================================================
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self" ON user_profiles;
DROP POLICY IF EXISTS "profiles_jwt_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_nuclear" ON user_profiles;
DROP POLICY IF EXISTS "profiles_super_admin_nuclear" ON user_profiles;

-- ============================================================
-- 3. Super Admin 계정 데이터 정화 (Cascaded Delete)
-- ============================================================
DO $$
DECLARE
    target_email TEXT := 'anukbin@gmail.com';
    target_uid UUID;
BEGIN
    -- 1. 대상 UID 조회
    SELECT id INTO target_uid FROM user_profiles WHERE email = target_email;

    IF target_uid IS NOT NULL THEN
        -- 2. 연관 데이터 삭제 (Foreign Key 무결성 에러 방지)
        -- 알림 테이블 (에러 원인)
        DELETE FROM admin_notifications WHERE user_id = target_uid;
        
        -- 기타 잠재적 연관 테이블 (필요시 추가)
        -- DELETE FROM other_table WHERE user_id = target_uid;

        -- 3. 프로필 삭제
        DELETE FROM user_profiles WHERE id = target_uid;
    END IF;
END $$;

-- ============================================================
-- 4. user_profiles RLS 재활성화 (Zero-Dependency)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4.1 본인 조회 (ID 매칭만)
CREATE POLICY "profiles_zero_dep_self" ON user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4.2 Super Admin (JWT 매칭만)
CREATE POLICY "profiles_zero_dep_super_admin" ON user_profiles
FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
)
WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- ============================================================
-- 5. 계정 복구를 위한 트리거 확인
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', '사용자'), 
    CASE WHEN new.email = 'anukbin@gmail.com' THEN 'super_admin' ELSE 'parent' END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'anukbin@gmail.com' THEN 'super_admin' ELSE user_profiles.role END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 6. 확인용
-- ============================================================
SELECT '✅ SYSTEM RESET COMPLETE (FK FIXED)' AS status;
