-- ============================================================
-- 🚨 관리자 권한 강제 부여 (최후의 수단)
-- RLS, 트리거 다 무시하고 그냥 강제로 업데이트합니다.
-- ============================================================

DO $$
DECLARE
  target_email TEXT := 'zaradajoo@gmail.com'; -- 대상 이메일
  target_role TEXT := 'admin'; -- 부여할 권한 (admin, therapist, super_admin)
  v_user_id UUID;
BEGIN
  -- 1. auth.users에서 ID 찾기
  SELECT id INTO v_user_id FROM auth.users WHERE email = target_email LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ 해당 이메일(%의) 사용자를 찾을 수 없습니다.', target_email;
  END IF;

  -- 2. user_profiles 강제 Upsert (RLS 무시를 위해 SECURITY DEFINER 함수 안쓰고 그냥 DO 블록에서 실행)
  -- (참고: SQL Editor는 기본적으로 admin 권한으로 실행되므로 RLS 우회 가능)
  
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (v_user_id, target_email, 'zz', target_role, 'active')
  ON CONFLICT (id) DO UPDATE
  SET 
    role = target_role,
    status = 'active';

  RAISE NOTICE '✅ 성공: % (ID: %) 사용자에게 % 권한을 부여했습니다.', target_email, v_user_id, target_role;
END;
$$;
