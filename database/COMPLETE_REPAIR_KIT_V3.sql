-- ============================================================
-- 🚑 [긴급 복구 키트 v3 (최종)] 중복 정책 방지 버전
-- 에러 없이 깔끔하게 모든 정책과 함수를 재설정합니다.
-- ============================================================

-- [1] 500 에러 해결 (RLS 정책 일단 전부 삭제)
-- 기존 정책이 뭐가 남아있든 일단 다 날립니다.
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow select for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update for self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
-- ✨ 여기서부터 추가된 drop (중복 에러 방지)
DROP POLICY IF EXISTS "safe_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_update_admin_or_self" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_insert_auth" ON public.user_profiles;

-- 관리자 여부 확인 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 안전한 정책 재성성
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safe_select_all" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "safe_update_admin_or_self" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ( id = auth.uid() OR public.is_admin() )
  WITH CHECK ( id = auth.uid() OR public.is_admin() );

CREATE POLICY "safe_insert_auth" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- [2] 권한 변경 함수 (RPC) - 메인 함수 (5 Arguments)
-- 혹시 모르니 drop 먼저
DROP FUNCTION IF EXISTS public.update_user_role_safe(UUID, TEXT, TEXT); 
DROP FUNCTION IF EXISTS public.update_user_role_safe(UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_user_role_safe(
  target_user_id UUID,
  new_role TEXT,
  new_status TEXT,
  user_email TEXT,
  user_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 호출자 권한 체크
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'message', '⛔ 권한이 없습니다.');
  END IF;

  -- Upsert 실행
  INSERT INTO public.user_profiles (id, role, status, email, name)
  VALUES (target_user_id, new_role, new_status, COALESCE(user_email, ''), COALESCE(user_name, 'Unknown'))
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' AND EXCLUDED.name != 'Unknown' THEN EXCLUDED.name ELSE public.user_profiles.name END,
    email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email ELSE public.user_profiles.email END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', '✅ 권한 변경 완료');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'DB 오류: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✨ [핵심] 오버로딩 함수 (3 Arguments) - 프론트엔드 호환성 유지
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
  target_user_id UUID,
  new_role TEXT,
  new_status TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- 5개짜리 메인 함수 호출 (나머지는 NULL 처리)
  RETURN public.update_user_role_safe(target_user_id, new_role, new_status, NULL, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_role_safe TO authenticated;

-- [3] 슈퍼 관리자 계정 (anukbin@gmail.com) 복구
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'anukbin@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, email, name, role, status)
    VALUES (v_user_id, 'anukbin@gmail.com', 'Admin', 'super_admin', 'active')
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';
  END IF;
END;
$$;

SELECT '✅ 시스템 완벽 복구 완료 (V3)' AS result;
