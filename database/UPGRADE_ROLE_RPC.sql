-- ============================================================
-- 🚨 관리자 권한 수정 함수 업그레이드 (Upsert 지원)
-- 프로필이 없으면 만들고, 있으면 수정합니다.
-- 409 에러와 "찾을 수 없음" 문제를 동시에 해결합니다.
-- ============================================================

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
  -- 1. 호출자가 관리자(admin/super_admin)인지 확인
  SELECT role INTO caller_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'message', '권한이 없습니다.');
  END IF;

  -- 2. 대상 유저 Upsert (없으면 생성, 있으면 업데이트)
  INSERT INTO public.user_profiles (id, role, status, email, name)
  VALUES (target_user_id, new_role, new_status, user_email, user_name)
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    name = COALESCE(EXCLUDED.name, public.user_profiles.name),
    email = COALESCE(EXCLUDED.email, public.user_profiles.email);

  -- 3. 결과 반환
  RETURN jsonb_build_object('success', true, 'message', '권한이 변경되었습니다.');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 더미 테이블로 스키마 캐시 갱신 유도
CREATE TABLE IF NOT EXISTS public._cache_reload_trigger (id int);
DROP TABLE IF EXISTS public._cache_reload_trigger;

SELECT '✅ 권한 수정 함수 업그레이드 완료 (Upsert 지원)' AS result;
