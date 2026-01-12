-- ============================================================
-- Zarada ERP: 회원가입 흐름 및 승인 로직 최종 수정 (Fix Signup Flow)
-- 🚨 목표:
-- 1. 관리자가 직접 추가한 이메일 -> 가입 시 'Active' (즉시 승인)
-- 2. 사용자가 스스로 가입한 이메일 -> 가입 시 'Pending' (승인 대기) + 알림 생성
-- 작성자: 안욱빈
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  is_pre_registered BOOLEAN;
BEGIN
  -- 1. 이미 therapists 테이블에 등록된 이메일인지 확인 (관리자 직접 등록 여부)
  SELECT EXISTS (
    SELECT 1 FROM public.therapists WHERE email = new.email
  ) INTO is_pre_registered;

  IF is_pre_registered THEN
    -- [Case A] 미리 등록된 직원: 즉시 Active 및 기존 ID 매핑
    -- therapists 테이블의 ID를 auth.users.id로 업데이트해야 완벽하지만, 
    -- 여기서는 user_profiles를 Active로 생성하여 매칭시킴.
    
    INSERT INTO public.user_profiles (id, email, name, role, status)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', '사용자'), 
      'therapist', 
      'active' -- ✨ 즉시 승인
    )
    ON CONFLICT (id) DO UPDATE
    SET status = 'active', role = 'therapist';

    -- therapists 테이블에 ID 업데이트가 필요할 수 있음 (이메일 매칭)
    -- 하지만 보통 therapists는 가입 전이라 ID가 UUID(Generate)일 수 있음.
    -- 가장 확실한 건 therapists에 insert가 아니라 update 하는 것.
    UPDATE public.therapists 
    SET id = new.id, name = COALESCE(new.raw_user_meta_data->>'name', name)
    WHERE email = new.email;

  ELSE
    -- [Case B] 신규 가입자: Pending 상태로 생성
    
    -- ✨ [Critical Fix] 이메일 충돌 방지: 기존에 같은 이메일을 쓰는 좀비 데이터가 있다면 삭제
    DELETE FROM public.user_profiles WHERE email = new.email AND id != new.id;
    DELETE FROM public.therapists WHERE email = new.email AND id != new.id;
    
    INSERT INTO public.user_profiles (id, email, name, role, status)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'name', '사용자'), 
      'therapist', -- 일단 치료사 롤 부여하지만
      'pending'    -- ✨ 승인 대기 상태
    );

    -- therapists 테이블에도 추가해야 목록에 뜸 (중요)
    -- therapists 테이블에도 추가해야 목록에 뜸 (중요)
    -- 이미 존재하면 무시 (중복 에러 방지)
    IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE email = new.email) THEN
        INSERT INTO public.therapists (id, name, email, color)
        VALUES (
            new.id, 
            COALESCE(new.raw_user_meta_data->>'name', '승인대기유저'), 
            new.email, 
            '#cbd5e1'
        );
    ELSE
        -- 이미 존재한다면 ID만이라도 맞춰줌 (혹시나 해서)
        UPDATE public.therapists SET id = new.id WHERE email = new.email;
    END IF;

    -- ✨ 승인 요청 알림 생성 (관리자용)
    INSERT INTO public.admin_notifications (type, message, user_id, is_read)
    VALUES ('new_user', '새로운 치료사 가입 요청이 있습니다.', new.id, false);

  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재설정 (안전을 위해 Drop 후 Create)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 확인용: 정책 확인
SELECT '✅ 회원가입 로직 업데이트 완료 (직접등록=자동승인, 신규=대기)' AS result;
