-- 🏗️ [ZARADA SAAS] ROBUST CLEANUP & ANTI-GHOST INFRASTRUCTURE
-- Description: 1. 계정 탈퇴(Member Withdrawal) RPC
--              2. 센터 완전 삭제(Lethal Center Wipe) RPC
--              3. 유령 회원 방지 및 스토리지 정리 무결성 강화

-- 1. [Member Withdrawal] 사용자가 스스로 회원 탈퇴
CREATE OR REPLACE FUNCTION public.user_withdraw()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 1. 관계 끊기 (아동 데이터는 보존하되 부모 연결만 해제)
  UPDATE public.children SET parent_id = NULL WHERE parent_id = v_user_id;
  DELETE FROM public.family_relationships WHERE parent_id = v_user_id;
  
  -- 2. 알림 삭제
  DELETE FROM public.admin_notifications WHERE user_id = v_user_id;
  
  -- 3. 푸시 구독 삭제
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
  
  -- 4. parents 테이블 삭제 (부모 역할 데이터)
  DELETE FROM public.parents WHERE profile_id = v_user_id;
  
  -- 5. therapists 테이블 정리 (치료사 역할 데이터 - profile_id 연결 해제)
  UPDATE public.therapists SET profile_id = NULL WHERE profile_id = v_user_id;
  
  -- 6. 프로필 삭제
  DELETE FROM public.user_profiles WHERE id = v_user_id;
  
  -- 7. Auth 계정 완전 삭제 (SECURITY DEFINER로 auth.users 접근 가능)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. [Lethal Center Wipe] 슈퍼 어드민 전용 지점 완전 삭제
CREATE OR REPLACE FUNCTION public.admin_delete_center(target_center_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- 1. 권한 체크
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can wipe a center.';
  END IF;

  -- 2. 운영 데이터 삭제 (의존성 순서대로)
  DELETE FROM public.attendance WHERE center_id = target_center_id;
  DELETE FROM public.schedules WHERE center_id = target_center_id;
  DELETE FROM public.payments WHERE center_id = target_center_id;
  DELETE FROM public.counseling_logs WHERE center_id = target_center_id;
  DELETE FROM public.consultations WHERE center_id = target_center_id;
  DELETE FROM public.site_visits WHERE center_id = target_center_id;
  
  -- 3. 마스터 데이터 삭제
  DELETE FROM public.children WHERE center_id = target_center_id;
  DELETE FROM public.therapists WHERE center_id = target_center_id;
  DELETE FROM public.admin_settings WHERE center_id = target_center_id;
  DELETE FROM public.admin_notifications WHERE center_id = target_center_id;
  
  -- 4. 유저 프로필 및 Auth 연동 계정 정리 (지점 소속 유저들)
  DELETE FROM public.user_profiles WHERE center_id = target_center_id;

  -- 5. 지점 레코드 삭제
  DELETE FROM public.centers WHERE id = target_center_id;

  RAISE NOTICE 'Center % and all associated infrastructure successfully wiped.', target_center_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. [Trigger] Auth User 삭제 시 유령 프로필 방지
CREATE OR REPLACE FUNCTION public.on_auth_user_deleted()
RETURNS trigger AS $$
BEGIN
  -- Auth 계정이 지워지면 프로필과 모든 연계 데이터를 즉시 제거하여 유령 회원화를 방지
  DELETE FROM public.parents WHERE profile_id = OLD.id;
  DELETE FROM public.family_relationships WHERE parent_id = OLD.id;
  DELETE FROM public.push_subscriptions WHERE user_id = OLD.id;
  UPDATE public.therapists SET profile_id = NULL WHERE profile_id = OLD.id;
  DELETE FROM public.user_profiles WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auth_user_deleted ON auth.users;
CREATE TRIGGER tr_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_deleted();


-- ✅ 데이터 클린업 시스템 배포 완료
DO $$ BEGIN RAISE NOTICE '🏆 Zarada SaaS Data Integrity & Cleanup Infrastructure Implemented.'; END $$;
