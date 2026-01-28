-- 🚨 [최종 복구 키트] 이 쿼리를 실행하면 모든 문제가 해결됩니다. 🚨

BEGIN;

-- 1. 발달 평가 테이블에 누락된 컬럼들 일괄 추가
-- (이미 존재하면 무시되므로 안전합니다)
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS assessment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS therapist_notes TEXT DEFAULT '';
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';

-- 2. 외래키 연결 복구 (상담 일지)
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_fkey;
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_profile_id_fkey;

-- 3. [데이터 보정] 잘못된 ID(프로필 ID)로 저장된 기록을 치료사 ID로 변환
-- (기존 데이터가 사라져 보였던 이유 해결)
UPDATE public.counseling_logs cl
SET therapist_id = t.id
FROM public.therapists t
WHERE cl.therapist_id = t.profile_id;

-- 4. 이제 안전하게 올바른 제약 조건 설정
ALTER TABLE public.counseling_logs 
ADD CONSTRAINT counseling_logs_therapist_id_fkey 
FOREIGN KEY (therapist_id) 
REFERENCES public.therapists(id) 
ON DELETE SET NULL;

-- 5. 방문자 통계 컬럼 추가
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS page_url TEXT;

-- 6. 스키마 캐시 강제 갱신을 위한 더미 업데이트
NOTIFY pgrst, 'reload schema';

COMMIT;
