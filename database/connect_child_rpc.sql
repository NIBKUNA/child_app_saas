-- ✨ [아동 연결 RPC 함수] 보안 함수 생성
-- 이 쿼리를 Supabase SQL Editor에서 실행해주세요.

CREATE OR REPLACE FUNCTION connect_child_with_code(p_parent_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
    v_child_id UUID;
    v_child_name TEXT;
    v_exists BOOLEAN;
BEGIN
    -- 1. 유효한 코드인지 확인
    SELECT id, name INTO v_child_id, v_child_name
    FROM children
    WHERE invitation_code = UPPER(TRIM(p_code));

    IF v_child_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '유효하지 않은 초대 코드입니다.');
    END IF;

    -- 2. 이미 연결되어 있는지 확인
    SELECT EXISTS(
        SELECT 1 FROM family_relationships
        WHERE parent_id = p_parent_id AND child_id = v_child_id
    ) INTO v_exists;

    IF v_exists THEN
        RETURN jsonb_build_object('success', false, 'message', '이미 연결된 자녀입니다.');
    END IF;

    -- 3. 연결 생성 (family_relationships)
    INSERT INTO family_relationships (parent_id, child_id, relationship)
    VALUES (p_parent_id, v_child_id, 'parent');

    -- 4. 레거시 필드 업데이트 (선택 사항)
    UPDATE children SET parent_id = p_parent_id WHERE id = v_child_id;

    RETURN jsonb_build_object('success', true, 'child_name', v_child_name);
END;
$$;
