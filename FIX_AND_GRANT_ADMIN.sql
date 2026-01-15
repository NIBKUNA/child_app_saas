-- 🔧 [URGENT FIX] Enable Public Read on Therapists & Fix User Role
-- 1. 아직 로그인 안 한 상태(회원가입 중)에서도 '직원 명부'를 확인해야 '권한'을 줄 수 있습니다.
--    그래서 therapists 테이블을 공개(Public)로 설정합니다.
-- 2. 이미 '부모님'으로 잘못 가입된 원장님 계정을 '관리자'로 강제 변경합니다.

BEGIN;

-- 1. [ROOT CAUSE FIX] Allow Public Read access to Therapists table
-- This allows the Register page to check if an email exists in the staff list.
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY; -- Reset to ensure clean state
DROP POLICY IF EXISTS "Allow public read access" ON public.therapists;
CREATE POLICY "Allow public read access" ON public.therapists
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 2. [IMMEDIATE FIX] Force Update 'zaradajoo' to Admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'zaradajoo@gmail.com';

UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ Fixed: RLS Policy updated and User promoted to Admin.'; END $$;
