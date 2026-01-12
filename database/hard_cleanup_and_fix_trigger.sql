-- ============================================================
-- Zarada ERP: 회원가입 에러(500) 해결을 위한 초강력 스크립트
-- 🚨 원인: 기존 데이터(일정, 일지 등)가 남아있어서 '삭제'가 막혔던 문제
-- 🛠️ 해결: '좀비 데이터'가 발견되면 딸려있는 모든 데이터(일정, 일지)를 먼저 지우고 계정 생성
-- ============================================================

-- 1. 종속 데이터 삭제 함수 (Foreign Key 에러 방지용)
CREATE OR REPLACE FUNCTION public.cleanup_therapist_dependencies(target_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 자식 테이블 데이터 삭제 (순서대로)
    DELETE FROM public.schedules WHERE therapist_id = target_id;
    DELETE FROM public.child_therapist WHERE therapist_id = target_id;
    DELETE FROM public.evaluations WHERE therapist_id = target_id;
    DELETE FROM public.counseling_logs WHERE therapist_id = target_id;
    DELETE FROM public.progress_notes WHERE therapist_id = target_id;
    DELETE FROM public.daily_notes WHERE therapist_id = target_id;
    -- 알림 삭제
    DELETE FROM public.admin_notifications WHERE user_id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. 회원가입 트리거 수정 (Clean & Insert)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  old_therapist_id UUID;
BEGIN
  -- A. 이메일 충돌 확인 (기존 therapists 테이블에 같은 이메일이 있는지?)
  SELECT id INTO old_therapist_id 
  FROM public.therapists 
  WHERE email = new.email;

  -- B. 이미 존재한다면?
  IF old_therapist_id IS NOT NULL THEN
      
      -- Case 1: ID까지 똑같다면? (이미 등록된 관리자/초대된 직원)
      IF old_therapist_id = new.id THEN
          -- user_profiles만 Active로 만들어서 승인 처리
          INSERT INTO public.user_profiles (id, email, name, role, status)
          VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', '사용자'), 'therapist', 'active')
          ON CONFLICT (id) DO UPDATE SET status = 'active';
          
          -- Therapists 정보 업데이트
          UPDATE public.therapists 
          SET name = COALESCE(new.raw_user_meta_data->>'name', name)
          WHERE id = new.id;
          
      -- Case 2: 이메일은 같은데 ID가 다르다면? ('좀비 데이터'임)
      ELSE
          -- ✨ [핵심] 종속 데이터 싹 지우고 (에러 방지), 부모 데이터 삭제
          PERFORM public.cleanup_therapist_dependencies(old_therapist_id);
          DELETE FROM public.therapists WHERE id = old_therapist_id;
          DELETE FROM public.user_profiles WHERE id = old_therapist_id; -- 혹시 있으면
          
          -- 이제 깨끗해졌으니 신규 가입(Pending)으로 진행
          INSERT INTO public.user_profiles (id, email, name, role, status)
          VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', '사용자'), 'therapist', 'pending');

          INSERT INTO public.therapists (id, name, email, color)
          VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', '승인대기유저'), new.email, '#cbd5e1');

          -- 알림 생성
          INSERT INTO public.admin_notifications (type, message, user_id, is_read)
          VALUES ('new_user', '새로운 치료사 가입 요청이 있습니다.', new.id, false);
      END IF;

  ELSE
      -- C. 아예 쌩 신규 가입자 (깨끗함)
      INSERT INTO public.user_profiles (id, email, name, role, status)
      VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', '사용자'), 'therapist', 'pending');

      INSERT INTO public.therapists (id, name, email, color)
      VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', '승인대기유저'), new.email, '#cbd5e1');

      INSERT INTO public.admin_notifications (type, message, user_id, is_read)
      VALUES ('new_user', '새로운 치료사 가입 요청이 있습니다.', new.id, false);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. [긴급] 기존 좀비 데이터(zombi00000@naver.com) 지금 바로 청소 (옵션)
DO $$
DECLARE
  zombie_id UUID;
BEGIN
  -- therapists 테이블에서 좀비 찾기
  SELECT id INTO zombie_id FROM public.therapists WHERE email = 'zombi00000@naver.com';
  
  IF zombie_id IS NOT NULL THEN
    -- 종속 데이터 삭제 후 본체 삭제
    PERFORM public.cleanup_therapist_dependencies(zombie_id);
    DELETE FROM public.therapists WHERE id = zombie_id;
    DELETE FROM public.user_profiles WHERE id = zombie_id;
    RAISE NOTICE '✅ zombi00000@naver.com 데이터 강제 청소 완료';
  END IF;
END $$;
