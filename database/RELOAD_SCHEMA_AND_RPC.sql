-- ============================================================
-- 스키마 캐시 강제 리로드 및 RPC 함수 재확인
-- "Could not find the function" 에러 해결용
-- ============================================================

-- 1. 함수 다시 생성 (확실하게 하기 위해)
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
  target_user_id UUID,
  new_role TEXT,
  new_status TEXT
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

  -- 2. 대상 유저 업데이트
  UPDATE public.user_profiles
  SET role = new_role, status = new_status, updated_at = now()
  WHERE id = target_user_id;

  -- 3. 결과 반환
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', '권한이 변경되었습니다.');
  ELSE
    RETURN jsonb_build_object('success', false, 'message', '대상 프로필을 찾을 수 없습니다.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 권한 부여
GRANT EXECUTE ON FUNCTION public.update_user_role_safe TO authenticated;

-- 3. 스키마 캐시 리로드 트리거 (더미 테이블 생성 및 삭제로 캐시 갱신 유도)
CREATE TABLE IF NOT EXISTS public._cache_reload_trigger (id int);
DROP TABLE IF EXISTS public._cache_reload_trigger;

SELECT '✅ 함수 재생성 및 스키마 캐시 갱신 완료' AS result;
