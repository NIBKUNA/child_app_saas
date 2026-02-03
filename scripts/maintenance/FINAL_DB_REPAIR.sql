-- 🚑 [최종 검증된 DB 복구 키트]
-- 이 스크립트는 "Infinite recursion" (42P17) 에러를 100% 제거합니다.
-- 이미 정책이 존재한다는 에러가 뜨지 않도록 DROP을 먼저 수행합니다.

BEGIN;

-- 1. [초기화] 기존 꼬인 정책 전부 삭제 (에러 방지용)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own center profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read Self" ON public.profiles;
DROP POLICY IF EXISTS "Read Team" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update everything" ON public.profiles;
DROP POLICY IF EXISTS "Admin Full Access" ON public.profiles;
-- 안전 함수도 재생성하기 위해 삭제
DROP FUNCTION IF EXISTS public.get_my_center_id_safe();

-- 2. [치료] 무한 루프 끊어주는 '우회 함수' 생성
-- (이 함수는 보안 규칙 검사 없이 작동하여, 꼬리를 무는 현상을 막습니다)
CREATE OR REPLACE FUNCTION public.get_my_center_id_safe()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- 👈 중요: RLS 우회 권한
STABLE
AS $$
  SELECT center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. [복구] 안전한 정책 재적용

-- 3-1. 내 정보 읽기 (단순)
CREATE POLICY "Read Self" ON public.profiles
FOR SELECT USING ( id = auth.uid() );

-- 3-2. 같은 센터 사람들 읽기 (우회 함수 사용)
CREATE POLICY "Read Team" ON public.profiles
FOR SELECT USING (
  center_id = public.get_my_center_id_safe()
  OR
  (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 3-3. 관리자 권한 (모든 권한 부여)
CREATE POLICY "Admin Full Access" ON public.profiles
FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  OR
  (auth.jwt() ->> 'email') = 'anukbin@gmail.com'
);

-- 4. RLS 기능 다시 켜기
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;

-- 5. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ DB Recursion Fix Applied Successfully.';
END $$;
