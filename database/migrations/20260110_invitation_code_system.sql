-- ============================================================
-- Zarada ERP: 초대 코드 시스템 (하위 호환성 유지)
-- 생성일: 2026-01-10
-- ============================================================

-- ============================================================
-- PART 1: 스키마 백업 (현재 children 테이블 구조 기록)
-- ============================================================

-- 현재 children 테이블 컬럼 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'children'
ORDER BY ordinal_position;

-- ============================================================
-- PART 2: invitation_code 컬럼 추가 (기존 데이터 보존)
-- ============================================================

-- 새 컬럼 추가 (NULL 허용, 기존 데이터에 영향 없음)
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS invitation_code VARCHAR(5) UNIQUE;

-- 인덱스 추가 (코드 검색 성능 향상)
CREATE UNIQUE INDEX IF NOT EXISTS idx_children_invitation_code 
ON public.children(invitation_code) 
WHERE invitation_code IS NOT NULL;

-- ============================================================
-- PART 3: 고유 초대 코드 생성 함수
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_code VARCHAR(5);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- 5자리 영문 대문자 + 숫자 조합 생성
        new_code := upper(substring(md5(random()::text) from 1 for 5));
        
        -- 중복 확인
        SELECT EXISTS (
            SELECT 1 FROM public.children WHERE invitation_code = new_code
        ) INTO code_exists;
        
        -- 중복 없으면 반환
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PART 4: 기존 아동에 초대 코드 자동 할당 (선택사항)
-- ============================================================

-- 코드가 없는 기존 아동에게 코드 할당
UPDATE public.children
SET invitation_code = public.generate_invitation_code()
WHERE invitation_code IS NULL;

-- ============================================================
-- PART 5: 신규 아동 등록 시 자동 코드 생성 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_generate_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    -- 초대 코드가 없으면 자동 생성
    IF NEW.invitation_code IS NULL THEN
        NEW.invitation_code := public.generate_invitation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS auto_invitation_code_trigger ON public.children;

-- 새 트리거 생성
CREATE TRIGGER auto_invitation_code_trigger
    BEFORE INSERT ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_invitation_code();

-- ============================================================
-- PART 6: family_relationships 테이블 (부모-자녀 연결)
-- ============================================================

-- 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    relationship VARCHAR(20) DEFAULT 'parent', -- parent, guardian 등
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 중복 방지
    CONSTRAINT unique_parent_child UNIQUE(parent_id, child_id)
);

-- RLS 활성화
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

-- 본인 관계만 조회 가능
CREATE POLICY "own_relationships" ON public.family_relationships
FOR SELECT USING (parent_id = auth.uid());

-- 관리자는 모든 관계 관리 가능
CREATE POLICY "admin_all_relationships" ON public.family_relationships
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('admin')
    )
    OR auth.email() = 'anukbin@gmail.com'
);

-- ============================================================
-- PART 7: 변경 사항 검증
-- ============================================================

-- children 테이블 새 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'children'
ORDER BY ordinal_position;

-- 샘플 초대 코드 확인
SELECT id, name, invitation_code FROM public.children LIMIT 5;

-- ============================================================
-- 완료 메시지
-- ============================================================
SELECT '✅ 초대 코드 시스템 마이그레이션 완료 (기존 데이터 보존됨)' AS status;
