-- ============================================================
-- Zarada ERP: Super Admin Profile Restoration
-- 🚨 긴급: 삭제된 user_profiles 데이터 수동 복구
-- 버전: Restore v1
-- 생성일: 2026-01-11
-- 작성자: 안욱빈 (An Uk-bin)
-- ============================================================

-- 1. auth.users에서 anukbin@gmail.com의 ID를 찾아 user_profiles에 복구
INSERT INTO public.user_profiles (id, email, name, role, status)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', '안욱빈 (Super Admin)'), 
    'super_admin', 
    'active'
FROM auth.users
WHERE email = 'anukbin@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    role = 'super_admin',
    status = 'active';

-- 2. 확인
SELECT * FROM user_profiles WHERE email = 'anukbin@gmail.com';

SELECT '✅ Super Admin 프로필 복구 완료. 이제 로그인하세요.' AS status;
