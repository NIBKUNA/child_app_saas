-- ============================================================
-- 🧪 [시스템 무결성 검증] 자동 테스트 스크립트
-- 1. 권한 변경 (update_user_role_safe) 테스트
-- 2. 부모-아동 연결 (Foreign Key) 상태 확인
-- ============================================================

DO $$
DECLARE
    v_test_email TEXT := 'test_integrity_user@example.com';
    v_test_uid UUID := gen_random_uuid(); -- 가짜 UUID
    v_result JSONB;
    v_check_role TEXT;
    v_parent_link_count INT;
BEGIN
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE '🧪 시스템 무결성 검증 시작';
    RAISE NOTICE '---------------------------------------------------';

    -- [1] 권한 변경 함수 테스트 (가짜 유저로 시뮬레이션)
    -- 먼저 권한 변경 함수가 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_role_safe') THEN
        RAISE EXCEPTION '❌ [Critical] update_user_role_safe 함수가 없습니다!';
    END IF;

    -- 테스트용 프로필 생성 (존재한다고 가정)
    INSERT INTO public.user_profiles (id, email, name, role, status)
    VALUES (v_test_uid, v_test_email, 'Test User', 'parent', 'active');

    -- 함수 호출: Parent -> Therapist 승격 시도
    -- (실제로는 보안상 Admin만 호출 가능하므로, 이 블록은 SECURITY DEFINER 컨텍스트라 가정하거나 결과만 확인)
    v_result := public.update_user_role_safe(v_test_uid, 'therapist', 'active', v_test_email, 'Test Therapist');
    
    -- 결과 검증
    SELECT role INTO v_check_role FROM public.user_profiles WHERE id = v_test_uid;
    
    IF v_check_role = 'therapist' THEN
        RAISE NOTICE '✅ [Success] 권한 변경 함수 정상 작동 (Member promoted to Therapist)';
    ELSE
        RAISE NOTICE '❌ [Fail] 권한 변경 실패. 현재 역할: %', v_check_role;
    END IF;

    -- 테스트 데이터 정리
    DELETE FROM public.user_profiles WHERE id = v_test_uid;


    -- [2] 부모-아동 및 치료사 연결 상태 리포트
    SELECT COUNT(*) INTO v_parent_link_count FROM public.children WHERE parent_id IS NOT NULL;
    
    IF v_parent_link_count > 0 THEN
        RAISE NOTICE '✅ [Connection] 현재 %명의 아동이 부모 계정과 연결되어 있음 (정상)', v_parent_link_count;
    ELSE
        RAISE NOTICE '⚠️ [Warning] 부모 계정과 연결된 아동이 하나도 없습니다. (아직 연결 작업을 안 했을 수 있음)';
    END IF;

    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE '✨ 검증 완료';
END;
$$;
