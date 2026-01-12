-- ============================================================
-- 🚨 긴급: 슈퍼 관리자 권한 강제 복구
-- anukbin@gmail.com 계정을 super_admin으로 강제 설정합니다.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. 이메일로 ID 찾기
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'anukbin@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ anukbin@gmail.com 계정을 찾을 수 없습니다.';
  END IF;

  -- 2. user_profiles 강제 업데이트 (존재하지 않으면 생성)
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (v_user_id, 'anukbin@gmail.com', 'Admin', 'super_admin', 'active')
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'super_admin',
    status = 'active';

  RAISE NOTICE '✅ 복구 완료: anukbin@gmail.com 계정이 슈퍼 관리자로 설정되었습니다.';
END;
$$;
