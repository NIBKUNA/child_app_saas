-- 🧹 Deployment Cleanup Script (2026-01-11)
-- Description: Removes dummy data created during verification phases.

BEGIN;

-- 1. Remove Dummy Leads
-- Added in Step 3466 and 3482
DELETE FROM public.leads
WHERE parent_name IN ('김철수 부모', '이영희 부모', '박지성 부모')
   OR child_name IN ('김철수', '이영희', '박지성');

-- 2. Remove Dummy Children (and cascaded data)
-- '김지수' was added in unified_report_final.sql (Step 3326)
DELETE FROM public.children
WHERE name = '김지수';

-- 3. Remove Dummy User Profiles (if any distinct email was used)
-- 'dummy_parent_001@example.com' was used in unified_report_final.sql
DELETE FROM public.user_profiles
WHERE email = 'dummy_parent_001@example.com';

DELETE FROM public.profiles
WHERE email = 'dummy_parent_001@example.com';

COMMIT;

-- Verification
-- SELECT count(*) FROM leads; -- Should be real leads only
