-- ☢️ [NUCLEAR OPTION] Infinite Recursion Complete Killsitch
-- 이 스크립트는 "무한 루프"를 일으키는 RLS 기능을 강제로 끄고,
-- 가장 단순한 "JWT 기반(메모리 확인)" 정책 하나만 남깁니다.

BEGIN;

-- 1. [긴급 지혈] 일단 RLS 기능 자체를 끕니다. (이 시점부터 에러 사라짐)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY; -- 혹시 남아있을 구버전 테이블

-- 2. [제거] 문제를 일으키는 모든 정책 이름 명시적 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins see all" ON public.user_profiles;
DROP POLICY IF EXISTS "Read Self" ON public.user_profiles;
DROP POLICY IF EXISTS "Read Team" ON public.user_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;

-- (프로필 테이블 관련)
DROP POLICY IF EXISTS "Read Self" ON public.profiles;
DROP POLICY IF EXISTS "Read Team" ON public.profiles;
DROP POLICY IF EXISTS "Admin Full Access" ON public.profiles;


-- 3. [재건] 재귀(Recursion)가 불가능한 '단순 정책' 1개만 생성
-- DB를 조회하지 않고, 로그인 토큰(JWT)만 확인하므로 절대 루프가 안 생깁니다.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nuclear Safe Access" ON public.user_profiles
FOR ALL USING (
  -- 1. 본인이면 통과
  auth.uid() = id
  OR
  -- 2. 원장님 이메일이면 통과 (DB 조회 X, 토큰 확인 O)
  (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ RLS Loop has been eliminated. System is safe.'; END $$;
