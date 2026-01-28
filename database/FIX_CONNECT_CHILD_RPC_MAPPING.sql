-- ✨ [아동 연결 RPC 함수] 보안 함수 수정 (Parent ID 매핑 수정)
-- -----------------------------------------------------------
-- 🛠️ Created by: Antigravity
-- 📅 Date: 2026-01-28
-- 🖋️ Description: "UID와 Parent Table ID 간의 불일치 해결"

CREATE OR REPLACE FUNCTION connect_child_with_code(p_parent_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_parent_record_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- 1. 유효한 코드인지 확인
    SELECT id, name INTO v_child_id, v_child_name
    FROM public.children
    WHERE invitation_code = UPPER(TRIM(p_code));

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '유효하지 않은 초대 코드입니다.');
    END IF;

    -- 2. 이미 연결되어 있는지 확인 (Junction Table 기준)
    SELECT EXISTS(
        SELECT 1 FROM public.family_relationships
        WHERE parent_id = p_parent_id AND child_id = v_child_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', '이미 연결된 자녀입니다.');
    END IF;

    -- 3. parents 테이블에서 실제 parent_id (UUID PK) 찾기
    -- p_parent_id는 user_profiles.id (auth.uid()) 임
    SELECT id INTO v_parent_record_id FROM public.parents WHERE profile_id = p_parent_id;

    -- 4. 연결 생성 (family_relationships) - UID 기반
    INSERT INTO public.family_relationships (parent_id, child_id, relationship)
    VALUES (p_parent_id, v_child_id, 'parent');

    -- 5. 레거시 필드 업데이트 (children.parent_id) - Parents ID 기반
    IF v_parent_record_id IS NOT NULL THEN
        UPDATE public.children SET parent_id = v_parent_record_id WHERE id = v_child_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'child_name', v_child_name);
END;
$$;
