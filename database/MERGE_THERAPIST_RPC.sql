-- ============================================================
-- 🔄 [계정 통합] 수동 등록된 치료사 정보 -> 실제 가입 계정으로 병합
-- 1. therapists 테이블 정보 이관
-- 2. 기존 ID를 참조하던 하위 데이터(일정, 기록 등) ID 업데이트
-- 3. 권한 부여 및 승인 처리
-- ============================================================

CREATE OR REPLACE FUNCTION public.merge_and_approve_therapist(
    old_therapist_id UUID,  -- 수동 등록된 임의의 ID (목록에 있는 것)
    real_user_id UUID,      -- 실제 가입된 유저의 ID (auth.users)
    user_email TEXT,
    user_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    old_data RECORD;
BEGIN
    -- 1. 기존 수동 등록 데이터 조회
    SELECT * INTO old_data FROM public.therapists WHERE id = old_therapist_id;
    
    IF old_data IS NULL THEN
        -- 혹시 이미 처리되었거나 데이터가 없으면, 그냥 승인만 시도
        PERFORM public.update_user_role_safe(real_user_id, 'therapist', 'active', user_email, user_name);
        RETURN jsonb_build_object('success', true, 'message', '기존 데이터가 없어 승인만 처리했습니다.');
    END IF;

    -- 2. 실제 ID로 therapists 데이터 생성 (Upsert)
    -- 기존 수동 등록 데이터의 정보(색상, 비고 등)를 유지하며 생성
    INSERT INTO public.therapists (
        id, name, email, contact, hire_type, role, color, remarks, created_at
    ) VALUES (
        real_user_id, 
        COALESCE(old_data.name, user_name), -- 기존 입력된 이름 우선
        user_email,
        old_data.contact,
        old_data.hire_type,
        'therapist', -- role forced
        COALESCE(old_data.color, '#3b82f6'),
        old_data.remarks,
        NOW() -- created_at reload
    )
    ON CONFLICT (id) DO UPDATE
    SET
        contact = EXCLUDED.contact,
        hire_type = EXCLUDED.hire_type,
        color = EXCLUDED.color,
        remarks = EXCLUDED.remarks;

    -- 3. 🚨 [중요] ID 참조 업데이트 (Cascade Migration)
    -- 수동 등록된 ID로 연결된 일정(schedules)이 있다면 실제 ID러 변경해줘야 함
    -- (아직 치료사가 활동 전이라 데이터가 없을 확률이 높지만, 안전장치)
    UPDATE public.schedules SET therapist_id = real_user_id WHERE therapist_id = old_therapist_id;
    UPDATE public.counseling_logs SET therapist_id = real_user_id WHERE therapist_id = old_therapist_id;
    -- 개발 평가 등 다른 테이블이 있다면 추가...

    -- 4. 기존 수동 등록 레코드 삭제 (중복 방지)
    IF old_therapist_id != real_user_id THEN
        DELETE FROM public.therapists WHERE id = old_therapist_id;
    END IF;

    -- 5. 권한 승인 처리 (secure RPC 호출)
    PERFORM public.update_user_role_safe(real_user_id, 'therapist', 'active', user_email, user_name);

    -- 6. 알림 삭제
    DELETE FROM public.admin_notifications WHERE user_id IN (old_therapist_id, real_user_id) AND type = 'new_user';

    RETURN jsonb_build_object('success', true, 'message', '✅ 계정 통합 및 승인 완료');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', '통합 실패: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.merge_and_approve_therapist TO authenticated;

SELECT '✅ 계정 통합 RPC (merge_and_approve_therapist) 생성 완료' AS result;
