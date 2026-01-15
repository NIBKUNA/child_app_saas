-- 🧨 [FINAL RESET] Force Delete "zaradajoo" Account
-- 이전 스크립트가 실패한 이유: 'profiles' 테이블(진짜 데이터)이 아닌 'user_profiles'를 지워서,
-- 외래키(Foreign Key) 제약으로 인해 메인 계정이 안 지워졌습니다.
-- 이번에는 진짜 테이블(profiles)을 먼저 지워서 확실하게 해결합니다.

BEGIN;

-- 1. Remove from Real Profiles table (This holds the FK constraint)
DELETE FROM public.profiles WHERE email = 'zaradajoo@gmail.com';

-- 2. Remove from Legacy/View tables just in case
DELETE FROM public.user_profiles WHERE email = 'zaradajoo@gmail.com';

-- 3. Remove Auth Identities (Social Login Traces)
DELETE FROM auth.identities WHERE email = 'zaradajoo@gmail.com';

-- 4. Remove Auth Sessions
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'zaradajoo@gmail.com');

-- 5. Finally Remove from Auth Users
DELETE FROM auth.users WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 계정이 완벽하게 초기화되었습니다. 이제 회원가입이 가능합니다.'; END $$;
