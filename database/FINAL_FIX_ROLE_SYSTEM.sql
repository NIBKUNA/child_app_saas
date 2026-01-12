-- ============================================================
-- 🚀 [최종] 직원 권한 관리 시스템 완벽 복구 스크립트
-- 이 스크립트는 기존의 꼬인 권한/함수/정책을 모두 정리하고
-- 관리자가 버튼 클릭 한 번으로 직원을 수정할 수 있게 만듭니다.
-- ============================================================

-- 1. 기존 함수 및 정책 청소
DROP FUNCTION IF EXISTS public.update_user_role_safe(UUID, TEXT, TEXT); -- 구버전 삭제
DROP FUNCTION IF EXISTS public.update_user_role_safe(UUID, TEXT, TEXT, TEXT, TEXT); -- 신버전 삭제 (재생성을 위해)
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;

-- 2. 강력한 권한 수정 함수 생성 (Upsert 지원)
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
  -- 호출자 권한 체크 (관리자만 가능)
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();

  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'message', '⛔ 권한이 없습니다 (관리자만 가능)');
  END IF;

  -- 대상 유저 Upsert (없으면 생성, 있으면 수정)
  -- 409 에러 없이 무조건 성공시킵니다.
  INSERT INTO public.user_profiles (id, role, status, email, name)
  VALUES (target_user_id, new_role, new_status, user_email, user_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    -- 이름이나 이메일이 비어있지 않을 때만 업데이트
    name = CASE WHEN EXCLUDED.name IS NOT NULL AND EXCLUDED.name != '' THEN EXCLUDED.name ELSE public.user_profiles.name END,
    email = CASE WHEN EXCLUDED.email IS NOT NULL AND EXCLUDED.email != '' THEN EXCLUDED.email ELSE public.user_profiles.email END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', '✅ 권한 변경 완료');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'DB 오류: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.update_user_role_safe TO authenticated;

-- 4. RLS 정책 재정비 (관리자가 직접 수정하는 경우를 대비)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    OR id = auth.uid() -- 본인 수정도 허용
  )
  WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    OR id = auth.uid()
  );

-- 5. 스키마 캐시 강제 리로드용 더미 작업
CREATE TABLE IF NOT EXISTS public._trigger_cache_reload (id int);
DROP TABLE IF EXISTS public._trigger_cache_reload;

SELECT '🎉 시스템 복구 완료. 이제 직원 관리 페이지에서 권한을 수정해보세요.' AS result;
