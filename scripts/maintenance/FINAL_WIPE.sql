-- 🧨 [FINAL WIPE] Complete Account Reset for 'zaradajoo@gmail.com'
-- 이 스크립트는 'zaradajoo@gmail.com'과 관련된 모든 로그인 정보와 프로필을 "영구 삭제"합니다.
-- 실행 후 다시 회원가입을 처음부터 진행하실 수 있습니다.

BEGIN;

-- 1. Profiles Table (User Data) - Delete ALL matches (duplicates included)
DELETE FROM public.profiles WHERE email = 'zaradajoo@gmail.com';

-- 2. User Profiles (Legacy/View) - Just in case
DELETE FROM public.user_profiles WHERE email = 'zaradajoo@gmail.com';

-- 3. Auth Identities (Social Login Links)
DELETE FROM auth.identities WHERE email = 'zaradajoo@gmail.com';

-- 4. Auth Sessions (Active Logins)
-- Find user IDs first, then delete sessions
DELETE FROM auth.sessions 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'zaradajoo@gmail.com');

-- 5. Auth Users (The Account Itself)
DELETE FROM auth.users WHERE email = 'zaradajoo@gmail.com';

-- 6. [CRITICAL] Enable Public Read on Therapists (Required for Role Auto-Assignment)
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.therapists;
CREATE POLICY "Allow public read access" ON public.therapists
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 7. [IMPORTANT] Ensure Therapists Table acts as "Invitation List" for Admin
-- Do NOT delete from therapists. Instead, ensure correct Role is waiting.
UPDATE public.therapists 
SET 
  system_role = 'admin', 
  system_status = 'active'
WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 계정 완전 초기화 완료. 다시 회원가입 해주세요.'; END $$;
