-- ============================================================
-- 🛠️ [FIX_SCHEDULE_INSERT] 일정 등록 권한 및 관리자 복구
-- 1. zaradajoo@gmail.com 계정을 Super Admin으로 강력 복구
-- 2. schedules 테이블의 INSERT 정책을 명시적으로 분리하여 허용
-- ============================================================

-- 1. 관리자 권한 강제 복구
DO $$
DECLARE
    v_target_email TEXT := 'zaradajoo@gmail.com';
    v_user_id UUID;
BEGIN
    -- auth.users에서 ID 찾기
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;

    IF v_user_id IS NOT NULL THEN
        -- user_profiles 업데이트 (없으면 생성)
        INSERT INTO public.user_profiles (id, email, name, role, status)
        VALUES (v_user_id, v_target_email, 'Super Admin', 'super_admin', 'active')
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin', status = 'active';

        RAISE NOTICE '✅ 관리자 권한 복구 완료: %', v_target_email;
    ELSE
        RAISE NOTICE '⚠️ 해당 이메일의 유저를 찾을 수 없습니다: %', v_target_email;
    END IF;
END $$;

-- 2. schedules RLS 정책 보강 (INSERT 명시)
-- 기존 "p_schedules_admin_all" 정책이 있어도, PG 버전에 따라 INSERT 시 WITH CHECK 동작이 모호할 수 있으므로
-- 가장 명확한 INSERT 전용 정책을 추가합니다.

DROP POLICY IF EXISTS "p_schedules_admin_insert_explicit" ON public.schedules;

CREATE POLICY "p_schedules_admin_insert_explicit" ON public.schedules
    FOR INSERT WITH CHECK (
        public.is_admin() -- 관리자는 무조건 입력 가능
        OR
        therapist_id = auth.uid() -- 본인 일정 입력 가능
    );

-- RAISE NOTICE는 DO 블록 밖에서 사용할 수 없으므로 SELECT로 대체
SELECT '✅ schedules 테이블 INSERT 정책 보강 완료' AS log;

-- 3. is_admin 함수 재검증 (혹시 모를 캐시 문제 방지)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid();
    RETURN v_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ [FIX COMPLETED] 관리자 권한 복구 및 일정 등록 정책 수정됨' AS result;
