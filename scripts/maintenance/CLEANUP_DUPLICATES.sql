-- 🧹 [CLEANUP] Remove Duplicate/Zombie Profile
-- 원장님 계정(zaradajoo@gmail.com)이 2개(dd, 센터장)가 존재해서 시스템이 혼란을 겪고 있습니다.
-- 현재 사용 중이신 '센터장' 프로필만 남기고, 옛날 데이터('dd')를 삭제합니다.

BEGIN;

-- 1. Remove the specific duplicate profile named 'dd'
DELETE FROM public.profiles 
WHERE email = 'zaradajoo@gmail.com' 
AND name = 'dd';

-- 2. Ensure the remaining 'Center Director' profile is DEFINITELY Admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'zaradajoo@gmail.com';

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 중복 계정(dd) 삭제 완료. 이제 로그아웃 후 다시 접속하시면 정상 작동합니다.'; END $$;
