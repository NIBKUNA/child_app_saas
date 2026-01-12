-- ============================================================
-- Zarada ERP: 긴급 복구 및 완전 삭제 기능 적용 (Emergency Cleanup)
-- 🚨 목적: 삭제했지만 DB에 남아있는 '좀비 계정'을 완전히 날려버리기
-- 🚨 그리고 앞으로 삭제 버튼 누르면 계정까지 지워지도록 함수 생성
-- ============================================================

-- 1. 먼저 완전 삭제 함수(RPC)가 없으면 생성합니다.
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 앱 데이터 삭제
  DELETE FROM public.therapists WHERE id = target_user_id;
  DELETE FROM public.admin_notifications WHERE user_id = target_user_id;
  DELETE FROM public.user_profiles WHERE id = target_user_id;
  
  -- 인증 계정 삭제 (가장 중요)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. [긴급 복구] 문제가 되는 사용자(dd / zaradajoo@gmail.com)를 찾아 강제 삭제합니다.
DO $$
DECLARE
  r RECORD;
BEGIN
  -- 이메일로 ID 찾기 (여러 명일 수 있으므로 LOOP 사용)
  FOR r IN 
    SELECT id, email 
    FROM auth.users
    WHERE email IN ('zaradajoo@gmail.com', 'zombi00000@naver.com')
  LOOP
    PERFORM public.delete_user_completely(r.id);
    RAISE NOTICE '✅ 계정 삭제 완료: %', r.email;
  END LOOP;
END $$;

-- 3. 확인: 이제 user_profiles 테이블 조회해서 사라졌는지 확인
SELECT * FROM public.user_profiles WHERE email = 'zaradajoo@gmail.com';
