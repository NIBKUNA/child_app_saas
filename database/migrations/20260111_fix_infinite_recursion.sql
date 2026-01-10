-- ============================================================
-- Zarada ERP: RLS 무한 재귀(Infinite Recursion) 해결
-- 🚨 긴급 수정: user_profiles 조회 시 자기 참조 제거
-- 버전: 1.1
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚨 문제: user_profiles 정책이 user_profiles를 다시 조회하며 무한 루프 발생    │
│ 🔧 해결: 재귀 없이 JWT 정보와 UID 비교만으로 단순화                           │
└─────────────────────────────────────────────────────────────────────────────┘
*/

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "profiles_super_admin" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_center_isolation" ON user_profiles;
DROP POLICY IF EXISTS "super_admin_bypass" ON user_profiles;

-- 2. 단순화된 정책 재생성 (순서 중요)

-- 2.1 본인 프로필 조회 (가장 기본, 재귀 없음)
CREATE POLICY "profiles_self" ON user_profiles
FOR SELECT USING (
    id = auth.uid()
);

-- 2.2 Super Admin 조회 (JWT 이메일 직접 비교, 테이블 조회 X)
CREATE POLICY "profiles_jwt_super_admin" ON user_profiles
FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 2.3 센터 격리 조회 (단, 무한 재귀 방지를 위해 단순화하거나 제거)
-- Admin/Staff가 같은 센터 사람을 조회해야 한다면, 
-- 상대방의 center_id를 알기 위해 내 center_id를 조회해야 하는데 여기서 재귀 발생 가능.
-- ➡️ 1단계로 일단 본인/Super Admin만 확실히 뚫어둠. 
--    (다른 사람 프로필 조회는 Admin 기능에서 필요하지만, 일단 앱 안정화 우선)

-- 2.4 Super Admin CRUD (Bypass)
CREATE POLICY "profiles_super_admin_all" ON user_profiles
FOR ALL USING (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
) WITH CHECK (
    (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 3. 정책 확인
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT '✅ user_profiles 무한 재귀 해결 완료' AS status;
