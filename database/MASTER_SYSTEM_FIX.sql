-- ============================================================
-- � [MASTER_SYSTEM_FIX] 최종 통합 해결 스크립트
-- 1. 무한 재귀(Infinite Recursion) 원천 차단 (SECURITY DEFINER)
-- 2. 부모-자녀 연결 기반 조회 권한 (schedules, logs 등)
-- 3. 데이터 저장 무결성 (Upsert RPC 추가)
-- ============================================================

-- [1] 보안 함수 재정의 (RLS 우회 - 무한 재귀 방지)
-- is_admin, is_therapist는 테이블 정책의 핵심이므로 반드시 먼저 정의

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- 중요: 이 함수는 RLS를 체크하지 않고 실행됨
AS $$
BEGIN
    -- 서비스 롤 (Supabase Admin) 프리패스
    IF (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' THEN
        RETURN true;
    END IF;

    -- user_profiles 직접 조회
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_therapist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('therapist', 'super_admin', 'admin')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_therapist() TO authenticated;


-- [2] 테이블 RLS 정책 전면 재설정 (충돌 방지 위해 DROP 후 CREATE)

-- 2.1 user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_profiles_read_all" ON public.user_profiles;
DROP POLICY IF EXISTS "p_profiles_update_self_admin" ON public.user_profiles;

CREATE POLICY "p_profiles_read_all" ON public.user_profiles
    FOR SELECT USING (true); -- 누구나 읽기 가능

CREATE POLICY "p_profiles_update_self_admin" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2.2 family_relationships
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_fr_read" ON public.family_relationships;
DROP POLICY IF EXISTS "p_fr_write" ON public.family_relationships;

CREATE POLICY "p_fr_read" ON public.family_relationships
    FOR SELECT USING (parent_id = auth.uid() OR public.is_admin());

CREATE POLICY "p_fr_write" ON public.family_relationships
    FOR INSERT WITH CHECK (parent_id = auth.uid() OR public.is_admin());

-- 2.3 children (재귀의 핵심 - family_relationships을 통해서만 조회)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
-- 기존 정책 싹 지우기
DROP POLICY IF EXISTS "p_children_admin_all" ON public.children;
DROP POLICY IF EXISTS "p_children_parent_read" ON public.children;
DROP POLICY IF EXISTS "p_children_read" ON public.children;

CREATE POLICY "p_children_admin_all" ON public.children
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_children_parent_read" ON public.children
    FOR SELECT USING (
        -- 1. Legacy Parent ID 직접 일치
        parent_id = auth.uid()
        OR
        -- 2. Modern: 가족 관계 테이블에 있으면 OK
        EXISTS (
            SELECT 1 FROM public.family_relationships fr
            WHERE fr.child_id = children.id
            AND fr.parent_id = auth.uid()
        )
    );

-- 2.4 schedules (부모 조회 추가 요청 반영)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_schedules_admin_all" ON public.schedules;
DROP POLICY IF EXISTS "p_schedules_therapist_view" ON public.schedules;
DROP POLICY IF EXISTS "p_schedules_parent_view" ON public.schedules;

CREATE POLICY "p_schedules_admin_all" ON public.schedules
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_schedules_therapist_view" ON public.schedules
    FOR ALL USING ( therapist_id = auth.uid() );

CREATE POLICY "p_schedules_parent_view" ON public.schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = schedules.child_id
            AND (
                c.parent_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = c.id AND fr.parent_id = auth.uid())
            )
        )
    );

-- 2.5 counseling_logs (부모 조회 추가 요청 반영)
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_logs_admin_all" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_therapist_view" ON public.counseling_logs;
DROP POLICY IF EXISTS "p_logs_parent_view" ON public.counseling_logs;

CREATE POLICY "p_logs_admin_all" ON public.counseling_logs
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_logs_therapist_view" ON public.counseling_logs
    FOR ALL USING ( therapist_id = auth.uid() );

CREATE POLICY "p_logs_parent_view" ON public.counseling_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = counseling_logs.child_id
            AND (
                c.parent_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = c.id AND fr.parent_id = auth.uid())
            )
        )
    );

-- 2.6 development_assessments (발달 평가, Upsert 대비)
ALTER TABLE public.development_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_assess_admin_all" ON public.development_assessments;
DROP POLICY IF EXISTS "p_assess_therapist_view" ON public.development_assessments;
DROP POLICY IF EXISTS "p_assess_parent_view" ON public.development_assessments;

CREATE POLICY "p_assess_admin_all" ON public.development_assessments
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "p_assess_therapist_view" ON public.development_assessments
    FOR ALL USING ( therapist_id = auth.uid() );

CREATE POLICY "p_assess_parent_view" ON public.development_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.children c
            WHERE c.id = development_assessments.child_id
            AND (
                c.parent_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.family_relationships fr WHERE fr.child_id = c.id AND fr.parent_id = auth.uid())
            )
        )
    );


-- [3] Upsert 지원 RPC (Integrity Fix)

-- 3.1 발달 평가 안전 저장 (Upsert)
CREATE OR REPLACE FUNCTION public.upsert_assessment_safe(
    p_log_id UUID,
    p_child_id UUID,
    p_therapist_id UUID,
    p_content TEXT,
    p_score_communication INT,
    p_score_social INT,
    p_score_cognitive INT,
    p_score_motor INT,
    p_score_adaptive INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- 1. log_id 유효성 체크
    IF NOT EXISTS (SELECT 1 FROM public.counseling_logs WHERE id = p_log_id) THEN
        RETURN jsonb_build_object('success', false, 'message', '연결된 상담 일지가 존재하지 않습니다.');
    END IF;

    -- 2. Upsert 수행 (log_id 기준)
    INSERT INTO public.development_assessments (
        log_id, child_id, therapist_id,
        evaluation_content,
        score_communication, score_social, score_cognitive, score_motor, score_adaptive,
        evaluation_date
    ) VALUES (
        p_log_id, p_child_id, p_therapist_id,
        p_content,
        p_score_communication, p_score_social, p_score_cognitive, p_score_motor, p_score_adaptive,
        CURRENT_DATE
    )
    ON CONFLICT (log_id) DO UPDATE
    SET
        evaluation_content = EXCLUDED.evaluation_content,
        score_communication = EXCLUDED.score_communication,
        score_social = EXCLUDED.score_social,
        score_cognitive = EXCLUDED.score_cognitive,
        score_motor = EXCLUDED.score_motor,
        score_adaptive = EXCLUDED.score_adaptive,
        updated_at = NOW()
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_assessment_safe(UUID, UUID, UUID, TEXT, INT, INT, INT, INT, INT) TO authenticated;

-- 3.2 직원 정보 안전 업데이트 (User List에서 사용)
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
    target_user_id UUID,
    new_role TEXT,
    new_status TEXT,
    user_email TEXT,
    user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', '관리자 권한이 없습니다.');
    END IF;

    INSERT INTO public.user_profiles (id, email, name, role, status, updated_at)
    VALUES (target_user_id, user_email, user_name, new_role, new_status, NOW())
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        updated_at = NOW();

    IF new_role IN ('therapist', 'admin', 'super_admin') THEN
        INSERT INTO public.therapists (user_id, name, email, specialty, status)
        VALUES (target_user_id, user_name, user_email, '일반 치료사', new_status)
        ON CONFLICT (user_id) DO UPDATE
        SET status = EXCLUDED.status;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_role_safe(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

SELECT '✅ 최종 시스템 픽스 완료 (RLS 재귀 해결 + 부모 조회 권한 + Upsert + 무결성)' AS result;
