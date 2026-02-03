-- 🚑 [Legacy DB Fix] RLS 재귀 오류 해결
-- 깃 리셋 후에도 "500 에러"가 계속된다면, DB 보안 규칙이 아직 '재설계 버전'이라서 그렇습니다.
-- 이 스크립트를 실행하여 DB 규칙도 '과거 방식(Legacy)'으로 되돌려주세요.

BEGIN;

-- 1. 안전 장치: 기존의 꼬인 정책들 전부 제거
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own center profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read Self" ON public.profiles;
DROP POLICY IF EXISTS "Read Team" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update everything" ON public.profiles;
DROP POLICY IF EXISTS "Admin Full Access" ON public.profiles; -- 👈 추가됨
DROP FUNCTION IF EXISTS public.get_my_center_id_safe();

-- 2. 무한 루프 방지용 "우회 함수" 생성
CREATE OR REPLACE FUNCTION public.get_my_center_id_safe()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. 안전한 정책 적용
CREATE POLICY "Read Self" ON public.profiles
FOR SELECT USING ( id = auth.uid() );

CREATE POLICY "Read Team" ON public.profiles
FOR SELECT USING (
  center_id = public.get_my_center_id_safe()
  OR
  (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

CREATE POLICY "Admin Full Access" ON public.profiles
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  OR
  (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
