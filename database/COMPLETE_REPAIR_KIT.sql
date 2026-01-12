-- ============================================================
-- 🚑 [긴급 복구 키트] 통합 해결 스크립트
-- 1. 500 에러 (무한 루프) 해결
-- 2. 권한 변경 함수 (RPC) 최신화 및 복구
-- 3. 슈퍼 관리자 계정 복구
-- ============================================================

-- [1] 500 에러 해결 (RLS 무한 루프 제거)
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow select for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update for self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;

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

-- [2] 권한 변경 함수 (RPC) 최신화 (Upsert & 5 arguments)
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

  -- Upsert 실행 (이메일/이름이 비어있으면 기존 값 유지)
  INSERT INTO public.user_profiles (id, role, status, email, name)
  VALUES (target_user_id, new_role, new_status, user_email, user_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' THEN EXCLUDED.name ELSE public.user_profiles.name END,
    email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email ELSE public.user_profiles.email END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', '✅ 권한 변경 완료');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'DB 오류: ' || SQLERRM);
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

-- 스키마 캐시 리로드 유도
NOTIFY pgrst, 'reload schema';

SELECT '✅ 통합 복구 완료 (500에러 / 권한변경 / 관리자복구)' AS result;
