-- ============================================================
-- Zarada ERP: 회원가입 에러(500) 진짜 최종 해결
-- 🚨 원인: 아까의 코드는 '치료사'로서의 기록만 지웠으나, '작성자(Created By)' 기록이 남아서 삭제가 막힘
-- 🛠️ 해결: '작성자'로 되어있는 기록까지 모두 연결 해제(NULL) 후 삭제
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_therapist_dependencies(target_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. 치료사로서의 데이터 삭제 (기존 동일)
    DELETE FROM public.schedules WHERE therapist_id = target_id;
    DELETE FROM public.child_therapist WHERE therapist_id = target_id;
    DELETE FROM public.evaluations WHERE therapist_id = target_id;
    DELETE FROM public.counseling_logs WHERE therapist_id = target_id;
    DELETE FROM public.progress_notes WHERE therapist_id = target_id;
    DELETE FROM public.daily_notes WHERE therapist_id = target_id;
    
    -- 2. ✨ [추가된 핵심] 작성자(Created By)로서의 연관관계 끊기
    -- 이 부분이 없어서 삭제가 계속 실패했던 것입니다.
    UPDATE public.schedules SET created_by = NULL WHERE created_by = target_id;
    UPDATE public.payments SET created_by = NULL WHERE created_by = target_id;
    UPDATE public.blog_posts SET author_id = NULL WHERE author_id = target_id;
    UPDATE public.notices SET author_id = NULL WHERE author_id = target_id;
    UPDATE public.leads SET assigned_to = NULL WHERE assigned_to = target_id;
    
    -- 3. 로그 및 알림 데이터 삭제
    DELETE FROM public.activity_logs WHERE user_id = target_id;
    DELETE FROM public.notifications WHERE user_id = target_id;
    DELETE FROM public.admin_notifications WHERE user_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. [긴급] 기존 좀비 데이터(zombi00000 / dd) 강제 청소
DO $$
DECLARE
  zombie_id UUID;
  r RECORD;
BEGIN
  -- 이메일로 ID 찾아서 (therapists 혹은 user_profiles 어디든)
  FOR r IN 
    SELECT id FROM public.user_profiles WHERE email = 'zombi00000@naver.com'
    UNION
    SELECT id FROM public.therapists WHERE email = 'zombi00000@naver.com'
  LOOP
    -- 찾은 ID에 대해 종속성 청소 실행
    PERFORM public.cleanup_therapist_dependencies(r.id);
    
    -- 본체 삭제
    DELETE FROM public.therapists WHERE id = r.id;
    DELETE FROM public.user_profiles WHERE id = r.id;
    
    RAISE NOTICE '✅ 좀비 데이터 완전 삭제 완료: %', r.id;
  END LOOP;
END $$;
