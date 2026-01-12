-- ============================================================
-- 🧟 [SYNC_LEGACY_DATA_V2] 미배포 라이브 사이트 심폐소생술 (수정판)
-- 컬럼명 'evaluation_content' 오류 수정 -> 'summary' 사용
-- ============================================================

-- 1. consultations 테이블이 없으면 생성
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

-- 3. 권한 부여
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.consultations TO authenticated;

DROP POLICY IF EXISTS "p_consultations_parent_view" ON public.consultations;
CREATE POLICY "p_consultations_parent_view" ON public.consultations FOR SELECT USING (true); 

-- 4. 데이터 동기화 (Sync) - 컬럼명 수정됨 (evaluation_content -> summary)
WITH assessment_data AS (
    SELECT 
        da.id,                 
        da.child_id,
        da.therapist_id,
        -- 여기서 da.summary를 우선 사용하고, 없으면 counseling_logs의 content 사용
        COALESCE(da.summary, cl.content, '상담 내용입니다.') as synced_content,
        da.created_at
    FROM public.development_assessments da
    LEFT JOIN public.counseling_logs cl ON da.log_id = cl.id
)
INSERT INTO public.consultations (id, child_id, therapist_id, content, created_at, status)
SELECT 
    id, child_id, therapist_id, synced_content, created_at, 'completed'
FROM assessment_data
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

SELECT '✅ (수정판) 구버전 테이블 데이터 동기화 완료. (summary 컬럼 사용)' AS result;
