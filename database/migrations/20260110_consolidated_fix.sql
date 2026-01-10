-- 🎨 Zarada ERP Consolidated Fix
-- -----------------------------------------------------------
-- 🛠️ Created by: 안욱빈 (An Uk-bin)
-- 📅 Date: 2026-01-10
-- 🖋️ Description: "테이블 생성 + 초대 코드 + RLS 정책 통합 수정"
-- ⚠️ 이 스크립트를 실행하면 모든 DB 문제가 해결됩니다.

-- ============================================================
-- [1] invitation_code 컬럼 추가 (없을 경우에만)
-- ============================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='children' AND column_name='invitation_code') THEN
        ALTER TABLE public.children ADD COLUMN invitation_code VARCHAR(5) UNIQUE;
        CREATE UNIQUE INDEX idx_children_invitation_code ON public.children(invitation_code) WHERE invitation_code IS NOT NULL;
    END IF;
END $$;

-- ============================================================
-- [2] 초대 코드 생성 함수 및 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_code VARCHAR(5);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 5));
        SELECT EXISTS (SELECT 1 FROM public.children WHERE invitation_code = new_code) INTO code_exists;
        IF NOT code_exists THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.auto_generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := public.generate_invitation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_invitation_code_trigger ON public.children;
CREATE TRIGGER auto_invitation_code_trigger
    BEFORE INSERT ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_invitation_code();

-- 기존 데이터 코드가 없으면 채우기
UPDATE public.children SET invitation_code = public.generate_invitation_code() WHERE invitation_code IS NULL;

-- ============================================================
-- [3] family_relationships 테이블 생성 (누락 방지)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    relationship VARCHAR(20) DEFAULT 'parent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_parent_child UNIQUE(parent_id, child_id)
);

ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_relationships" ON public.family_relationships;
CREATE POLICY "own_relationships" ON public.family_relationships FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_relationships" ON public.family_relationships;
CREATE POLICY "admin_all_relationships" ON public.family_relationships FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin')) OR auth.email() = 'anukbin@gmail.com'
);

-- ============================================================
-- [4] schedules 테이블 RLS 업데이트 (핵심 수정)
-- ============================================================
DROP POLICY IF EXISTS "Parents can view their children's schedules" ON schedules;
DROP POLICY IF EXISTS "Authenticated users can view schedules" ON schedules;

CREATE POLICY "Parents can view their children's schedules"
ON schedules FOR SELECT TO authenticated
USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()) OR
  child_id IN (SELECT child_id FROM family_relationships WHERE parent_id = auth.uid())
);

-- ============================================================
-- [5] consultations 및 children 테이블 RLS 업데이트
-- ============================================================
DROP POLICY IF EXISTS "Parents can view their children's consultations" ON consultations;
CREATE POLICY "Parents can view their children's consultations"
ON consultations FOR SELECT TO authenticated
USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()) OR
  child_id IN (SELECT child_id FROM family_relationships WHERE parent_id = auth.uid())
);

DROP POLICY IF EXISTS "Parents can view their own children" ON children;
CREATE POLICY "Parents can view their own children"
ON children FOR SELECT TO authenticated
USING (
  parent_id = auth.uid() OR
  id IN (SELECT child_id FROM family_relationships WHERE parent_id = auth.uid())
);

SELECT '✅ 모든 데이터베이스 구조 및 보안 정책 복구 완료' AS result;
