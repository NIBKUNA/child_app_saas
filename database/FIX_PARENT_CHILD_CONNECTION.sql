-- ============================================================
-- 👨‍👩‍👧 [FIX_PARENT_CHILD_CONNECTION] 부모-자녀 연결 가시성 해결
-- 1. family_relationships 테이블 RLS 정책 추가 (부모가 자신의 연결 확인 가능)
-- 2. children 테이블 RLS 정책 개선 (family_relationships에 연결된 부모 누구나 아동 조회 가능)
-- ============================================================

-- 1. family_relationships RLS 설정
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "p_fr_read_self" ON public.family_relationships;
DROP POLICY IF EXISTS "p_fr_all_admin" ON public.family_relationships;

-- 정책 생성
-- (1) 부모는 자신의 연결 관계를 볼 수 있어야 함
CREATE POLICY "p_fr_read_self" ON public.family_relationships
    FOR SELECT USING (parent_id = auth.uid());

-- (2) 관리자는 모든 관계를 볼 수 있어야 함
CREATE POLICY "p_fr_all_admin" ON public.family_relationships
    FOR ALL USING (public.is_admin());


-- 2. children 테이블 RLS 정책 업그레이드
-- 기존: parent_id 컬럼만 확인 (단일 부모)
-- 변경: family_relationships 테이블도 확인 (다중 부모)

DROP POLICY IF EXISTS "p_children_parent_read" ON public.children;

CREATE POLICY "p_children_parent_read" ON public.children
    FOR SELECT USING (
        -- 1. 직접적인 부모 (Legacy)
        parent_id = auth.uid()
        OR
        -- 2. 가족 관계 테이블에 등록된 부모 (Modern)
        EXISTS (
            SELECT 1 FROM public.family_relationships fr
            WHERE fr.child_id = id
            AND fr.parent_id = auth.uid()
        )
    );

SELECT '✅ 부모-자녀 연결 RLS 정책 수정 완료 (family_relationships & children)' AS result;
