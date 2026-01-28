-- 💥 [ROOT CAUSE FIX] 땜빵 아님. 근본적인 DB 스키마 100% 동기화 💥

BEGIN;

-- 1. [테이블 컬럼 보강] 저장이 실패하는 근본 원인 제거
-- development_assessments 테이블에 없는 컬럼들을 강제로 생성합니다.
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS assessment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS therapist_notes TEXT DEFAULT '';
ALTER TABLE public.development_assessments ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';

-- 2. [데이터 무결성 복구] "사라진 일지" 되살리기
-- 과거 데이터가 '로그인 ID(profile_id)'를 사용하고 있어 '치료사 ID' 체계에서 보이지 않던 문제입니다.
-- 이를 감지하여 올바른 '치료사 ID'로 데이터를 이관합니다.
UPDATE public.counseling_logs cl
SET therapist_id = t.id
FROM public.therapists t
WHERE cl.therapist_id = t.profile_id  -- 잘못 연결된 링크 찾기
  AND cl.therapist_id != t.id;        -- 이미 정상인 것은 제외

-- 3. [관계 재설정] 외래키 제약조건 완전 초기화 및 재설정
-- 꼬여있는 참조 관계를 끊고 정석대로 다시 연결합니다.
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_fkey;
ALTER TABLE public.counseling_logs DROP CONSTRAINT IF EXISTS counseling_logs_therapist_id_profile_id_fkey;

-- 4. 올바른 제약 조건 적용 (therapists 테이블의 PK인 id를 참조)
ALTER TABLE public.counseling_logs 
ADD CONSTRAINT counseling_logs_therapist_id_fkey 
FOREIGN KEY (therapist_id) 
REFERENCES public.therapists(id) 
ON DELETE SET NULL;

-- 5. [방문자 통계] 누락된 컬럼 추가
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS page_url TEXT;

-- 6. 변경사항 즉시 반영을 위한 캐시 리로드
NOTIFY pgrst, 'reload schema';

COMMIT;
