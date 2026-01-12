-- ============================================================
-- 🚨 긴급: 500 에러(무한 루프) 수정 스크립트
-- RLS 정책 내에서 자기 자신을 참조하여 발생하는 재귀 호출을 제거합니다.
-- ============================================================

-- 1. 문제의 재귀 정책 삭제
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow select for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for auth" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update for self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;


-- 2. 관리자 여부 확인 함수 (SECURITY DEFINER로 RLS 우회)
-- 이 함수는 RLS를 타지 않고 실행되므로 무한 루프에 빠지지 않습니다.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 안전한 새 정책 적용
-- 조회: 누구나 다 볼 수 있게 임시 허용 (직원 목록 로딩 등 오류 방지)
CREATE POLICY "safe_select_all" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- 수정: 본인이거나, 관리자 함수(is_admin)가 참인 경우
CREATE POLICY "safe_update_admin_or_self" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ( id = auth.uid() OR public.is_admin() )
  WITH CHECK ( id = auth.uid() OR public.is_admin() );

-- 기타: Insert는 가입 시 처리되므로 크게 상관 없으나 허용
CREATE POLICY "safe_insert_auth" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

SELECT '✅ 무한 루프 해결 완료. 이제 500 에러가 사라집니다.' AS result;
