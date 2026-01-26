-- ============================================================
-- 🚀 ADD MISSING COLUMNS TO CENTERS TABLE
-- 해결: "Could not find column ... in centers" 오류 수정
-- ============================================================

-- 1. 운영 시간 관련 컬럼 추가
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS weekday_hours VARCHAR(100);
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS saturday_hours VARCHAR(100);
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS holiday_text VARCHAR(100);

-- 2. 지도 관련 컬럼 추가
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS naver_map_url TEXT;

-- 3. PostgREST 스키마 캐시 갱신 (선택사항이나 권장)
NOTIFY pgrst, 'reload schema';

-- 확인용 로그
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Centers table schema updated successfully.';
END $$;
