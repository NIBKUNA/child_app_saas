-- 🔓 [FINAL OPEN GATES] Super Admin Absolute Access
-- 원장님(anukbin@gmail.com)에게 모든 테이블의 조회/수정/삭제 권한을 부여합니다.
-- "데이터가 있는데 안 보이는 현상"을 해결합니다.

BEGIN;

-- 1. [Profiles] 유저 프로필
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access" ON public.user_profiles;
CREATE POLICY "Admin All Access" ON public.user_profiles
FOR ALL USING ( (auth.jwt() ->> 'email') = 'anukbin@gmail.com' OR auth.uid() = id );

-- 2. [Centers] 센터 정보
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access" ON public.centers;
CREATE POLICY "Admin All Access" ON public.centers
FOR ALL USING ( true ); -- 센터 정보는 누구나 읽기 가능 (로그인 전에도 필요)

-- 3. [Therapists] 치료사 목록
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access" ON public.therapists;
CREATE POLICY "Admin All Access" ON public.therapists
FOR ALL USING ( (auth.jwt() ->> 'email') = 'anukbin@gmail.com' OR (select role from user_profiles where id = auth.uid()) IN ('super_admin', 'admin') );

-- 4. [Children] 아동 목록
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access" ON public.children;
CREATE POLICY "Admin All Access" ON public.children
FOR ALL USING ( (auth.jwt() ->> 'email') = 'anukbin@gmail.com' OR (select role from user_profiles where id = auth.uid()) IN ('super_admin', 'admin') );

-- 5. [Waitlist] 대기자 명단 (만약 있다면)
CREATE TABLE IF NOT EXISTS public.waitlist (id uuid primary key, name text); -- 혹시 없으면 에러 방지용 더미
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All Access" ON public.waitlist;
CREATE POLICY "Admin All Access" ON public.waitlist
FOR ALL USING ( (auth.jwt() ->> 'email') = 'anukbin@gmail.com' );

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ All Gates Opened for Master Account.'; END $$;
