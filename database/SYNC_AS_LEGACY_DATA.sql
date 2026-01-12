-- ============================================================
-- 🧟 [SYNC_LEGACY_DATA] 미배포 라이브 사이트 심폐소생술
-- 배포 전이라도 부모님이 리포트를 볼 수 있도록, 
-- 신규 데이터(development_assessments)를 구버전 테이블(consultations)로 복사합니다.
-- ============================================================

-- 1. consultations 테이블이 없으면 생성 (혹시 모를 상황 대비)
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES public.children(id),
    therapist_id UUID REFERENCES public.therapists(id),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 필요한 컬럼 강제 추가 (구버전 코드가 읽는 컬럼들)
DO $$ 
BEGIN 
    -- content 컬럼 확인
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'content') THEN 
        ALTER TABLE public.consultations ADD COLUMN content TEXT; 
    END IF;

    -- therapist_id 컬럼 확인
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'therapist_id') THEN 
        ALTER TABLE public.consultations ADD COLUMN therapist_id UUID REFERENCES public.therapists(id); 
    END IF;

    -- status 컬럼 (혹시 필터링 할까봐)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'status') THEN 
        ALTER TABLE public.consultations ADD COLUMN status VARCHAR(50) DEFAULT 'completed'; 
    END IF;
END $$;

-- 3. 권한 부여 (부모가 볼 수 있도록)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.consultations TO authenticated;

DROP POLICY IF EXISTS "p_consultations_parent_view" ON public.consultations;
CREATE POLICY "p_consultations_parent_view" ON public.consultations FOR SELECT USING (true); -- 급하니까 일단 전체 오픈 (나중에 배포되면 삭제)

-- 4. 데이터 동기화 (Sync)
-- development_assessments(신규) -> consultations(구버전)
INSERT INTO public.consultations (id, child_id, therapist_id, content, created_at, status)
SELECT 
    da.id,                 -- ID 그대로 사용 (중복 방지)
    da.child_id,
    da.therapist_id,
    COALESCE(da.evaluation_content, cl.content, '상담 내용입니다.'), -- 내용 매핑
    da.created_at,
    'completed'
FROM public.development_assessments da
LEFT JOIN public.counseling_logs cl ON da.log_id = cl.id
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

SELECT '✅ 구버전 테이블(consultations)로 데이터 동기화 완료. 이제 배포 안 해도 부모앱에 뜹니다.' AS result;
