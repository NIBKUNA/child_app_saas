-- 🧨 [EMERGENCY] Reset Specific User (Zombie Cleanup)
-- zaradajoo@gmail.com 계정이 '가입은 됐는데 로그인이 안 되는' 꼬인 상태일 때 사용합니다.
-- 이 스크립트는 해당 이메일의 모든 가입 정보(Auth + Profile)를 삭제하여 초기화합니다.

BEGIN;

-- 1. Remove from Public Profiles (if exists)
DELETE FROM public.user_profiles WHERE email = 'zaradajoo@gmail.com';

-- 2. Remove from Auth Users (Force Cleanup)
DELETE FROM auth.users WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ User [zaradajoo@gmail.com] has been fully reset. You can register again.'; END $$;
